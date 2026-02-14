import { getDoctorAvailability } from "@/lib/services/doctorAvailability";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Date required" }, { status: 400 });
  }

  const slots = await getDoctorAvailability(doctorId, date);
  return NextResponse.json({ slots });
}
