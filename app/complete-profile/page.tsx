"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { auth } from "@/lib/firebase/config";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { FaRegCalendarAlt } from "react-icons/fa";
import { useAuth } from "../../lib/context/authContext";
import { Spinner } from "@/components/ui/spinner";

const CompleteProfile = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = React.useState<Date | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshProfile } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="text-blue-500 animate-spin" />
      </div>
    );
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();

      //send profile data to backend api
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          dob: dob?.toISOString(),
          phoneNumber,
          address,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      toast.success("Profile Completed!");
      await refreshProfile();
      router.push("/");
    } catch (error) {
      console.log(error);
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 sm:p-6">
      <div className="flex w-full max-w-sm sm:max-w-md flex-col gap-6 px-3 sm:px-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Complete Your Profile
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                  <Input
                    value={fullName}
                    required
                    placeholder="Full Name"
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="dob">Date of Birth</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dob && "text-muted-foreground",
                        )}
                      >
                        <FaRegCalendarAlt className="mr-2 h-4 w-4" />
                        {dob ? format(dob, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dob}
                        onSelect={setDob}
                        initialFocus
                        captionLayout="dropdown"
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field>
                  <FieldLabel htmlFor="phoneNumber">Contact Number</FieldLabel>
                  <Input
                    value={phoneNumber}
                    placeholder="+91-xxxxxxxxxx"
                    required
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <Input
                    value={address}
                    placeholder="Residential Address"
                    required
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Field>

                <Button
                  className="w-full mt-2"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Profile"}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;
