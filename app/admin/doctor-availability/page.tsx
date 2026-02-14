"use client";

import DoctorList from "@/components/admin/DoctorList";
import ManageDoctorForm from "@/components/admin/ManageDoctorForm";
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
import { useEffect, useState } from "react";

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  image?: string | null;
};

const ManageAvailability = () => {
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
  return (
    <div className="max-w-7xl mx-auto px-6 py-28 space-y-8">
      <h1 className="text-3xl font-bold">Doctor Availability</h1>
      <p className="text-muted-foreground">
        Manage doctor leave, partial unavailability and schedules
      </p>

      {/* Select Doctor + Date */}
      <Card className="p-6 grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium">Doctor</label>
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger>
              <SelectValue placeholder="Select doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} {d.specialization && `- ${d.specialization}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Date</label>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
          />
        </div>
      </Card>

      {/* Availability Controls */}
      {doctorId && (
        <div className="grid md:grid-cols-2 gap-6">
          <ManageDoctorForm
            doctorId={doctorId}
            date={date}
            onUpdated={() => setRefreshKey((v) => v + 1)}
          />

          <DoctorList doctorId={doctorId} date={date} refreshKey={refreshKey} />
        </div>
      )}
    </div>
  );
};

export default ManageAvailability;
