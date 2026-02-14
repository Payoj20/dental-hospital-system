import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

//POST-Auth session sync
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Token not found" }, { status: 401 });
    }

    //verify firebase token
    const decoded = await verifyFirebaseToken(idToken);

    //save user in Neon via Prisma
    await db.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: {
        email: decoded.email ?? "",
      },
      create: {
        firebaseUid: decoded.uid,
        email: decoded.email ?? "",
        fullName: decoded.name ?? "User",
        role: "USER",
      },
    });

    //fetch user from Db
    const user = await db.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    //check if profile is complete
    const isProfileCompleted = Boolean(
      user?.DOB && user?.phoneNumber && user?.address,
    );

    return NextResponse.json({ user, isProfileCompleted });
  } catch (error) {
    console.error("Auth session error", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
