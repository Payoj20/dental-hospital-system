"use client";

import { auth } from "@/lib/firebase/config";
import { format } from "date-fns";
import React, { useState } from "react";
import { toast } from "sonner";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type ManageDoctorFormProps = {
  doctorId: string;
  date: Date;
  onUpdated: () => void;
};

const ManageDoctorForm = ({
  doctorId,
  date,
  onUpdated,
}: ManageDoctorFormProps) => {
  const [fullDay, SetFullDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!doctorId) return;

    if (!fullDay && (!startTime || !endTime)) {
      toast.error("Start and end time required");
      return;
    }

    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch("/api/admin/doctor/updates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId,
          date: format(date, "yyyy-MM-dd"),
          startTime: fullDay ? null : startTime,
          endTime: fullDay ? null : endTime,
          reason,
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success("Doctor successfully set unavailable");
      setReason("");
      setStartTime("");
      setEndTime("");
      onUpdated();
    } catch (error) {
      console.error("Failed to mark", error);
      toast.error("Failed to set Doctor's unavailability");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card className="p-6 space-y-4">
      <h3 className="font-semibold text-lg">Manage Doctor Availability</h3>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={fullDay}
          onCheckedChange={(v) => SetFullDay(Boolean(v))}
        />
        <span>Full day unavailable</span>
      </div>

      {!fullDay && (
        <div className="flex gap-4">
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      )}

      <Input
        placeholder="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      <Button onClick={submit} disabled={loading}>
        Set Unavailable
      </Button>
    </Card>
  );
};

export default ManageDoctorForm;
