import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Topbar from "@/components/Topbar";
import { AuthProvider } from "../lib/context/authContext";
import { Toaster } from "sonner";
import FooterWrapper from "@/components/footerWrapper";
import ProtectedRoute from "@/components/protectRoute";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DentalCare Hospital",
  description: "Book you Appointment Easily and take care of your Teeth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
            <ProtectedRoute>
              <Topbar />
              <FooterWrapper>
                <main className="min-h-screen">{children}</main>
              </FooterWrapper>
            </ProtectedRoute>
        </AuthProvider>
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            duration: 2500,
            style: { fontWeight: 500 },
          }}
        />
      </body>
    </html>
  );
}
