import { invalidateAvailability } from "@/lib/availability/invalidate";
import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { createNotification } from "@/lib/notifications/notifications";
import { db } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";


const RESCHEDULE_DEADLINE_MIN =120;

export async function POST(req:Request, {params}:{params: Promise<{id:string}>}) {
    try {
        const {id} = await params;

        const authHeader = req.headers.get("authorization");
        if(!authHeader) {
            return NextResponse.json({error: "Unauthorized"}, {status:401});
        }

        const token = authHeader.replace("Bearer", "").trim();
        const decoded = await verifyFirebaseToken(token);

        const user = await db.user.findUnique({
            where: {firebaseUid: decoded.uid},
        });

        if(!user) {
            return NextResponse.json({error: "User not found"}, {status: 404});
        }

        const {newStartTime} = await req.json();
        if(!newStartTime) {
            return NextResponse.json({error: "newStartTime is required"}, {status: 400})
        }

        const newStart = new Date(newStartTime);
        if(newStart<new Date()) {
            return NextResponse.json({error: "Cannot reschedule to a past slot"}, {status: 400});
        }

        //Fetch current appointment
        const appointment = await db.appointment.findUnique({
            where:{id},
            include: {doctor: {select:{name:true}}},
        });

        if(!appointment || appointment.userId !== user.id) {
            return NextResponse.json({error: "Not allowed"}, {status:403});
        }

        if(appointment.status !== "SCHEDULED") {
            return NextResponse.json({error: "Only Scheduled appointment can be rescheduled"}, {status:400})
        }

        //Check the deadline on appointment
        const now = new Date();
        const minutesUntilAppointment = (appointment.scheduleAt.getTime() - now.getTime())/60000;

        if(minutesUntilAppointment<RESCHEDULE_DEADLINE_MIN) {
            return NextResponse.json({error:`Rescheduling must be done at leat ${RESCHEDULE_DEADLINE_MIN/60}hours before the appointment`, code: "Cannot reschedule"}, {status:400})

        }

        //Check new slot is availavle
        const newEnd = new Date(newStart);
        newEnd.setMinutes(newStart.getMinutes()+ appointment.durationMins);

        const conflict = await db.appointment.findFirst({
            where: {
                doctorId: appointment.doctorId,
                id: {not:id},
                status: {in:["SCHEDULED", "CHECKED_IN"]},
                NOT: {
                    OR: [
                        {scheduleAt: {gte: newEnd}},
                        {scheduleAt: {lt: newStart}},
                    ]
                }
            }
        });

        if(conflict) {
            return NextResponse.json({error: "The new Slot is already booked"}, {status:409})
        }

        const oldDate = appointment.scheduleAt.toISOString().split("T")[0];
        const newDate = newStart.toISOString().split("T")[0];

        //Automatically cancel old and create new in a transaction
        const [,newAppointmnet] = await db.$transaction([
            //cancel old
            db.appointment.update({
                where: {id},
                data: {status: "CANCELLED", cancelledAt:new Date()},
            }),

            //Create new with same doctor, duration, note
            db.appointment.create({
                data: {
                    userId: user.id,
                    doctorId: appointment.doctorId,
                    scheduleAt: newStart,
                    durationMins: appointment.durationMins,
                    notes: appointment.notes,
                },
            })
        ]);

        //Notify user
        await createNotification(user.id, "SCHEDULED", {
            date: newStart.toISOString(),
            doctorName: appointment.doctor.name,
        });

        //Reschedule the remainder notification for 15 min before new slot
        const reminderTime = new Date(newStart);
        reminderTime.setMinutes(reminderTime.getMinutes()-15);
        await db.notification.create({
            data: {
                userId: user.id,
                type: "REMINDER",
                payload: {
                    date: newStart.toISOString(),
                    doctorName: appointment.doctor.name,
                },
                createdAt: reminderTime,
            }
        })

        //Invalidate cache for both old date and new date
        await Promise.all([
            invalidateAvailability(appointment.doctorId, oldDate),
            oldDate !== newDate ? invalidateAvailability(appointment.doctorId,newDate) : Promise.resolve(),
        ])

        return NextResponse.json({appointment: newAppointmnet})
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Reschedule failed!"}, {status: 500});
    }
}