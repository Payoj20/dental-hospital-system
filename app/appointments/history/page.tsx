"use client";

import AppointmentSkeletonCard from "@/components/appointmentSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/lib/firebase/config";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const CLINIC_TZ = process.env.NEXT_PUBLIC_CLINIC_TZ;

type Doctor = {id:string; name:string};

type Appointment = {
  id: string;
  scheduleAt: string;
  durationMins: number;
  status: string;
  notes: string | null;
  createdAt: string;
  cancelledAt?: string | null;
  doctor: {
    id:string;
    name: string;
    specialization: string;
  };
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  CANCELLED: "border-red-500/40 text-red-400 bg-red-500/10",
  NO_SHOW: "border-orange-500/40 text-orange-400 bg-orange-500/10",
};

const HistoryPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const activeDoctorRef = useRef<string>("all");

  const fetchHistory = useCallback(
    async (doctorId: string, cursorId?: string) => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) { toast.error("Please login"); return; }

        const params = new URLSearchParams();
        if (doctorId !== "all") params.set("doctorId", doctorId);
        if (cursorId) params.set("cursor", cursorId);

        const res = await fetch(`/api/appointments/history?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed");

        const data = await res.json();

        // Cursor pagination
        if (!cursorId) {
          setAppointments(data.history ?? []);
          if (data.doctors?.length) setDoctors(data.doctors);
        } else {
          setAppointments((prev) => [...prev, ...(data.history ?? [])]);
        }

        setHasMore(data.hasMore ?? false);
        setCursor(data.nextCursor ?? null);
      } catch {
        toast.error("Failed to load appointment history");
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchHistory("all").finally(() => setLoading(false));
  }, [fetchHistory]);

  // Filter change - reset + reload
  const handleDoctorChange = async (value: string) => {
    if (value === activeDoctorRef.current) return;
    activeDoctorRef.current = value;
    setSelectedDoctor(value);
    setLoading(true);
    setCursor(null);
    setAppointments([]);
    await fetchHistory(value);
    setLoading(false);
  };

  // Load more
  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    await fetchHistory(activeDoctorRef.current, cursor);
    setLoadingMore(false);
  };

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
    <div className="max-w-7xl mx-auto px-4 py-28 space-y-8">
      <h1 className="text-4xl font-bold text-center">Appointment History</h1>

      {/* Filter bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">Filter by doctor:</p>
        <Select value={selectedDoctor} onValueChange={handleDoctorChange}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All doctors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All doctors</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedDoctor !== "all" && (
          <Button
            variant="ghost"
            className="text-muted-foreground text-sm h-8 px-2"
            onClick={() => handleDoctorChange("all")}
          >
            Clear filter
          </Button>
        )}

        {!loading && (
          <p className="text-sm text-muted-foreground ml-auto">
            {appointments.length} result{appointments.length !== 1 ? "s" : ""}
            {hasMore ? "+" : ""}
          </p>
        )}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <AppointmentSkeletonCard key={i} />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 space-y-2">
          <p className="text-muted-foreground">
            {selectedDoctor !== "all"
              ? "No past appointments with this doctor."
              : "No past appointments found."}
          </p>
          {selectedDoctor !== "all" && (
            <Button
              variant="ghost"
              className="text-sm text-blue-500"
              onClick={() => handleDoctorChange("all")}
            >
              View all doctors
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((a) => (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg">{a.doctor.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${STATUS_STYLES[a.status] ?? ""}`}
                    >
                      {a.status.replace("_", " ")}
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
                      {new Date(a.scheduleAt).toLocaleTimeString("en-IN", {
                        timeZone: CLINIC_TZ,
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{a.durationMins} mins</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booked at</span>
                    <span className="font-medium">
                      {new Date(a.createdAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>

                  {a.notes && (
                    <div className="rounded-md bg-blue-500/5 border border-blue-500/20 px-3 py-2 mt-1">
                      <p className="text-xs text-muted-foreground mb-1">Reason</p>
                      <p className="text-xs text-blue-400 leading-relaxed">
                        {a.notes}
                      </p>
                    </div>
                  )}

                  {a.status === "CANCELLED" && a.cancelledAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cancelled at</span>
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

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="min-w-36"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPage;
