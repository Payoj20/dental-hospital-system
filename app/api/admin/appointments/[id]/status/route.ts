import { requireAdmin } from "@/app/api/auth/admin";
import { invalidateAvailability } from "@/lib/availability/invalidate";
import { createNotification } from "@/lib/notifications/notifications";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

const allowedStatuses: Record<string, string[]> = {
  SCHEDULED: ["CHECKED_IN", "NO_SHOW", "CANCELLED"],
  CHECKED_IN: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);

    const { id } = await params;

    const { status: nextStatus } = await req.json();

    //Fetch current appointment status
    const appointment = await db.appointment.findUnique({
      where: { id },
      select: {
        status: true,
        doctorId: true,
        scheduleAt: true,
        userId: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    const currentStatus = appointment.status;

    //Validate state transition
    const allowedNext = allowedStatuses[currentStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition: ${currentStatus} → ${nextStatus}`,
        },
        { status: 400 },
      );
    }

    const data: any = {
      status: nextStatus,
      completedAt: null,
      cancelledAt: null,
    };

    if (nextStatus === "COMPLETED") {
      data.completedAt = new Date();
      await createNotification(appointment.userId, "COMPLETED", {});
    }

    if (nextStatus === "CANCELLED") {
      data.cancelledAt = new Date();
      await createNotification(appointment.userId, "CANCELLED", {});
    }

    if (nextStatus === "NO_SHOW") {
      data.completedAt = new Date();
    }
    const updated = await db.appointment.update({
      where: { id },
      data,
    });

    //Data is changed 
    await invalidateAvailability(
      appointment.doctorId,
      appointment.scheduleAt.toISOString().split("T")[0],
    );

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }
}
