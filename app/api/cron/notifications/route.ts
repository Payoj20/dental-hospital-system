import { sendBrevoEmail } from "@/lib/email/brevo";
import {
  cancelledTemplate,
  completedTemplate,
  reminderTemplate,
  scheduleTemplate,
} from "@/lib/email/emailTemplate";
import { NotificationPayload } from "@/lib/notifications/notifications";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();

  //fetch up to 20 notification
  const notifications = await db.notification.findMany({
    where: {
      status: "PENDING",
      createdAt: { lte: now },
    },
    include: { user: true },
    take: 20,
  });

  //process each notification
  for (const n of notifications) {
    try {
      const payload =
        typeof n.payload === "object" && n.payload !== null
          ? (n.payload as NotificationPayload)
          : {};

      let subject = "";
      let html = "";

      const formatDate = (date: string) =>
        new Date(date).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

      switch (n.type) {
        case "SCHEDULED": {
          if (!payload.date || !payload.doctorName) break;

          subject = "Your Appointment is Confirmed";
          html = scheduleTemplate(
            n.user.fullName,
            formatDate(payload.date),
            payload.doctorName,
          );
          break;
        }

        case "REMINDER": {
          if (!payload.date || !payload.doctorName) break;

          subject = "Appointment Reminder";
          html = reminderTemplate(
            n.user.fullName,
            formatDate(payload.date),
            payload.doctorName,
          );
          break;
        }

        case "COMPLETED": {
          subject = "Visit Completed";
          html = completedTemplate(n.user.fullName);
          break;
        }

        case "CANCELLED": {
          if (!payload.date || !payload.doctorName) break;

          subject = "Appointment Cancelled";
          html = cancelledTemplate(
            n.user.fullName,
            formatDate(payload.date),
            payload.doctorName,
          );
          break;
        }
      }

      if (!subject || !html) {
        throw new Error(`Invalid payload for type ${n.type}`);
      }

      await sendBrevoEmail(n.user.email, subject, html);

      //Update notification
      await db.notification.update({
        where: { id: n.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } catch (error) {
      await db.notification.update({
        where: { id: n.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  return NextResponse.json({ processed: notifications.length });
}
