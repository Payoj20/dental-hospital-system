"use client";

import { useAuth } from "@/lib/context/authContext";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui/button";
import UserProfilePopover from "./UserProfilePopover";
import { format } from "date-fns";

const Topbar = () => {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, profile, signOutFn } = useAuth();
  return (
    <>
      {/* TOP BAR */}
      <header className="w-full fixed top-0 left-0 z-10 px-6 md:px-10 py-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/50">
        {/* LOGO */}
        <div className="tracking-[4px] font-light text-xl">
          <Link href="/" className="hover:text-blue-500">DentalCare</Link>
        </div>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex items-center space-x-6 text-sm tracking-wide">
          {user && isAdmin && (
            <Button
              variant="outline"
              className="text-blue-500 hover:text-blue-600"
            >
              <Link href="/admin/dashboard">Admin Dashboard</Link>
            </Button>
          )}
          <Link href="/doctors" className="hover:text-blue-500">Doctors</Link>
          {!user ? (
            <>
              <Link href="/login" className="hover:text-blue-500">Login</Link>
              <Link href="/signup" className="hover:text-blue-500">Register</Link>
            </>
          ) : (
            <div className="flex items-center space-x-6">
              <Link href="/appointments" className="hover:text-blue-500">Appointment</Link>
              <Link href="/appointments/history" className="hover:text-blue-500">History</Link>

              <span className="font-medium">
                <UserProfilePopover />
              </span>
            </div>
          )}
        </nav>

        {/* MOBILE HAMBURGER */}
        <button className="md:hidden" onClick={() => setOpen(true)}>
          <Menu size={28} />
        </button>
      </header>

      {/* MOBILE MENU OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-xl z-60 transition-all duration-300 
        ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }
        `}
      >
        {/* CLOSE BUTTON */}
        <button
          className="absolute right-6 top-6"
          onClick={() => setOpen(false)}
        >
          <X size={32} />
        </button>

        {/* MENU CONTENT */}
        <div className="w-full h-full flex flex-col items-center justify-center space-y-8 text-center px-6">
          <Link
            href="/"
            className="text-2xl tracking-wide"
            onClick={() => setOpen(false)}
          >
            DentalCare
          </Link>

          {!user ? (
            <>
              <Link
                href="/login"
                className="text-2xl tracking-wide"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-2xl tracking-wide"
                onClick={() => setOpen(false)}
              >
                Register
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              <Link
                href="/appointments"
                className="text-xl"
                onClick={() => setOpen(false)}
              >
                Appointment
              </Link>
              <Link
                href="/appointments/history"
                className="text-xl"
                onClick={() => setOpen(false)}
              >
                History
              </Link>
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  width={60}
                  height={60}
                  alt="profile-image"
                  className="rounded-full border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-semibold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}

              <p className="font-semibold ">
                Name: <span className="text-blue-500">{profile?.fullName}</span>
              </p>
              <p className="font-semibold">
                Email: <span className="text-blue-500">{profile?.email}</span>
              </p>
              {profile?.DOB && (
                <p className="font-semibold">
                  DOB:
                  <span className="text-blue-500">
                    {format(new Date(profile.DOB), "dd MMM yyyy")}
                  </span>
                </p>
              )}
              <p className="font-semibold">
                Address:{" "}
                <span className="text-blue-500">{profile?.address}</span>
              </p>

              <Button
                onClick={signOutFn}
                className="border border-red-500/30 bg-black mt-5 text-red-500 hover:bg-red-500 hover:text-white"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Topbar;
