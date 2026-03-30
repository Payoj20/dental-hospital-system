import { requireAdmin } from "@/app/api/auth/admin";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

//POST- Mark doctor unavailable
export async function POST(req: Request) {
  try {
    await requireAdmin(req);

    const { doctorId, date, startTime, endTime, reason } = await req.json();

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: "doctorId and date required" },
        { status: 400 },
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const dateAsDateTime = new Date(date);

    //Unavailable record
    const update = await db.doctorUpdates.create({
      data: {
        doctorId,
        date: dateAsDateTime,
        type: "UNAVAILABLE",
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        reason,
      },
    });

    return NextResponse.json({ update });
  } catch (error) {
    console.error("POST /doctor/updates error:", error);
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to create unavailability record" },
      { status: 500 }
    );
  }
}

//GET-Fetch doctor unavailability
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

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    //fetch unavailable doctor
    const updates = await db.doctorUpdates.findMany({
      where: {
        doctorId,
        type: "UNAVAILABLE",
        date: {gte: dayStart, lte: dayEnd},
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ updates });
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch unavailability records" },
      { status: 500 }
    );
  }
}
