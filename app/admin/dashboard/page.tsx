"use client";

import StatusDropdown from "@/components/admin/StatusDropdown";
import SummaryCard from "@/components/admin/SummaryCard";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/firebase/config";
import { format } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FaRegCalendarCheck } from "react-icons/fa";
import { LuLayoutGrid, LuCalendarPlus, LuCalendarDays, LuStethoscope, LuRefreshCw } from "react-icons/lu";
import { IoBarChartSharp } from "react-icons/io5";
import {
  FaUserCheck,
  FaCircleCheck,
  FaUserXmark,
  FaBan,
} from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

type Doctor = {
  id: string;
  name: string;
  specialization: string;
};

type Appointment = {
  id: string;
  scheduleAt: string;
  status: string;
  notes?:string | null;
  user: {
    fullName: string;
    phoneNumber?: string;
  };
};

type Summary = {
  totalSlots: number;
  availableSlots: number;
  totalBooked: number;
  scheduled: number;
  checkedIn: number;
  completed: number;
  noShow: number;
  cancelled: number;
};

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  CHECKED_IN: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
  NO_SHOW: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

const AdminAppointmentPage = () => {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const refreshingRef = useRef(false);
  const lastVersionRef = useRef<string | null>(null);

  //Fetching doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch("/api/admin/doctor", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setDoctors(data.doctors ?? []);
      } catch (error) {
        toast.error("Failed to fetch doctors");
      }
    };

    fetchDoctors();
  }, []);


  //Fetching appointments
  const refreshData = useCallback(async () => {
    if (!doctorId || refreshingRef.current) return;
    refreshingRef.current = true;

    try {
      setInitialLoading(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const formattedDate = format(date, "yyyy-MM-dd");

      const [appointmentsRes, summaryRes] = await Promise.all([
        fetch(
          `/api/admin/appointments?doctorId=${doctorId}&date=${formattedDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),

        fetch(
          `/api/admin/appointments/summary?doctorId=${doctorId}&date=${formattedDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ]);

      if (!appointmentsRes.ok || !summaryRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const appointmentData = await appointmentsRes.json();
      const summaryData = await summaryRes.json();

      setAppointments(appointmentData.appointments ?? []);
      setSummary(summaryData.summary ?? null);
      setLastRefreshed(new Date());
    } catch (error) {
      console.log(error);
      toast.error("Failed to refresh data");
    } finally {
      refreshingRef.current = false;
      setInitialLoading(false);
      setLoading(false);
    }
  }, [doctorId, date]);

  useEffect(() => {
    if (!doctorId) return;
    setLoading(true);
    setAppointments([]);
    setSummary(null);
    lastVersionRef.current = null;
    refreshData();
  }, [doctorId, date, refreshData]);

  //Auto refresh
  useEffect(() => {
    if (!doctorId) return;
    const interval = setInterval(async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const formattedDate = format(date, "yyyy-MM-dd");

        const res = await fetch(
          `/api/admin/appointments/version?doctorId=${doctorId}&date=${formattedDate}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const data = await res.json();
        if (!data.updatedAt) return;

        if (lastVersionRef.current !== data.updatedAt) {
          lastVersionRef.current = data.updatedAt;
          refreshData();
        }
      } catch {}
    }, 8000);

    return () => clearInterval(interval);
  }, [doctorId, date, refreshData]);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="max-w-7xl mx-auto px-4 py-28 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage daily appointments and patient check-ins
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-xs text-muted-foreground">
              Updated {format(lastRefreshed, "hh:mm:ss a")}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
            onClick={() => router.push("/admin/analytics")}
          >
            <IoBarChartSharp className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
            onClick={() => router.push("/admin/doctor-availability")}
          >
            <LuCalendarDays className="mr-2 h-4 w-4" />
            Availability
          </Button>
        </div>
      </div>

      {/* Doctor + Date selector */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Doctor select */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Doctor
            </label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <div className="flex items-center gap-2">
                      <LuStethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{d.name}</span>
                      {d.specialization && (
                        <span className="text-muted-foreground text-xs">
                          — {d.specialization}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected doctor info */}
            {selectedDoctor && (
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 space-y-1">
                <p className="text-sm font-medium">{selectedDoctor.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDoctor.specialization}
                </p>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Date
            </label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="rounded-lg border border-border"
            />
          </div>

          {/* Date summary */}
          <div className="flex flex-col justify-center gap-4">
            <div className="rounded-lg border border-border bg-muted/20 px-5 py-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Selected date
              </p>
              <p className="text-2xl font-bold">{format(date, "dd")}</p>
              <p className="text-sm text-muted-foreground">
                {format(date, "MMMM yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(date, "EEEE")}
              </p>
              {isToday && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Today
                </span>
              )}
            </div>

            {doctorId && (
              <Button
                variant="outline"
                size="sm"
                className="text-sm"
                disabled={initialLoading}
                onClick={refreshData}
              >
                <LuRefreshCw className={`mr-2 h-3.5 w-3.5 ${initialLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Summary cards */}
      {doctorId && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
          <SummaryCard
            label="Total slots"
            value={summary.totalSlots}
            icon={LuLayoutGrid}
            color="bg-slate-500/10 text-slate-400"
          />
          <SummaryCard
            label="Available"
            value={summary.availableSlots}
            icon={LuCalendarPlus}
            color="bg-teal-500/10 text-teal-400"
          />
          <SummaryCard
            label="Booked"
            value={summary.totalBooked}
            icon={FaRegCalendarCheck}
            color="bg-blue-500/10 text-blue-400"
          />
          <SummaryCard
            label="Checked in"
            value={summary.checkedIn}
            icon={FaUserCheck}
            color="bg-purple-500/10 text-purple-400"
          />
          <SummaryCard
            label="Completed"
            value={summary.completed}
            icon={FaCircleCheck}
            color="bg-emerald-500/10 text-emerald-400"
          />
          <SummaryCard
            label="No show"
            value={summary.noShow}
            icon={FaUserXmark}
            color="bg-orange-500/10 text-orange-400"
          />
          <SummaryCard
            label="Cancelled"
            value={summary.cancelled}
            icon={FaBan}
            color="bg-red-500/10 text-red-400"
          />
        </div>
      )}

      {/* Appointments table */}
      <Card className="overflow-hidden">
        {!doctorId ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <LuStethoscope className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No doctor selected</p>
            <p className="text-sm text-muted-foreground">
              Select a doctor above to view their appointments
            </p>
          </div>
        ) : initialLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Spinner className="text-blue-500 animate-spin h-5 w-5" />
            <span>Loading appointments...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <LuCalendarDays className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No appointments</p>
            <p className="text-sm text-muted-foreground">
              {selectedDoctor?.name} has no appointments on{" "}
              {format(date, "dd MMM yyyy")}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12 text-xs uppercase tracking-wider">#</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Time</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Patient</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Phone</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Complaint</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((a, index) => (
                <TableRow
                  key={a.id}
                  className="border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="text-muted-foreground text-sm">
                    {index + 1}
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-sm font-medium">
                      {new Date(a.scheduleAt).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </TableCell>

                  <TableCell className="font-medium">
                    {a.user.fullName}
                  </TableCell>

                  <TableCell className="text-muted-foreground text-sm font-mono">
                    {a.user.phoneNumber ?? (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </TableCell>

                  <TableCell className="max-w-[200px]">
                    {a.notes ? (
                      <span
                        className="text-xs text-blue-400 truncate block"
                        title={a.notes}
                      >
                        {a.notes}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <StatusDropdown
                      appointmentId={a.id}
                      currentStatus={a.status}
                      onUpdated={refreshData}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Footer */}
        {appointments.length > 0 && (
          <div className="border-t border-border/50 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} on{" "}
              {format(date, "dd MMM yyyy")}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {Object.entries(STATUS_BADGE).map(([status, cls]) => {
                const count = appointments.filter((a) => a.status === status).length;
                if (!count) return null;
                return (
                  <span
                    key={status}
                    className={`px-2 py-0.5 rounded-full border text-xs font-medium ${cls}`}
                  >
                    {count} {status.replace("_", " ").toLowerCase()}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAppointmentPage;
