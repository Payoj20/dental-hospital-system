import { prismaUnsafe } from "../prisma/prisma-unsafe";
import { fromZonedTime } from "date-fns-tz";

const CLINIC_TZ = process.env.CLINIC_TZ || "Asia/Kolkata";

type Slot = {
  start: string;
  end: string;
  booked: boolean;
};

type AppointmentRange = {
  start: Date;
  end: Date;
};

type UnavailableRange = {
  start: Date;
  end: Date;
  reason?: string | null;
};

export async function getDoctorAvailability(
  doctorId: string,
  date: string,
): Promise<Slot[]> {
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

  //GET-doctor working hous for weekday
  const schedule = await prismaUnsafe.doctorSchedule.findFirst({
    where: { doctorId, dayOfWeek },
  });

  if (!schedule) return [];

  const SLOT_DURATION = 15;
  const slots: Slot[] = [];

  const dayStart = fromZonedTime(
  `${date} ${schedule.startTime}`,
  CLINIC_TZ,
);


  const dayEnd = fromZonedTime(
    `${date} ${schedule.endTime}`,
    CLINIC_TZ,
  );

  //Fetch appointments
  const appointments: {
    scheduleAt: Date;
    durationMins: number;
  }[] = await prismaUnsafe.appointment.findMany({
    where: {
      doctorId,
      scheduleAt: {
        gte: dayStart,
        lt: dayEnd,
      },
      status: {
        in: ["SCHEDULED", "CHECKED_IN"],
      },
    },
    select: {
      scheduleAt: true,
      durationMins: true,
    },
  });

  //Converted appointments into time ranges
  const bookedRanges: AppointmentRange[] = appointments.map(
    (a: { scheduleAt: Date; durationMins: number }) => {
      const start = new Date(a.scheduleAt);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + a.durationMins);
      return { start, end };
    },
  );

  //Fetch unavailable blocks
  const unavailable: {
    startTime: string | null;
    endTime: string | null;
    reason: string | null;
  }[] = await prismaUnsafe.doctorUpdates.findMany({
    where: {
      doctorId,
      type: "UNAVAILABLE",
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  //Convert unavailable into time ranges
  const unavailableRanges: UnavailableRange[] = unavailable.map((u) => {
    if (!u.startTime || !u.endTime) {
      // Full day leave
      return {
        start: new Date(dayStart),
        end: new Date(dayEnd),
        reason: u.reason,
      };
    }

    const start = fromZonedTime(
      `${date} ${u.startTime}`,
      CLINIC_TZ,
    );

    const end = fromZonedTime(
      `${date} ${u.endTime}`,
      CLINIC_TZ,
    );

    return { start, end, reason: u.reason };
  });

  //slot generator
  let current = new Date(dayStart);

  while (current < dayEnd) {
    const slotEnd = new Date(current);
    slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION);

    if (slotEnd > dayEnd) break;

    const isBooked = bookedRanges.some(
      (b: AppointmentRange) => current >= b.start && current < b.end,
    );

    const isUnavailable = unavailableRanges.some(
      (u: UnavailableRange) => current < u.end && slotEnd > u.start,
    );

    if (!isUnavailable) {
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        booked: isBooked,
      });
    }

    current = slotEnd;
  }

  return slots;
}
