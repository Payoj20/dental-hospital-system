"use client";

import AppointmentSkeletonCard from "@/components/appointmentSkeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase/config";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Appointment = {
  id: string;
  scheduleAt: string;
  durationMins: number;
  status: string;
  createdAt: string;
  cancelledAt?: string | null;
  doctor: {
    name: string;
    specialization: string;
  };
};

const HistoryPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          toast.error("Please login");
          return;
        }

        const res = await fetch("/api/appointments/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch history");
        }

        const data = await res.json();
        setAppointments(data.history ?? []);
      } catch (error) {
        toast.error("Failed to load the appointment history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-28">
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
      <h1 className="text-4xl font-bold mb-10 text-center">
        Appointment History
      </h1>

      {appointments.length === 0 ? (
        <p className="text-muted-foreground text-center">
          No past appointment found.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-lg">{a.doctor.name}</CardTitle>

                  <Badge
                    variant="outline"
                    className={`
                                        text-xs
                                        ${
                                          a.status === "COMPLETED"
                                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                            : a.status === "CANCELLED"
                                              ? "border-red-500/40 text-red-400 bg-red-500/10"
                                              : "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                                        }`}
                  >
                    {a.status}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {a.doctor.specialization}
                </p>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(a.scheduleAt).toLocaleDateString([], {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">
                    {new Date(a.scheduleAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{a.durationMins} mins</span>
                </div>

                {/* Booked At */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booked At</span>
                  <span className="font-medium">
                    {new Date(a.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {/* Cancelled At (only if cancelled) */}
                {a.status === "CANCELLED" && a.cancelledAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cancelled At</span>
                    <span className="font-medium text-red-400">
                      {new Date(a.cancelledAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
