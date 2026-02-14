"use client";
import { useAuth } from "@/lib/context/authContext";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Spinner } from "./ui/spinner";

const PUBLIC_ROUTES = ["/login", "/signup"];
const PROFILE_ROUTE = "/complete-profile";
const ADMIN_ROUTE = "/admin";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    //Logged-in users should not see login/signup
    if (user && PUBLIC_ROUTES.includes(pathname)) {
      router.replace("/");
      return;
    }

    //User cannot access adminDashboard
    if (pathname.startsWith(ADMIN_ROUTE) && !isAdmin) {
      router.replace("/");
      return;
    }

    //Users with completed profiles should not revisit complete-profile page
    if (user && pathname === PROFILE_ROUTE && profile) {
      router.replace("/");
    }

    //Loggedvin users without completed profiles must go to complete-profile
    if (user && !profile && pathname !== PROFILE_ROUTE) {
      router.replace("/complete-profile");
      return;
    }
  }, [user, loading, pathname, router, isAdmin, profile]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="text-blue-500 animate-spin" />
      </div>
    );

  return <>{children}</>;
}
