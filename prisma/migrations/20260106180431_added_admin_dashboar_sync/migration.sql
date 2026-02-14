-- CreateTable
CREATE TABLE "AdminDashboardSync" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminDashboardSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminDashboardSync_doctorId_date_idx" ON "AdminDashboardSync"("doctorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AdminDashboardSync_doctorId_date_key" ON "AdminDashboardSync"("doctorId", "date");
