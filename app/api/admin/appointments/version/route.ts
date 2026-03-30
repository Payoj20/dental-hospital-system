import { requireAdmin } from "@/app/api/auth/admin";
import { getRedis } from "@/lib/redis/client";
import { RedisKeys } from "@/lib/redis/key";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const { searchParams} = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if(!doctorId || !date) {
      return NextResponse.json(
        {error: "doctorId and date are required"},
        {status: 400}
      );
    }

    const redis = getRedis();
    const updatedAt= await redis.get<string>(RedisKeys.sync(doctorId,date));

    return NextResponse.json({updatedAt: updatedAt ?? null});
  } catch {
    return NextResponse.json({error: "Forbidden"}, {status: 403});
  }
}