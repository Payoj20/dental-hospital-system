import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

//update profile info
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer", "").trim();
    const decoded = await verifyFirebaseToken(token);

    const { fullName, dob, phoneNumber, address } = await req.json();

    const user = await db.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: {
        fullName,
        DOB: dob ? new Date(dob) : null,
        phoneNumber,
        address,
      },
      create: {
        firebaseUid: decoded.uid,
        email: decoded.email ?? "",
        fullName,
        role: "USER",
        DOB: dob ? new Date(dob) : null,
        phoneNumber,
        address,
      },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Profile update error", err);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 },
    );
  }
}
