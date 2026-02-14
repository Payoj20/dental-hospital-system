import { db } from "../prisma/prisma";

//GET- all doctors with their schedule
export async function getDoctorWithTodayUpdates() {
  const today = new Date();

  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  return db.doctor.findMany({
    select: {
      id: true,
      name: true,
      specialization: true,
      imageUrl: true,
      schedules: {
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
      },
      updates: {
        where: {
          type: "UNAVAILABLE",
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: {
          startTime: true,
          endTime: true,
          reason: true,
        },
      },
    },
  });
}

// Type export for frontend safety
export type DoctorWithTodayUpdates = Awaited<
  ReturnType<typeof getDoctorWithTodayUpdates>
>[number];
