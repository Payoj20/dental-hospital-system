import { invalidateAvailability } from "@/lib/availability/invalidate";
import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { createNotification } from "@/lib/notifications/notifications";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

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
    });

    if (!appointment || appointment.userId !== user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    //cancel appointments
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

    //send cancel notification
    await createNotification(user.id, "CANCELLED", {
      date: updated.scheduleAt.toISOString(),
      doctorName: updated.doctor.name,
    });

    //changed data
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
