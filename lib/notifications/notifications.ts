import { db } from "../prisma/prisma";

export async function createNotification(
  userId: string,
  type: "SCHEDULED" | "REMINDER" | "COMPLETED" | "CANCELLED",
  payload?: NotificationPayload,
) {
  await db.notification.create({
    data: {
      userId,
      type,
      payload: payload ?? {},
    },
  });
}

export type NotificationPayload = {
  date?: string;
  doctorName?: string;
};
