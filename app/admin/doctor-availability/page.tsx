"use client";

import DoctorList from "@/components/admin/DoctorList";
import ManageDoctorForm from "@/components/admin/ManageDoctorForm";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auth } from "@/lib/firebase/config";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuCalendarDays, LuInfo, LuStethoscope } from "react-icons/lu";

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  image?: string | null;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ManageAvailability = () => {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  //Fetch doctors
  useEffect(() => {
    const load = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch("/api/admin/doctor", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setDoctors(data.doctors ?? []);
    };

    load();
  }, []);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="max-w-7xl mx-auto px-6 py-28 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Doctor availability</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Manage leave, partial unavailability and schedule
            </p>
          </div>
        </div>
      </div>

      {/* Doctor + Date selector */}
      <Card className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Doctor */}
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

            {selectedDoctor ? (
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 space-y-1">
                <p className="text-sm font-medium">{selectedDoctor.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDoctor.specialization}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-3 flex items-center gap-2 text-muted-foreground">
                <LuInfo className="h-4 w-4 shrink-0" />
                <p className="text-xs">
                  Select a doctor to manage their availability
                </p>
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Date
              </label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LuCalendarDays className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">
                  {format(date, "EEEE, dd MMM yyyy")}
                </span>
                {isToday && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Today
                  </span>
                )}
              </div>
            </div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="rounded-lg border border-border"
            />
          </div>
        </div>
      </Card>

      {/* Availability controls */}
      {doctorId ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider px-3">
              {format(date, "dd MMM yyyy")} — {selectedDoctor?.name}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <ManageDoctorForm
              doctorId={doctorId}
              date={date}
              onUpdated={() => setRefreshKey((v) => v + 1)}
            />
            <DoctorList
              doctorId={doctorId}
              date={date}
              refreshKey={refreshKey}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-lg border border-dashed border-border">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <LuStethoscope className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">No doctor selected</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Select a doctor and date above to view and manage their availability
          </p>
        </div>
      )}
    </div>
  );
};

export default ManageAvailability;
