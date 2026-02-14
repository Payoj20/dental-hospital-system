"use client";

import {
  auth,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
  signInWithEmail,
} from "@/lib/firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

type Profile = {
  fullName: string;
  email: string;
  DOB: string;
  phoneNumber: string;
  address: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmailFn: (email: string, password: string) => Promise<void>;
  signInWithGoogleFn: () => Promise<void>;
  signUpWithEmailFn: (email: string, password: string) => Promise<void>;
  signOutFn: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  //Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(true);

      if (!firebaseUser) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();

        const res = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 404) {
          // User not in DB yet → session API will handle it
          setProfile(null);
          setIsAdmin(false);
        }
        //user exists in DB
        else if (res.ok) {
          const data = await res.json();
          setProfile(data.isProfileCompleted ? data : null);
          setIsAdmin(data.role === "ADMIN");
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      } catch {
        setProfile(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  //Backed session handler
  const handleBackendSession = async () => {
    const idToken = await auth.currentUser?.getIdToken(true);

    //send token to backend session API
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();

    if (!data.isProfileCompleted) {
      router.replace("/complete-profile");
    } else {
      router.replace("/");
    }
  };

  //Refresh after updating user profile
  const refreshProfile = async () => {
    if (!auth.currentUser) return;

    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.isProfileCompleted ? data : null);
        setIsAdmin(data.role === "ADMIN");
      }
    } catch {
      setProfile(null);
      setIsAdmin(false);
    }
  };

  const loginWithEmailFn = async (email: string, password: string) => {
    await signInWithEmail(email, password);
    await handleBackendSession();
  };

  const signInWithGoogleFn = async () => {
    await signInWithGoogle();
    await handleBackendSession();
  };

  const signUpWithEmailFn = async (email: string, password: string) => {
    await signUpWithEmail(email, password);
    await handleBackendSession();
  };

  const signOutFn = async () => {
    await signOutUser();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAdmin,
    refreshProfile,
    loginWithEmailFn,
    signInWithGoogleFn,
    signUpWithEmailFn,
    signOutFn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
