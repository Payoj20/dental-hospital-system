"use client";
import React, { useState } from "react";
import { useAuth } from "../../lib/context/authContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const Login = () => {
  const { loginWithEmailFn, signInWithGoogleFn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      await loginWithEmailFn(email, password);
      toast.success("Logged in Successfully!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login Failed";
      setErr(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setErr(null);
    setLoading(true);

    try {
      await signInWithGoogleFn();
      toast.success("Signed in successfully!");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Google sign-in failed";
      setErr(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 sm:p-6">
      <div className="flex w-full max-w-sm sm:max-w-md flex-col gap-6 px-3 sm:px-0">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-sm">Welcome back</CardTitle>
            {err && <div className="text-sm text-red-600 mb-3">{err}</div>}
            <CardDescription>
              Enter your email below to login in your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    id="email"
                    type="email"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "logging in..." : "Login"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onGoogle}
                    disabled={loading}
                  >
                    <Image
                      style={{ height: "1.2rem" }}
                      width={20}
                      height={20}
                      alt="google"
                      src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg"
                    />
                    Continue with Google
                  </Button>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account?{" "}
                    <Link href="signup">Sign Up</Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
