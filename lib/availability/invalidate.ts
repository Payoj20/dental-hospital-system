import { getRedis } from "../redis/client";
import { RedisKeys, TTL } from "../redis/key";

export async function invalidateAvailability(doctorId: string, date: string): Promise<void> {
  if(!doctorId || !date) {
    throw new Error("doctorId and date are required");
  }

  const redis = getRedis();
  const now = new Date().toISOString();

  await Promise.all([
    //Remove slot cache so next fetch recalculates fresh
    redis.del(RedisKeys.slots(doctorId, date)),

    //Update sync key so admin polling detects data changes
    redis.set(RedisKeys.sync(doctorId,date), now, {ex: TTL.sync}),
  ]);
}