"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/lib/firebase/config";
import { useEffect, useState } from "react";
import { FaBan, FaUserCheck } from "react-icons/fa";
import { FaCircleCheck, FaUserXmark } from "react-icons/fa6";
import { LuLayoutGrid, LuUsers } from "react-icons/lu";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsData = {
  dailyBookings: { date: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  doctorStats: {
    name: string;
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  }[];
  totals: {
    inRange: number;
    completed: number;
    cancelled: number;
    noShow: number;
    totalPatients: number;
    allTimeTotal: number;
  };
  days: number;
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#378ADD",
  CHECKED_IN: "#7F77DD",
  COMPLETED: "#1D9E75",
  CANCELLED: "#E24B4A",
  NO_SHOW: "#EF9F27",
};

const DOCTOR_COLORS = ["#378ADD", "#1D9E75", "#7F77DD", "#EF9F27", "#D85A30"];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoading(true);
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch(`/api/admin/analytics?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed");
        setData(await res.json());
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetch_();
  }, [days]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { totals, dailyBookings, statusBreakdown, doctorStats } = data;

  // Completion rate
  const completionRate =
    totals.inRange > 0
      ? Math.round((totals.completed / totals.inRange) * 100)
      : 0;

  // Pie chart label formatter
  const renderPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-28 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Appointment trends and clinic performance
          </p>
        </div>

        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          {
            label: "Total patients",
            value: totals.totalPatients,
            icon: LuUsers,
            color: "bg-blue-500/10 text-blue-500",
          },
          {
            label: "Booked (period)",
            value: totals.inRange,
            icon: LuLayoutGrid,
            color: "bg-purple-500/10 text-purple-500",
          },
          {
            label: "Completed",
            value: totals.completed,
            icon: FaCircleCheck,
            color: "bg-emerald-500/10 text-emerald-500",
          },
          {
            label: "Cancelled",
            value: totals.cancelled,
            icon: FaBan,
            color: "bg-red-500/10 text-red-500",
          },
          {
            label: "No shows",
            value: totals.noShow,
            icon: FaUserXmark,
            color: "bg-orange-500/10 text-orange-500",
          },
          {
            label: "Completion %",
            value: `${completionRate}%`,
            icon: FaUserCheck,
            color: "bg-teal-500/10 text-teal-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}
            >
              <Icon className="text-xl" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Daily bookings area chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Daily bookings — last {days} days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={dailyBookings}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#378ADD" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#888" }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(dailyBookings.length / 6)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#888" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 500 }}
                itemStyle={{ color: "#378ADD" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Bookings"
                stroke="#378ADD"
                strokeWidth={2}
                fill="url(#bookingGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#378ADD" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status breakdown + Doctor utilization */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Status breakdown (all time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {statusBreakdown.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? "#888"}
                      />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {value.replace("_", " ")}
                      </span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    formatter={(value, name) => [
                      value ?? 0,
                      typeof name === "string" ? name.replace("_", " ") : name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Doctor bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Doctor utilization (period)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {doctorStats.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={doctorStats}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#888" }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#888" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    labelStyle={{ color: "var(--foreground)", fontWeight: 500 }}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    stackId="a"
                    radius={0}
                  >
                    {doctorStats.map((_, i) => (
                      <Cell key={i} fill="#1D9E75" />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="cancelled"
                    name="Cancelled"
                    stackId="a"
                    radius={0}
                  >
                    {doctorStats.map((_, i) => (
                      <Cell key={i} fill="#E24B4A" />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="noShow"
                    name="No show"
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                  >
                    {doctorStats.map((_, i) => (
                      <Cell key={i} fill="#EF9F27" />
                    ))}
                  </Bar>
                  <Legend
                    formatter={(value) => (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {value}
                      </span>
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Doctor detail table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Doctor performance breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctorStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Doctor</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-right">Completed</th>
                    <th className="pb-3 font-medium text-right">Cancelled</th>
                    <th className="pb-3 font-medium text-right">No show</th>
                    <th className="pb-3 font-medium text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorStats.map((d, i) => {
                    const rate =
                      d.total > 0
                        ? Math.round((d.completed / d.total) * 100)
                        : 0;
                    return (
                      <tr
                        key={d.name}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{
                              background:
                                DOCTOR_COLORS[i % DOCTOR_COLORS.length],
                            }}
                          />
                          {d.name}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {d.total}
                        </td>
                        <td className="py-3 text-right text-emerald-400">
                          {d.completed}
                        </td>
                        <td className="py-3 text-right text-red-400">
                          {d.cancelled}
                        </td>
                        <td className="py-3 text-right text-orange-400">
                          {d.noShow}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`font-medium ${
                              rate >= 70
                                ? "text-emerald-400"
                                : rate >= 50
                                  ? "text-amber-400"
                                  : "text-red-400"
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
