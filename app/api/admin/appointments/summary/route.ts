import { requireAdmin } from "@/app/api/auth/admin";
import { db } from "@/lib/prisma/prisma";
import { fromZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";

const SLOT_DURATION = 15;
const CLINIC_TZ = process.env.CLINIC_TZ || "Asia/Kolkata";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: "doctorId and date required" },
        { status: 400 },
      );
    }

    const dayStart = fromZonedTime(`${date} 00:00`, CLINIC_TZ);

    const dayEnd = fromZonedTime(`${date} 23:59`, CLINIC_TZ);

    const now = new Date();
    const isToday = now >= dayStart && now <= dayEnd;

    const dayOfWeek = dayStart.getDay();

    //GET doctors working for weekday 
    const schedule = await db.doctorSchedule.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId,
          dayOfWeek,
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({
        summary: {
          totalSlots: 0,
          availableSlots: 0,
          totalBooked: 0,
          scheduled: 0,
          checkedIn: 0,
          completed: 0,
          noShow: 0,
          cancelled: 0,
        },
      });
    }

    //Parse schedule start and end time
    let slotTime = fromZonedTime(
      `${date} ${schedule.startTime}`,
      CLINIC_TZ,
    );

    const endTime = fromZonedTime(
      `${date} ${schedule.endTime}`,
      CLINIC_TZ,
    );

    //Slot generation 15min 
    const allSlots: Date[] = [];
    while (slotTime < endTime) {
      allSlots.push(new Date(slotTime));
      slotTime = new Date(slotTime.getTime() + SLOT_DURATION * 60000);
    }

    //removes past slots 
    const validSlots = isToday ? allSlots.filter((s) => s > now) : allSlots;

    //fetch all appointments of doctor 
    const appointments = await db.appointment.findMany({
      where: {
        doctorId,
        scheduleAt: { gte: dayStart, lte: dayEnd },
      },
      select: { status: true },
    });

    const blockingAppointments = appointments.filter((a) =>
      ["SCHEDULED", "CHECKED_IN"].includes(a.status),
    );

    const summary = {
      totalSlots: allSlots.length,
      availableSlots: Math.max(
        validSlots.length - blockingAppointments.length,
        0,
      ),
      totalBooked: blockingAppointments.length,
      scheduled: appointments.filter((a) => a.status === "SCHEDULED").length,
      checkedIn: appointments.filter((a) => a.status === "CHECKED_IN").length,
      completed: appointments.filter((a) => a.status === "COMPLETED").length,
      noShow: appointments.filter((a) => a.status === "NO_SHOW").length,
      cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
    };

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
