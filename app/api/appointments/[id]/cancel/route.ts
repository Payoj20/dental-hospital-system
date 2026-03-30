import { invalidateAvailability } from "@/lib/availability/invalidate";
import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { createNotification } from "@/lib/notifications/notifications";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

const CANCEL_DEADLINE_MINS = 120;

//POST-Cancel Appointments
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer", "").trim();
    const decoded = await verifyFirebaseToken(token);

    const user = await db.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {doctor: {select: {name: true}}},
    });

    if (!appointment || appointment.userId !== user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    if(!["SCHEDULED", "CHECKED_IN"].includes(appointment.status)) {
      return NextResponse.json(
        {error: "Appointment cannot be cancelled"},
        {status: 400}
      )
    }

    //Cancel deadline
    const now = new Date();
    const minutesBeforeAppointment = (appointment.scheduleAt.getTime() - now.getTime()) /60000;

    if(minutesBeforeAppointment<CANCEL_DEADLINE_MINS) {
      const hoursLeft = Math.max(0, Math.floor(minutesBeforeAppointment/60));
      const minsLeft = Math.max(0, Math.floor(minutesBeforeAppointment%60));
      return NextResponse.json(
        {
          error: `Cancellation must be done at leat ${CANCEL_DEADLINE_MINS/60} hours before the appointment is in ${hoursLeft}h ${minsLeft}m. `,
          code: "Appointment cannot be cancelled",
        }, 
        {status:400}
      )
    }

    //Cancel appointments
    const updated = await db.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
      include: {
        doctor: { select: { name: true } },
      },
    });

    //Send cancel notification
    await createNotification(user.id, "CANCELLED", {
      date: updated.scheduleAt.toISOString(),
      doctorName: updated.doctor.name,
    });

    //Changed data
    await invalidateAvailability(
      appointment.doctorId,
      appointment.scheduleAt.toISOString().split("T")[0],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Cancel Failed" }, { status: 500 });
  }
}
