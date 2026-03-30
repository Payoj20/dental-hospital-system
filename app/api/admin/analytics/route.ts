import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { requireAdmin } from "../../auth/admin";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get("days") ?? "30"), 90);

    const since = startOfDay(subDays(new Date(), days - 1));
    const until = endOfDay(new Date());

    //Appointments
    const recentAppointments = await db.appointment.findMany({
      where: { createdAt: { gte: since, lte: until } },
      select: {
        createdAt: true,
        status: true,
        doctorId: true,
        doctor: { select: { name: true } },
      },
    });

    //Daily bookings
    const dailyMap = new Map<string, number>();

    for (let i = days - 1; i >= 0; i--) {
      const label = format(subDays(new Date(), i), "MMM d");
      dailyMap.set(label, 0);
    }

    for (const appt of recentAppointments) {
      const label = format(new Date(appt.createdAt), "MMM d");
      if (dailyMap.has(label)) {
        dailyMap.set(label, (dailyMap.get(label) ?? 0) + 1);
      }
    }

    const dailyBookings = Array.from(dailyMap.entries()).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    //Status breakdown
    const allStatuses = await db.appointment.groupBy({
      by: ["status"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const statusBreakdown = allStatuses.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    //Doctor
    const doctorMap = new Map<
      string,
      {
        name: string;
        total: number;
        completed: number;
        cancelled: number;
        noShow: number;
      }
    >();

    for (const appt of recentAppointments) {
      const entry = doctorMap.get(appt.doctorId) ?? {
        name: appt.doctor.name,
        total: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
      };
      entry.total++;
      if (appt.status === "COMPLETED") entry.completed++;
      if (appt.status === "CANCELLED") entry.cancelled++;
      if (appt.status === "NO_SHOW") entry.noShow++;
      doctorMap.set(appt.doctorId, entry);
    }

    const doctorStats = Array.from(doctorMap.values()).sort((a, b) => b.total-a.total);

    //Total Patients
    const [totalPatients, allTimeTotal] = await Promise.all([
      db.user.count({ where: { role: "USER" } }),
      db.appointment.count(),
    ]);

    const totals = {
      inRange: recentAppointments.length,
      completed: recentAppointments.filter((a) => a.status === "COMPLETED")
        .length,
      cancelled: recentAppointments.filter((a) => a.status === "CANCELLED")
        .length,
      noShow: recentAppointments.filter((a) => a.status === "NO_SHOW").length,
      totalPatients,
      allTimeTotal,
    };

    return NextResponse.json({
      dailyBookings,
      statusBreakdown,
      doctorStats,
      totals,
      days,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({error: "Failed to fetch analytics"}, {status: 500});
  }
}
