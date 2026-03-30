import { db } from "@/lib/prisma/prisma";
import { requireAdmin } from "../../auth/admin";
import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis/client";
import { RedisKeys, TTL } from "@/lib/redis/key";

type Doctor = {
  id: string;
  name: string;
  specialization: string | null;
}

//Fetch all doctors 
export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const redis = getRedis();
    const cacheKey = RedisKeys.doctorList();

    //Try cache
    const cached = await redis.get<Doctor[]>(cacheKey);
    if(cached) {
      return NextResponse.json({doctors: cached});
    }

    //Cache miss - fetch from db
    const doctors = await db.doctor.findMany({
      select: {
        id: true,
        name: true,
        specialization: true,
      },
      orderBy: { name: "asc" },
    });

    //Cache result
    await redis.set(cacheKey, JSON.stringify(doctors), {ex: TTL.doctorList});

    return NextResponse.json({ doctors });
  } catch (error) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
