import { db } from "@/lib/prisma/prisma";
import { requireAdmin } from "../../auth/admin";
import { NextResponse } from "next/server";

//Fetch all doctors 
export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const doctors = await db.doctor.findMany({
      select: {
        id: true,
        name: true,
        specialization: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
