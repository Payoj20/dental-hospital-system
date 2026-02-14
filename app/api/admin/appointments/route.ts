import { NextResponse } from "next/server";
import { requireAdmin } from "../../auth/admin";
import { db } from "@/lib/prisma/prisma";

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

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    //Fetch all appointments for specific doctor
    const appointments = await db.appointment.findMany({
      where: {
        doctorId,
        scheduleAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        user: {
          select: { fullName: true, phoneNumber: true },
        },
      },
      orderBy: { scheduleAt: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }
}
