import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import {
  bookings,
  bookingServices,
  bookingEmployees,
  employeeWorkLogs,
  clients,
  employees,
  services,
} from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { bookingSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const salonId = session.user.salonId;

  const where = status
    ? and(eq(bookings.salonId, salonId), eq(bookings.status, status as "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"))
    : eq(bookings.salonId, salonId);

  const rows = await db
    .select({
      id: bookings.id,
      eventType: bookings.eventType,
      bookingDate: bookings.bookingDate,
      status: bookings.status,
      totalAmount: bookings.totalAmount,
      advancePaid: bookings.advancePaid,
      finalLookStatus: bookings.finalLookStatus,
      notes: bookings.notes,
      createdAt: bookings.createdAt,
      clientName: clients.fullName,
      clientPhone: clients.phone,
    })
    .from(bookings)
    .leftJoin(clients, eq(bookings.clientId, clients.id))
    .where(where)
    .orderBy(desc(bookings.bookingDate));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { clientId, eventType, bookingDate, serviceIds, employeeAssignments, totalAmount, advancePaid, notes } = parsed.data;

  const [booking] = await db
    .insert(bookings)
    .values({
      salonId: session.user.salonId,
      clientId,
      eventType,
      bookingDate: new Date(bookingDate),
      totalAmount: String(totalAmount),
      advancePaid: String(advancePaid),
      notes: notes || null,
      status: "pending",
    })
    .returning();

  // Fetch service prices
  const svcRows = await db
    .select()
    .from(services)
    .where(inArray(services.id, serviceIds));

  await db.insert(bookingServices).values(
    svcRows.map((s) => ({
      bookingId: booking.id,
      serviceId: s.id,
      priceAtBooking: s.price,
    }))
  );

  await db.insert(bookingEmployees).values(
    employeeAssignments.map((e) => ({
      bookingId: booking.id,
      employeeId: e.employeeId,
      assignmentRole: e.assignmentRole,
    }))
  );

  await db.insert(employeeWorkLogs).values(
    employeeAssignments.map((e) => ({
      salonId: session.user.salonId,
      bookingId: booking.id,
      clientId,
      employeeId: e.employeeId,
      workType: "booking_assigned",
      description: `Assigned to ${eventType} booking`,
    }))
  );

  return NextResponse.json(booking, { status: 201 });
}
