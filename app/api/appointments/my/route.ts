import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

//GET-User upcomming appointments
export async function GET(req: Request) {
  try {
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
      return NextResponse.json({ error: "USer not found" }, { status: 404 });
    }

    //fetch upcoming appointments
    const appointments = await db.appointment.findMany({
      where: {
        userId: user.id,
        status: {
          in: ["SCHEDULED", "CHECKED_IN"],
        },
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true,
          },
        },
      },
      orderBy: { scheduleAt: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
