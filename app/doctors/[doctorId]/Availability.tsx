"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/lib/firebase/config";
import { format, isBefore, isSameDay } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Slot = {
  start: string;
  end: string;
  booked?: boolean;
};

type AvailabilityProps = {
  doctorId: string;
};

const SLOT_DURATION = 15;
const CLINIC_TZ = "Asia/Kolkata";

const Now = () =>
  new Date(
    new Date().toLocaleString("en-US", {
      timeZone: CLINIC_TZ,
    }),
  );

const Availability: React.FC<AvailabilityProps> = ({ doctorId }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [booking, setBooking] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

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

        const data: { slots: Slot[] } = await res.json();
        setSlots(data.slots ?? []);
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

  // Load slots when date/doctor changes
  useEffect(() => {
    const controller = new AbortController();
    fetchSlots(controller.signal);
    return () => controller.abort();
  }, [fetchSlots]);

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
      await fetchSlots();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBooking(false);
      setSelectedSlot(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
      {/* LEFT → CALENDAR */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d: Date | undefined) => d && setDate(d)}
          disabled={(day) => isBefore(day, new Date().setHours(0, 0, 0, 0))}
          className="rounded-lg border border-border bg-background"
        />
      </div>

      {/* RIGHT → SLOTS */}
      <div className="md:col-span-2 space-y-4">
        <h3 className="text-lg font-semibold">Available Slots</h3>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Loading slots...</span>
            <Spinner className="h-4 w-4 text-blue-500 animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <p className="text-muted-foreground">
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
              const isPastTime = isSameDay(date, clinicNow) && start < clinicNow;
              const disabled = slot.booked || isPastTime || booking;
              const isSelected = selectedSlot === slot.start;

              return (
                <Button
                  key={slot.start}
                  onClick={() => !disabled && setSelectedSlot(slot.start)}
                  disabled={disabled}
                  className={`
                    h-11 text-sm
                    ${
                      slot.booked
                        ? "bg-muted text-muted-foreground cursor-not-allowed line-through"
                        : isSelected
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                    }
                  `}
                >
                  {time}
                  {slot.booked && " (Booked)"}
                  {isPastTime && " (Past)"}
                </Button>
              );
            })}
          </div>
        )}

        {selectedSlot && (
          <Button
            className="w-full mt-4"
            onClick={bookAppointment}
            disabled={booking}
          >
            {booking ? "Booking…" : "Confirm Appointment"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Availability;
