import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

//GET-User appointment history
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    //fetch appointment history
    const history = await db.appointment.findMany({
      where: {
        userId: user.id,
        status: {
          in: ["COMPLETED", "CANCELLED", "NO_SHOW"],
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
      orderBy: {
        scheduleAt: "desc",
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch the history" },
      { status: 500 }
    );
  }
}
