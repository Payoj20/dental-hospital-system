import { getDoctorWithTodayUpdates } from "@/lib/services/doctors";
import { NextResponse } from "next/server";

//GEt-all doctors
export async function GET() {
  try {
    const doctors = await getDoctorWithTodayUpdates();
    return NextResponse.json(doctors);
  } catch (error) {
    console.log("Failed to fetch doctors", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 },
    );
  }
}

//protect unsupported methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
