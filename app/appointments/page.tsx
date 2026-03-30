"use client";

import AppointmentSkeletonCard from "@/components/appointmentSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/lib/firebase/config";
import { differenceInMinutes, format, isBefore } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const CLINIC_TZ = process.env.CLINIC_TZ;
const CANCEL_DEADLINE_MINS=120;
const SLOT_DURATION =15;

type Appointment = {
  id: string;
  scheduleAt: string;
  durationMins: number;
  status: string;
  notes: string | null;
  doctor: {
    id: string;
    name: string;
    specialization: string;
  };
};

type RescheduleState = {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  open: boolean;
};

export default function MyAppointmentPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [reschedule, setReschedule] = useState<RescheduleState | null>(null);
  const [rescheduleDate, setRescheduleDate ] = useState<Date>(new Date());
  const [rescheduleSlots, setRescheduleSlots] = useState<{start: string; booked: boolean}[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { toast.error("Please login"); return; }

      const res = await fetch("/api/appointments/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAppointments(data.appointments ?? []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Fetch slots for the reschedule calendar
  useEffect(() => {
    if (!reschedule?.open) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoadingSlots(true);
        setSelectedSlot(null);
        const formatted = format(rescheduleDate, "yyyy-MM-dd");
        const res = await fetch(
          `/api/doctors/${reschedule.doctorId}/availability?date=${formatted}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setRescheduleSlots(data.slots ?? []);
      } catch (e: any) {
        if (e.name !== "AbortError") toast.error("Failed to load slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    load();
    return () => controller.abort();
  }, [reschedule, rescheduleDate]);

  //Cancel 
  const handleCancel = async (appointmentId: string) => {
    try {
      setActionId(appointmentId);
      const token = await auth.currentUser?.getIdToken();
      if (!token) { toast.error("Please login"); return; }

      const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to cancel appointment");
        return;
      }

      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setActionId(null);
    }
  };

  //Reschedule confirm 
  const handleRescheduleConfirm = async () => {
    if (!reschedule || !selectedSlot) return;

    try {
      setActionId(reschedule.appointmentId);
      const token = await auth.currentUser?.getIdToken();
      if (!token) { toast.error("Please login"); return; }

      const res = await fetch(
        `/api/appointments/${reschedule.appointmentId}/reschedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newStartTime: selectedSlot }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to reschedule");
        return;
      }

      toast.success("Appointment rescheduled!");
      setReschedule(null);
      await fetchAppointments();
    } catch {
      toast.error("Failed to reschedule");
    } finally {
      setActionId(null);
    }
  };

  //Helpers
  const canCancelOrReschedule = (scheduleAt: string) => {
    const mins = differenceInMinutes(new Date(scheduleAt), new Date());
    return mins >= CANCEL_DEADLINE_MINS;
  };

  const timeUntil = (scheduleAt: string) => {
    const mins = differenceInMinutes(new Date(scheduleAt), new Date());
    if (mins < 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-28">
        <h1 className="text-4xl font-bold mb-10 text-center">My Appointments</h1>
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
        <p className="text-muted-foreground text-center">No upcoming appointments.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((a) => {
            const cancellable = canCancelOrReschedule(a.scheduleAt);
            const countdown = timeUntil(a.scheduleAt);

            return (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg font-semibold">
                      {a.doctor.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs shrink-0"
                    >
                      {a.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {a.doctor.specialization}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
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

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {new Date(a.scheduleAt).toLocaleTimeString("en-IN", {
                        timeZone: CLINIC_TZ,
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{a.durationMins} mins</span>
                  </div>

                  {/* Notes */}
                  {a.notes && (
                    <div className="text-sm rounded-md bg-blue-500/5 border border-blue-500/20 px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-1">Reason</p>
                      <p className="text-blue-400 text-xs leading-relaxed">{a.notes}</p>
                    </div>
                  )}

                  {/* Cancellation deadline warning */}
                  {!cancellable && countdown && (
                    <p className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
                      Appointment in {countdown} — too close to cancel or reschedule
                    </p>
                  )}

                  {/* Actions */}
                  {a.status === "SCHEDULED" && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        variant="outline"
                        className="text-sm text-blue-500 border-blue-500/30 hover:bg-blue-500/10 disabled:opacity-40"
                        disabled={!cancellable || actionId === a.id}
                        onClick={() =>
                          setReschedule({
                            appointmentId: a.id,
                            doctorId: a.doctor.id,
                            doctorName: a.doctor.name,
                            open: true,
                          })
                        }
                      >
                        Reschedule
                      </Button>

                      <Button
                        className="text-sm border border-red-500/30 bg-black text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-40"
                        disabled={!cancellable || actionId === a.id}
                        onClick={() => handleCancel(a.id)}
                      >
                        {actionId === a.id ? (
                          <Spinner className="h-4 w-4 animate-spin" />
                        ) : (
                          "Cancel"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reschedule dialog */}
      <Dialog
        open={!!reschedule?.open}
        onOpenChange={(v) => !v && setReschedule(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>
              Pick a new date and time with {reschedule?.doctorName}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-6 py-2">
            {/* Date picker */}
            <div>
              <p className="text-sm font-medium mb-2">New date</p>
              <Calendar
                mode="single"
                selected={rescheduleDate}
                onSelect={(d) => d && setRescheduleDate(d)}
                disabled={(day) =>
                  isBefore(day, new Date().setHours(0, 0, 0, 0))
                }
                className="rounded-lg border border-border"
              />
            </div>

            {/* Slot picker */}
            <div>
              <p className="text-sm font-medium mb-2">
                Available slots —{" "}
                <span className="text-muted-foreground font-normal">
                  {format(rescheduleDate, "dd MMM")}
                </span>
              </p>

              {loadingSlots ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Spinner className="h-4 w-4 animate-spin text-blue-500" />
                  Loading...
                </div>
              ) : rescheduleSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No slots available on this date.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {rescheduleSlots.map((slot) => {
                    const time = new Date(slot.start).toLocaleTimeString(
                      "en-IN",
                      { timeZone: CLINIC_TZ, hour: "2-digit", minute: "2-digit" }
                    );
                    const isSelected = selectedSlot === slot.start;

                    return (
                      <Button
                        key={slot.start}
                        disabled={slot.booked}
                        onClick={() => setSelectedSlot(slot.start)}
                        className={`h-10 text-sm ${
                          slot.booked
                            ? "bg-muted text-muted-foreground cursor-not-allowed line-through"
                            : isSelected
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        }`}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReschedule(null)}
              disabled={!!actionId}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!selectedSlot || !!actionId}
              onClick={handleRescheduleConfirm}
            >
              {actionId ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4 animate-spin" /> Rescheduling...
                </span>
              ) : (
                "Confirm reschedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
