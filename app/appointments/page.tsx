"use client";

import AppointmentSkeletonCard from "@/components/appointmentSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase/config";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Appointment = {
  id: string;
  scheduleAt: string;
  durationMins: number;
  status: string;
  doctor: {
    name: string;
    specialization: string;
  };
};

export default function MyAppointmentPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          toast.error("Please login");
          return;
        }

        const res = await fetch("/api/appointments/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setAppointments(data.appointments ?? []);
      } catch (err) {
        toast.error("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleCancel = async (appointmentId: string) => {
    try {
      setCancellingId(appointmentId);

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Please login");
        return;
      }

      const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Cancel failed");
      }

      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));

      toast.success("Appointment cancelled!");
    } catch (error) {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-28">
        <h1 className="text-4xl font-bold mb-10 text-center">
          My Appointments
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <AppointmentSkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-28">
      <h1 className="text-4xl font-bold mb-10 text-center">My Appointments</h1>

      {appointments.length === 0 ? (
        <p className="text-muted-foreground text-center">
          No upcoming appointments.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg font-semibold">
                    {a.doctor.name}
                  </CardTitle>

                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs"
                  >
                    {a.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Date */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(a.scheduleAt).toLocaleDateString([], {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Time */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">
                    {new Date(a.scheduleAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{a.durationMins} mins</span>
                </div>

                <Button
                  className="w-full text-sm font-medium border border-red-500/30 bg-black mt-5 text-red-500 py-2 rounded-md transition hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={cancellingId === a.id}
                  onClick={() => handleCancel(a.id)}
                >
                  {cancellingId === a.id
                    ? "Cancelling..."
                    : "Cancel Appointment"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
