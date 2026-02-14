import { db } from "./prisma";

export const prismaUnsafe = db as any;
