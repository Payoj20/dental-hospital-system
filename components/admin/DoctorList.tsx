"use client";
import { auth } from "@/lib/firebase/config";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";

type Update = {
  id: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

const DoctorList = ({
  doctorId,
  date,
  refreshKey,
}: {
  doctorId: string;
  date: Date;
  refreshKey: number;
}) => {
  const [updates, setUpdates] = useState<Update[]>([]);

  useEffect(() => {
    if (!doctorId) return;

    const load = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(
        `/api/admin/doctor/updates?doctorId=${doctorId}&date=${format(date, "yyyy-MM-dd")}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      setUpdates(data.updates ?? []);
    };

    load();
  }, [doctorId, date, refreshKey]);

  if (!updates.length) return null;
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-semibold text-red-600">Doctor Unavailable</h4>
      </div>

      <div className="space-y-2 text-sm">
        {updates.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between rounded-md bg-red-500/10 px-3 py-2 text-red-700"
          >
            <span>
              {u.startTime
                ? `${u.startTime} - ${u.endTime}`
                : "Full day unavailable"}
            </span>

            {u.reason && (
              <span className="text-xs text-red-500 italic">{u.reason}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorList;
