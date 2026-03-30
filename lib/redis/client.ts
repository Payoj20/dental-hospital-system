import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export function getRedis() : Redis {
    if(!redisClient) {
        if(!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            throw new Error("Upstash url and token not found");
        }

        redisClient = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
    }

    return redisClient;
}