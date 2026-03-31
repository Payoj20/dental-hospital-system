"use client";

import { useAuth } from "@/lib/context/authContext";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui/button";
import UserProfilePopover from "./UserProfilePopover";
import { format } from "date-fns";
import { LuCalendarDays, LuHistory, LuLayoutDashboard, LuLogOut, LuStethoscope } from "react-icons/lu";
import { IoBarChartSharp } from "react-icons/io5";

const Topbar = () => {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, profile, signOutFn } = useAuth();

  const close = () => setOpen(false);

  return (
    <>
      {/* Desktop topbar */}
      <header className="w-full fixed top-0 left-0 z-10 px-6 md:px-10 py-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-md">
        <div className="tracking-[4px] font-light text-xl">
          <Link href="/" className="hover:text-blue-500">DentalCare</Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm tracking-wide">
          {user && isAdmin && (
            <div className="flex items-center gap-2">
              <Button variant="outline" className="text-blue-500 hover:text-blue-600" asChild>
                <Link href="/admin/dashboard">Admin dashboard</Link>
              </Button>
            </div>
          )}

          <Link href="/doctors" className="hover:text-blue-500">Doctors</Link>

          {!user ? (
            <>
              <Link href="/login" className="hover:text-blue-500">Login</Link>
              <Link href="/signup" className="hover:text-blue-500">Register</Link>
            </>
          ) : (
            <div className="flex items-center space-x-6">
              <Link href="/appointments" className="hover:text-blue-500">Appointments</Link>
              <Link href="/appointments/history" className="hover:text-blue-500">History</Link>
              <UserProfilePopover />
            </div>
          )}
        </nav>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
      />

      {/*  Mobile drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-[300px] z-50 bg-background border-l border-border flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="tracking-[3px] font-light text-sm">DentalCare</span>
          <button
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            onClick={close}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* User profile section */}
          {user && (
            <div className="px-5 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    width={44}
                    height={44}
                    alt="profile"
                    className="rounded-full border border-border shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-lg shrink-0">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {profile?.fullName ?? "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.email ?? user.email}
                  </p>
                </div>
              </div>

              {/* Profile details */}
              {(profile?.DOB || profile?.phoneNumber || profile?.address) && (
                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  {profile.DOB && (
                    <div className="flex items-center justify-between">
                      <span>Date of birth</span>
                      <span className="text-foreground font-medium">
                        {format(new Date(profile.DOB), "dd MMM yyyy")}
                      </span>
                    </div>
                  )}
                  {profile.phoneNumber && (
                    <div className="flex items-center justify-between">
                      <span>Phone</span>
                      <span className="text-foreground font-medium font-mono">
                        {profile.phoneNumber}
                      </span>
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="shrink-0">Address</span>
                      <span className="text-foreground font-medium text-right truncate">
                        {profile.address}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation links */}
          <nav className="px-3 py-3 space-y-0.5">

            {/* Admin links */}
            {user && isAdmin && (
              <>
                <p className="px-3 pt-2 pb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Admin
                </p>
                <MobileNavLink href="/admin/dashboard" icon={<LuLayoutDashboard size={16} />} onClick={close}>
                  Admin dashboard
                </MobileNavLink>
                <MobileNavLink href="/admin/analytics" icon={<IoBarChartSharp size={16} />} onClick={close}>
                  Analytics
                </MobileNavLink>
                <MobileNavLink href="/admin/doctor-availability" icon={<LuCalendarDays size={16} />} onClick={close}>
                  Doctor availability
                </MobileNavLink>
                <div className="my-2 border-t border-border/60" />
              </>
            )}

            {/* General links */}
            <p className="px-3 pt-2 pb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Browse
            </p>
            <MobileNavLink href="/doctors" icon={<LuStethoscope size={16} />} onClick={close}>
              Doctors
            </MobileNavLink>

            {!user ? (
              <>
                <div className="my-2 border-t border-border/60" />
                <div className="px-3 py-3 space-y-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <Link href="/login" onClick={close}>Login</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/signup" onClick={close}>Register</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="my-2 border-t border-border/60" />
                <p className="px-3 pt-2 pb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  My account
                </p>
                <MobileNavLink href="/appointments" icon={<LuCalendarDays size={16} />} onClick={close}>
                  My appointments
                </MobileNavLink>
                <MobileNavLink href="/appointments/history" icon={<LuHistory size={16} />} onClick={close}>
                  History
                </MobileNavLink>
              </>
            )}
          </nav>
        </div>

        {/* Drawer footer */}
        {user && (
          <div className="px-3 py-4 border-t border-border">
            <button
              onClick={() => { signOutFn(); close(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LuLogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

//Reusable mobile nav link
const MobileNavLink = ({
  href,
  icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
  >
    <span className="text-muted-foreground">{icon}</span>
    {children}
  </Link>
);

export default Topbar;
