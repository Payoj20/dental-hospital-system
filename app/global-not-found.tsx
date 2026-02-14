import { Metadata } from "next";
import "./globals.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="bg-black">
        <div className="max-w-7xl mx-auto px-4 py-40">
          <Card className="relative border-blue-400 bg-black overflow-hidden">
            <CardContent className="relative  px-8 py-12 md:px-14 md:py-16 lg:px-20 lg:py-20">
              <div className="max-w-3xl">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                  <span className="text-red-500">404</span> Page not found.{" "}
                </h2>

                <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
                  The page you are looking for is currently unavailable or is
                  under maintenance.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-6">
                  <a href="/">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      Back to home
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
