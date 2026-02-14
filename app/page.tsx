"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { features } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { useAuth } from "../lib/context/authContext";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/hospital-image.png"
              alt="hospital-image"
              width={500}
              height={300}
            />

            <h1 className="mt-8 text-4xl md:text-5xl lg:text-5xl leading-tight font-bold">
              DentalCare Hospital
            </h1>
            <p className="mt-5">
              Welcome to DentalCare Hospital, your trusted partner in dental
              health.
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              {!user ? (
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Link href="/signup">Get Started</Link>
                </Button>
              ) : (
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Link href="/services">Services</Link>
                </Button>
              )}

              <Button variant="outline">
                <Link href="/doctors">Doctors</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge
                variant="outline"
                className="px-4 py-2 bg-blue-900/30 border-blue-700/50 text-blue-400 text-sm font-medium"
              >
                DentalCare makes it easy.
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white">
                Book your appointment <br />{" "}
                <span className="text-blue-500">Anytime, anywhere</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-md">
                Book appointments according to your schedule. Easy and
                convenient. And get the best dental care.
              </p>
              <div className="flex">
                <Button
                  asChild
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Link href="/doctors">
                    Book Appointment <FaArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden">
              <Image
                src="/booking-image.png"
                alt="booking-image"
                fill
                priority
                className=""
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform makes it easy to book appointments with our dental
              professionals. No more waiting in line and no more confusions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((features, index) => (
              <Card
                key={index}
                className="border-blue-900/20 hover:border-blue-800/40 transition-all duration-300"
              >
                <CardHeader className="pb-2">
                  <div className="bg-blue-900/20 p-3 rounded-lg w-fit mb-4">
                    {features.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-white">
                    {features.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {features.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="relative border border-blue-800/30 bg-linear-to-br from-blue-900/40 via-blue-950/30 to-black/40 overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-32 -right-32 h-80 w-80 bg-blue-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 bg-emerald-500/10 rounded-full blur-3xl" />

            <CardContent className="relative  px-8 py-12 md:px-14 md:py-16 lg:px-20 lg:py-20">
              <div className="max-w-3xl">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                  Ready to take control of your{" "}
                  <span className="text-blue-400">dental health</span>?
                </h2>

                <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Manage your dental visits effortlessly with real-time
                  appointment scheduling, trusted doctors, and smart reminders —
                  all in one secure platform built for modern healthcare.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-6">
                  {!user ? (
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      <Link href="/signup">Get Started</Link>
                    </Button>
                  ) : (
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      <Link href="/services">Services</Link>
                    </Button>
                  )}

                  <Button variant="outline">
                    <Link href="/doctors">Doctors</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
