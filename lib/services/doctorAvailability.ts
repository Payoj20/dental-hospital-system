import { getRedis } from "../redis/client";
import { RedisKeys, TTL } from "../redis/key";
import { prismaUnsafe } from "../prisma/prisma-unsafe";
import { fromZonedTime } from "date-fns-tz";

const CLINIC_TZ = process.env.NEXT_PUBLIC_CLINIC_TZ || "Asia/Kolkata";

type Slot = {
  start: string;
  end: string;
  booked: boolean;
};

export type UnavailableBlock = {
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  isFullDay: boolean;
};

export type AvailabilityResult = {
  slots: Slot[];
  unavailableBlocks: UnavailableBlock[];
};

type AppointmentRange = {
  start: Date;
  end: Date;
};

type UnavailableRange = {
  start: Date;
  end: Date;
  reason: string | null;
};

export async function getDoctorAvailability(
  doctorId: string,
  date: string
): Promise<AvailabilityResult> {
  const redis = getRedis();
  const cacheKey = RedisKeys.slots(doctorId, date);

  const cached = await redis.get<AvailabilityResult>(cacheKey);
  if (cached) return cached;

  const result = await computeAvailability(doctorId, date);

  redis.set(cacheKey, JSON.stringify(result), { ex: TTL.slots }).catch(() => {
    console.warn("Redis: failed to cache slots for", cacheKey);
  });

  return result;
}

async function computeAvailability(
  doctorId: string,
  date: string
): Promise<AvailabilityResult> {
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

  const schedule = await prismaUnsafe.doctorSchedule.findFirst({
    where: { doctorId, dayOfWeek },
  });

  if (!schedule) {
    return { slots: [], unavailableBlocks: [] };
  }

  const SLOT_DURATION = 15;
  const dayStart = fromZonedTime(`${date} ${schedule.startTime}`, CLINIC_TZ);
  const dayEnd = fromZonedTime(`${date} ${schedule.endTime}`, CLINIC_TZ);

  // Fetch active appointments
  const appointments: { scheduleAt: Date; durationMins: number }[] =
    await prismaUnsafe.appointment.findMany({
      where: {
        doctorId,
        scheduleAt: { gte: dayStart, lt: dayEnd },
        status: { in: ["SCHEDULED", "CHECKED_IN"] },
      },
      select: { scheduleAt: true, durationMins: true },
    });

  const bookedRanges: AppointmentRange[] = appointments.map((a) => {
    const start = new Date(a.scheduleAt);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + a.durationMins);
    return { start, end };
  });

  // Fetch unavailability records
  const unavailableRecords: {
    startTime: string | null;
    endTime: string | null;
    reason: string | null;
  }[] = await prismaUnsafe.doctorUpdates.findMany({
    where: {
      doctorId,
      type: "UNAVAILABLE",
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  // Build unavailable blocks for UI display
  const unavailableBlocks: UnavailableBlock[] = unavailableRecords.map((u) => ({
    startTime: u.startTime,
    endTime: u.endTime,
    reason: u.reason,
    isFullDay: !u.startTime || !u.endTime,
  }));

  // Build time ranges for slot filtering
  const unavailableRanges: UnavailableRange[] = unavailableRecords.map((u) => {
    if (!u.startTime || !u.endTime) {
      return { start: new Date(dayStart), end: new Date(dayEnd), reason: u.reason };
    }
    const start = fromZonedTime(`${date} ${u.startTime}`, CLINIC_TZ);
    const end = fromZonedTime(`${date} ${u.endTime}`, CLINIC_TZ);
    return { start, end, reason: u.reason };
  });

  // Generate slots
  const slots: Slot[] = [];
  let current = new Date(dayStart);

  while (current < dayEnd) {
    const slotEnd = new Date(current);
    slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION);
    if (slotEnd > dayEnd) break;

    const isBooked = bookedRanges.some(
      (b) => current >= b.start && current < b.end
    );
    const isUnavailable = unavailableRanges.some(
      (u) => current < u.end && slotEnd > u.start
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

  return { slots, unavailableBlocks };
}