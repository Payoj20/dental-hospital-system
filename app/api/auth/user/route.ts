import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

//GET-authenticated user
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
        fullName: true,
        email: true,
        DOB: true,
        phoneNumber: true,
        address: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_INITIALIZED" },
        { status: 404 },
      );
    }

    const isProfileCompleted = Boolean(
      user.DOB && user.phoneNumber && user.address,
    );

    return NextResponse.json({
      ...user,
      isProfileCompleted,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
