/*
  Warnings:

  - You are about to drop the column `read` on the `Notification` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "read",
ADD COLUMN     "error" TEXT,
ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");
