import { requireAdmin } from "@/app/api/auth/admin";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

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

    //find the last update record of doctor
    const record = await db.adminDashboardSync.findUnique({
      where: {
        doctorId_date: {
          doctorId,
          date,
        },
      },
      select: { updatedAt: true },
    });

    return NextResponse.json({
      updatedAt: record?.updatedAt || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
