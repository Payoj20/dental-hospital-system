const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctor.deleteMany();

  console.log("Old data was removed successfully!");
  // Create doctors
  await prisma.doctor.createMany({
    data: [
      {
        name: "Dr. Sakura Haruno",
        specialization: "Endodontist",
        imageUrl: "/doctors/sakura.png",
      },
      {
        name: "Dr. Tsunade",
        specialization: "Orthodontist",
        imageUrl: "/doctors/tsunade.png",
      },
      {
        name: "Dr. Retsu Unohana",
        specialization: "Prosthodontist",
        imageUrl: "/doctors/retsu.png",
      },
    ],
  });

  // Fetch doctors
  const sakura = await prisma.doctor.findFirst({
    where: { name: "Dr. Sakura Haruno" },
  });

  const tsunade = await prisma.doctor.findFirst({
    where: { name: "Dr. Tsunade" },
  });

  const retsu = await prisma.doctor.findFirst({
    where: { name: "Dr. Retsu Unohana" },
  });

  // Sakura: Mon–Sat (10:00–16:00)
  await prisma.doctorSchedule.createMany({
    data: [1, 2, 3, 4, 5, 6].map((day) => ({
      doctorId: sakura.id,
      dayOfWeek: day,
      startTime: "10:00",
      endTime: "16:00",
    })),
  });

  // Tsunade: Tue & Thu
  await prisma.doctorSchedule.createMany({
    data: [
      {
        doctorId: tsunade.id,
        dayOfWeek: 2,
        startTime: "19:00",
        endTime: "21:00",
      },
      {
        doctorId: tsunade.id,
        dayOfWeek: 4,
        startTime: "11:00",
        endTime: "14:00",
      },
    ],
  });

  // Retsu: Mon–Sat (18:00–21:00)
  await prisma.doctorSchedule.createMany({
    data: [1, 2, 3, 4, 5, 6].map((day) => ({
      doctorId: retsu.id,
      dayOfWeek: day,
      startTime: "18:00",
      endTime: "21:00",
    })),
  });

  console.log("Data added successfully");
}

main()
  .catch((error) => {
    console.error("Failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
