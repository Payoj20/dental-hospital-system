import { db } from "@/lib/prisma/prisma";

export async function invalidateAvailability(
  doctorId: string,
  date: string
) {
  if (!doctorId || !date) {
    throw new Error("invalidateAvailability: invalid arguments");
  }

  await db.adminDashboardSync.upsert({
    where: {
      doctorId_date: {
        doctorId,
        date,
      },
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      doctorId,
      date,
      updatedAt: new Date(),
    },
  });
}