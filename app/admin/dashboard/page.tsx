"use client";

import StatusDropdown from "@/components/admin/StatusDropdown";
import SummayCard from "@/components/admin/SummayCard";
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
import { LuLayoutGrid, LuCalendarPlus } from "react-icons/lu";
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

const AdminAppointmentPage = () => {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(false);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-28 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Appointments Management</h1>
        <p className="text-muted-foreground">
          Select doctor and date to manage appointments
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/*Doctor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Doctor</label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger className="mt-5">
                <SelectValue placeholder="Select Doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                    {d.specialization && ` -${d.specialization}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/*Calendar */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
            />
          </div>

          <div className="flex items-center justify-center text-center">
            <div>
              <p className="text-xs text-muted-foreground">Selected Date</p>
              <p className="text-lg font-semibold">
                {format(date, "dd MMM yyyy")}
              </p>

              <Button
                variant="outline"
                className="mt-3 text-blue-500 hover:text-blue-600"
                onClick={() => router.push("/admin/doctor-availability")}
              >
                Manage Availability
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/*Summary */}
      {doctorId && summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <SummayCard
            label="Total Slots"
            value={summary.totalSlots}
            icon={LuLayoutGrid}
            color="bg-blue-500/10 text-blue-500"
          />

          <SummayCard
            label="Available Slots"
            value={summary.availableSlots}
            icon={LuCalendarPlus}
            color="bg-blue-500/10 text-blue-500"
          />

          <SummayCard
            label="Total Booked"
            value={summary.totalBooked}
            icon={FaRegCalendarCheck}
            color="bg-blue-500/10 text-blue-500"
          />

          <SummayCard
            label="Checked In"
            value={summary.checkedIn}
            icon={FaUserCheck}
            color="bg-blue-500/10 text-blue-500"
          />

          <SummayCard
            label="Completed"
            value={summary.completed}
            icon={FaCircleCheck}
            color="bg-blue-500/10 text-blue-500"
          />

          <SummayCard
            label="No Show"
            value={summary.noShow}
            icon={FaUserXmark}
            color="bg-blue-500/10 text-blue-500"
          />

          <SummayCard
            label="Cancelled"
            value={summary.cancelled}
            icon={FaBan}
            color="bg-blue-500/10 text-blue-500"
          />
        </div>
      )}

      {/* RESULT */}
      <Card className="p-10 text-center">
        {!doctorId ? (
          <p className="text-muted-foreground">Please select a doctor</p>
        ) : initialLoading ? (
          <p className="text-muted-foreground justify-center items-center flex">
            <Spinner className="text-blue-500 animate-spin mr-1" />
            Loading appointments
          </p>
        ) : appointments.length === 0 ? (
          <p className="text-muted-foreground">
            No appointments for selected doctor on this date
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {appointments.map((a, index) => (
                <TableRow key={a.id}>
                  {/*number */}
                  <TableCell className="font-medium text-left">
                    {index + 1}
                  </TableCell>

                  {/*Time */}
                  <TableCell className="text-left">
                    {new Date(a.scheduleAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>

                  {/*PatientName */}
                  <TableCell className="font-medium text-left">
                    {a.user.fullName}
                  </TableCell>

                  {/*Phone */}
                  <TableCell className="text-muted-foreground text-left">
                    {a.user.phoneNumber ?? "-"}
                  </TableCell>

                  {/*Status */}
                  <TableCell className="text-left">
                    <StatusDropdown
                      appointmentId={a.id}
                      currentStatus={a.status}
                      onUpdated={refreshData}
                    />
                  </TableCell>

                  {/*Action */}
                  <TableCell className="text-muted-foreground text-right">
                    -
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminAppointmentPage;
