import { invalidateAvailability } from "@/lib/availability/invalidate";
import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { createNotification } from "@/lib/notifications/notifications";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

//POST-Book appointment
export async function POST(req: Request) {
  try {
    //auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer", "").trim();
    const decoded = await verifyFirebaseToken(token);

    //get the user
    const user = await db.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    //input
    const { doctorId, startTime, durationMins } = await req.json();

    if (!doctorId || !startTime || !durationMins) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + durationMins);

    //Prevent past booking
    if (start < new Date()) {
      return NextResponse.json(
        { error: "Cannot book past slots" },
        { status: 400 },
      );
    }

    const doctor = await db.doctor.findUnique({
      where: { id: doctorId },
      select: { name: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(start);
    dayEnd.setHours(23, 59, 59, 999);

    //check doctor unavailable
    const startTimeStr = start.toTimeString().slice(0, 5);

    const unavailable = await db.doctorUpdates.findFirst({
      where: {
        doctorId,
        type: "UNAVAILABLE",
        date: { gte: dayStart, lte: dayEnd },
        OR: [
          //full day unavailable
          { startTime: null, endTime: null },

          //for some time
          {
            startTime: { lte: startTimeStr },
            endTime: { gt: startTimeStr },
          },
        ],
      },
    });

    if (unavailable) {
      return NextResponse.json(
        {
          error: "Doctor is unavailable",
          reason: unavailable.reason || "Doctor is not available at this time",
        },
        { status: 409 },
      );
    }

    //appointment already exist for the user
    const existing = await db.appointment.findFirst({
      where: {
        userId: user.id,
        doctorId,
        status: {
          in: ["SCHEDULED", "CHECKED_IN"],
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have an active appointment with this doctor" },
        { status: 409 },
      );
    }

    //no overlap
    const conflict = await db.appointment.findFirst({
      where: {
        doctorId,
        status: {
          in: ["SCHEDULED", "CHECKED_IN"],
        },
        NOT: {
          OR: [{ scheduleAt: { gte: end } }, { scheduleAt: { lt: start } }],
        },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Slot already booked" },
        { status: 409 },
      );
    }

    //save appointment
    const appointment = await db.appointment.create({
      data: {
        userId: user.id,
        doctorId,
        scheduleAt: start,
        durationMins,
      },
    });

    //send confirmed notification
    await createNotification(user.id, "SCHEDULED", {
      date: start.toISOString(),
      doctorName: doctor.name,
    });

    const reminderTime = new Date(start);
    reminderTime.setMinutes(reminderTime.getMinutes() - 15);

    await db.notification.create({
      data: {
        userId: user.id,
        type: "REMINDER",
        payload: {
          date: start.toISOString(),
          doctorName: doctor.name,
        },
        createdAt: reminderTime, // scheduled time
      },
    });

    //data changed
    await invalidateAvailability(
      appointment.doctorId,
      appointment.scheduleAt.toISOString().split("T")[0],
    );

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
