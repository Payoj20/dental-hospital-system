-- CreateEnum
CREATE TYPE "UpdatesType" AS ENUM ('UNAVAILABLE', 'EXTRA_HOURS', 'EXTRA_SLOTS');

-- CreateTable
CREATE TABLE "DoctorUpdates" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "UpdatesType" NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorUpdates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DoctorUpdates" ADD CONSTRAINT "DoctorUpdates_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
