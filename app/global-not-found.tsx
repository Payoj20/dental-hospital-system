import { Metadata } from "next";
import "./globals.css";
import { FaArrowLeft } from "react-icons/fa";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className="dark">
      <body className="bg-black min-h-screen flex items-center justify-center p-6">
        <div className="relative border border-blue-800/30 bg-linear-to-br from-blue-950/30 via-black/60 to-black rounded-2xl max-w-2xl w-full px-12 py-16 overflow-hidden">
          {/* Glow effects */}
          <div className="absolute -top-20 -right-20 h-56 w-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 bg-emerald-500/07 rounded-full blur-3xl pointer-events-none" />

          {/* 404 */}
          <p className="text-[96px] font-extrabold leading-none tracking-[-4px] bg-linear-to-br from-blue-400 to-emerald-400 bg-clip-text text-transparent select-none">
            404
          </p>

          {/* Heading */}
          <h1 className="mt-4 text-3xl font-bold text-white tracking-tight">
            Page not found
          </h1>

          {/* Description */}
          <p className="mt-3 text-muted-foreground text-base leading-relaxed max-w-md">
            The page you're looking for doesn't exist or has been under maintenance.
          </p>

          <div className="my-8 border-t border-white/07" />

          {/* Buttons */}
         <div className="flex flex-wrap gap-3">
            <Button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              <a href="/" className="inline-flex items-center gap-2">
                <FaArrowLeft className="h-3.5 w-3.5" />
                Back to home
              </a>
            </Button>

            <Button variant="outline">
              <a href="/doctors">
                View doctors
              </a>
            </Button>

            <Button variant="outline">
              <a href="/appointments">
                My appointments
              </a>
            </Button>
          </div>

          {/* Breadcrumb */}
          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/50">
            <span className="text-red-400/70">404 — Not found</span>
          </div>
        </div>
      </body>
    </html>
  );
}
