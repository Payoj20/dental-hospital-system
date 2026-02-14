"use client";
import { auth } from "@/lib/firebase/config";
import React from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../ui/select";

const STATUS_ALLOWED: Record<string, string[]> = {
  SCHEDULED: ["CHECKED_IN", "NO_SHOW", "CANCELLED"],
  CHECKED_IN: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

type StatusDropdownProps = {
  appointmentId: string;
  currentStatus: string;
  onUpdated: (status: string) => void;
};

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  appointmentId,
  currentStatus,
  onUpdated,
}) => {
  const allowedStatuses = STATUS_ALLOWED[currentStatus] || [];

  if (allowedStatuses.length === 0) {
    return (
      <span className="text-sm font-medium text-muted-foreground">
        {currentStatus}
      </span>
    );
  }

  const updateStatus = async (status: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Only admin can access this feature");
        return;
      }

      //send patch req to admin api
      const res = await fetch(
        `/api/admin/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      onUpdated(status);
      toast.success(`Status updated to ${status}!`);
    } catch (error) {
      toast.error("Failed to update status!");
    }
  };
  return (
    <Select value={currentStatus} onValueChange={updateStatus}>
      <SelectTrigger className="w-[150px]">
        <span className="text-sm font-medium">{currentStatus}</span>
      </SelectTrigger>

      <SelectContent>
        {allowedStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusDropdown;
