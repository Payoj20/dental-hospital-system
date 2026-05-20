"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/firebase/config";
import { format, isBefore, isSameDay } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import { LuCalendarOff, LuClock } from "react-icons/lu";
import { toast } from "sonner";

type Slot = {
  start: string;
  end: string;
  booked?: boolean;
};

type UnavailableBlock = {
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  isFullDay: boolean;
};

type AvailabilityProps = {
  doctorId: string;
  doctorName?: string;
};

const SLOT_DURATION = 15;
const CLINIC_TZ = "Asia/Kolkata";
const MAX_NOTES = 500;

const Now = () =>
  new Date(
    new Date().toLocaleString("en-US", {
      timeZone: CLINIC_TZ,
    }),
  );

const UnavailabilityBanner = ({
  blocks,
  doctorName,
}: {
  blocks: UnavailableBlock[];
  doctorName?: string;
}) => {
  if (!blocks.length) return null;

  const hasFullDay = blocks.some((b) => b.isFullDay);
  const name = doctorName
    ? `Dr. ${doctorName.replace(/^Dr\.?\s*/i, "")}`
    : "The doctor";

  if (hasFullDay) {
    const block = blocks.find((b) => b.isFullDay)!;
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 flex gap-3">
        <LuCalendarOff className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-red-400">
            {name} is unavailable on this date
          </p>
          {block.reason && (
            <p className="text-xs text-red-400/70">Reason: {block.reason}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Please select a different date to book an appointment.
          </p>
        </div>
      </div>
    );
  }

  // Partial unavailability — show each blocked time range
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3">
      <LuClock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-2">
        <p className="text-sm font-medium text-amber-400">
          {name} is partially unavailable on this date
        </p>
        <div className="space-y-1">
          {blocks
            .filter((b) => !b.isFullDay)
            .map((b, i) => (
              <p key={i} className="text-xs text-amber-400/80">
                {b.startTime} – {b.endTime}
                {b.reason && (
                  <span className="text-muted-foreground"> · {b.reason}</span>
                )}
              </p>
            ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Slots outside these hours are still available below.
        </p>
      </div>
    </div>
  );
};

const Availability: React.FC<AvailabilityProps> = ({
  doctorId,
  doctorName,
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [booking, setBooking] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [unavailableBlocks, setUnavailableBlocks] = useState<
    UnavailableBlock[]
  >([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState("");

  //Fetch availability
  const fetchSlots = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setSelectedSlot(null);

        const formatted = format(date, "yyyy-MM-dd");
        const res = await fetch(
          `/api/doctors/${doctorId}/availability?date=${formatted}`,
          { signal },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch slots");
        }

        const data: { slots: Slot[]; unavailableBlocks: UnavailableBlock[] } =
          await res.json();
        setSlots(data.slots ?? []);
        setUnavailableBlocks(data.unavailableBlocks ?? []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          toast.error("Failed to load availability");
        }
      } finally {
        setLoading(false);
      }
    },
    [date, doctorId],
  );

  //Load slots when date/doctor changes
  useEffect(() => {
    const controller = new AbortController();
    fetchSlots(controller.signal);
    return () => controller.abort();
  }, [fetchSlots]);

  const handleSlot = (slotStart: string) => {
    setSelectedSlot(slotStart);
    setNotes("");
    setConfirmOpen(true);
  };

  //Booked appointment
  const bookAppointment = async (): Promise<void> => {
    if (!selectedSlot) return;

    try {
      setBooking(true);

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Please login to book an appointment");
        return;
      }

      //send booking req to backend
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId,
          startTime: selectedSlot,
          durationMins: SLOT_DURATION,
          notes: notes.trim() || null,
        }),
      });

      if (res.status === 409) {
        const data = await res.json();
        toast.error(
          data.reason ? `Doctor unavailable — ${data.reason}` : data.error,
        );
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Booking failed");
        return;
      }

      toast.success("Appointment booked successfully!");
      setConfirmOpen(false);
      setSelectedSlot(null);
      setNotes("");
      await fetchSlots();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBooking(false);
      setSelectedSlot(null);
    }
  };

  const selectedSlotFormatted = selectedSlot
    ? new Date(selectedSlot).toLocaleTimeString("en-IN", {
        timeZone: CLINIC_TZ,
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const isFullyUnavailable = unavailableBlocks.some((b) => b.isFullDay);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-20">
        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d: Date | undefined) => d && setDate(d)}
            disabled={(day) => isBefore(day, new Date().setHours(0, 0, 0, 0))}
            className="rounded-lg border border-border bg-background"
          />
        </div>

        {/* Slots */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Available slots</h3>
            <p className="text-sm text-muted-foreground">
              {format(date, "dd MMM yyyy")}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner className="h-4 w-4 text-blue-500 animate-spin" />
              <span>Loading slots...</span>
            </div>
          ) : (
            <>
              {/* Unavailability banner — shown whenever blocks exist */}
              <UnavailabilityBanner
                blocks={unavailableBlocks}
                doctorName={doctorName}
              />

              {/* Slot grid — hidden only if fully unavailable */}
              {isFullyUnavailable ? null : slots.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No slots available for this date.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {slots.map((slot) => {
                    const start = new Date(slot.start);
                    const time = start.toLocaleTimeString("en-IN", {
                      timeZone: CLINIC_TZ,
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const clinicNow = Now();
                    const isPastTime =
                      isSameDay(date, clinicNow) && start < clinicNow;
                    const disabled = slot.booked || isPastTime;
                    const isSelected = selectedSlot === slot.start;

                    return (
                      <Button
                        key={slot.start}
                        onClick={() => !disabled && handleSlot(slot.start)}
                        disabled={disabled}
                        className={`h-11 text-sm ${
                          slot.booked
                            ? "bg-muted text-muted-foreground cursor-not-allowed line-through"
                            : isSelected
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        }`}
                      >
                        {time}
                        {slot.booked && " (Booked)"}
                        {isPastTime && " (Past)"}
                      </Button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm appointment</DialogTitle>
            <DialogDescription>
              Review your booking details before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
              {doctorName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doctor</span>
                  <span className="font-medium">{doctorName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {format(date, "dd MMM yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{selectedSlotFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{SLOT_DURATION} mins</span>
              </div>
            </div>

            {/* Notes field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for visit{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Textarea
                placeholder="e.g. Tooth pain, routine cleaning, follow-up..."
                value={notes}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_NOTES)
                    setNotes(e.target.value);
                }}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {notes.length}/{MAX_NOTES}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={booking}
            >
              Back
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={bookAppointment}
              disabled={booking}
            >
              {booking ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4 animate-spin" />
                  Booking...
                </span>
              ) : (
                "Confirm booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Availability;
