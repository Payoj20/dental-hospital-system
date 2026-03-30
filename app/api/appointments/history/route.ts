import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { db } from "@/lib/prisma/prisma";
import { AppointmentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const PAGE_SIZE =9;

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

    const {searchParams} = new URL(req.url);
    const doctorId = searchParams.get("doctorId") || undefined;
    const cursor = searchParams.get('cursor') || undefined;
    const statusParam = searchParams.get("status");

    const statuses = (
      statusParam
        ? statusParam.split(",")
        : ["COMPLETED", "CANCELLED", "NO_SHOW"]
    ) as AppointmentStatus[];


    //Fetch appointment history
    const history = await db.appointment.findMany({
      where: {
        userId: user.id,
        status: { in: statuses}, ...(doctorId ? {doctorId} : {}),
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
      orderBy: {
        scheduleAt: "desc",
      },
      take: PAGE_SIZE+1,
      //Cursor pagination
      ...(cursor ? {cursor: {id:cursor}, skip:1}: {}),
    });

    const hasMore = history.length > PAGE_SIZE;
    const page = hasMore ? history.slice(0, PAGE_SIZE): history;
    const nextCursor = hasMore ? page[page.length-1].id: null;

    let doctors: {id:string; name:string}[] = [];
    if(!cursor) {
      const distinctDoctors = await db.appointment.findMany({
        where: {
          userId: user.id,
          status: {in: ["COMPLETED", "CANCELLED", "NO_SHOW"]},
        },
        select: {
          doctor: {select: {id: true, name: true}},
        },
        distinct: ["doctorId"],
        orderBy : {doctor: {name: "asc"}},
      });
      doctors= distinctDoctors.map((a)=> a.doctor);
    }

    return NextResponse.json({ history: page, nextCursor, hasMore, doctors });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch the history" },
      { status: 500 }
    );
  }
}
