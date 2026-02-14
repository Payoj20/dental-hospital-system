import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DoctorWithTodayUpdates,
  getDoctorWithTodayUpdates,
} from "@/lib/services/doctors";
import Image from "next/image";
import Link from "next/link";

type Doctor = DoctorWithTodayUpdates;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


function formatUnavailable(updates: Doctor["updates"]) {
  if (!updates.length) return null;

  return updates.map((u: Doctor["updates"][number]) => {
    if (!u.startTime || !u.endTime) {
      return `Unavailable today${u.reason ? ` - ${u.reason}` : ""}`;
    }

    return `Unavailable ${u.startTime}-${u.endTime}${
      u.reason ? ` - ${u.reason}` : ""
    }`;
  });
}

const DoctorPage = async () => {
  const doctors: Doctor[] = await getDoctorWithTodayUpdates();
  return (
    <div className="max-w-7xl mx-auto px-4 py-28">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold">Our Dental Specialists</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Choose from our experienced dental professionals and book an
          appointment based on real-time availability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {doctors.map((doctor) => (
          <Card
            key={doctor.id}
            className="flex flex-col border-blue-900/20 hover:border-blue-800/40 transition-all duration-300"
          >
            <div className="relative h-64 w-full bg-black/40 flex items-center justify-center">
              <Image
                src={doctor.imageUrl ?? "/doctors/default.png"}
                alt={doctor.name}
                fill
                className="object-contain p-1"
                priority={false}
              />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">
                {doctor.name}
              </CardTitle>
              <Badge
                variant="outline"
                className="w-fit mt-3 bg-blue-900/30 border-blue-700/50 text-blue-400 text-sm"
              >
                {doctor.specialization}
              </Badge>
            </CardHeader>

            <CardContent className="flex-1 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Available on:
              </p>
              <div className="flex flex-wrap gap-2">
                {doctor.schedules.map((s: DoctorWithTodayUpdates["schedules"][number], idx: number) => (
                  <Badge key={idx} variant="outline">
                    {DAYS[s.dayOfWeek]} {s.startTime}-{s.endTime}
                  </Badge>
                ))}
              </div>

              {doctor.updates.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formatUnavailable(doctor.updates)?.map((text: string, i: number) => (
                    <Badge
                      key={i}
                      className="bg-red-500/10 text-red-500 border-red-500/30"
                    >
                      {text}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button className="w-full">
                <Link href={`/doctors/${doctor.id}`}>Book Appointment</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DoctorPage;
