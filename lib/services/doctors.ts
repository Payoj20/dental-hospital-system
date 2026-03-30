import { format } from "date-fns";
import { db } from "../prisma/prisma";
import { fromZonedTime } from "date-fns-tz";

//GET- all doctors with their schedule
const CLINIC_TZ = process.env.NEXT_PUBLIC_CLINIC_TZ || "Asia/Kolkata";

export async function getDoctorWithTodayUpdates() {
  // Get today's date string in the clinic's timezone, not the server's
  const nowInClinic = new Date(
    new Date().toLocaleString("en-US", { timeZone: CLINIC_TZ })
  );
  const todayStr = format(nowInClinic, "yyyy-MM-dd");

  // Convert clinic-local midnight → UTC for Prisma query
  const dayStart = fromZonedTime(`${todayStr} 00:00:00`, CLINIC_TZ);
  const dayEnd = fromZonedTime(`${todayStr} 23:59:59`, CLINIC_TZ);

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
