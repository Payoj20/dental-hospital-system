import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

//GET-current user info
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
      select: {
        id: true,
        role: true,
        fullName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      role: user.role,
      fullName: user.fullName,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
