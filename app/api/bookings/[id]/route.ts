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
  aiLookSessions,
  aiGeneratedLooks,
  lookSelections,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.salonId, session.user.salonId)))
    .limit(1);

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [client] = await db.select().from(clients).where(eq(clients.id, booking.clientId)).limit(1);

  const bookingEmps = await db
    .select({
      id: employees.id,
      name: employees.name,
      role: employees.role,
      specialization: employees.specialization,
      assignmentRole: bookingEmployees.assignmentRole,
    })
    .from(bookingEmployees)
    .leftJoin(employees, eq(bookingEmployees.employeeId, employees.id))
    .where(eq(bookingEmployees.bookingId, id));

  const bookingServiceRows = await db
    .select({
      id: services.id,
      name: services.name,
      priceAtBooking: bookingServices.priceAtBooking,
    })
    .from(bookingServices)
    .leftJoin(services, eq(bookingServices.serviceId, services.id))
    .where(eq(bookingServices.bookingId, id));

  const aiSessions = await db
    .select()
    .from(aiLookSessions)
    .where(eq(aiLookSessions.bookingId, id))
    .orderBy(desc(aiLookSessions.createdAt));

  const looks = aiSessions.length
    ? await db
        .select()
        .from(aiGeneratedLooks)
        .where(eq(aiGeneratedLooks.aiSessionId, aiSessions[0].id))
        .orderBy(aiGeneratedLooks.createdAt)
    : [];

  const [finalSelection] = await db
    .select({ look: aiGeneratedLooks })
    .from(lookSelections)
    .leftJoin(aiGeneratedLooks, eq(lookSelections.generatedLookId, aiGeneratedLooks.id))
    .where(and(eq(lookSelections.bookingId, id), eq(lookSelections.isFinal, true)))
    .limit(1);

  const workLogs = await db
    .select({
      id: employeeWorkLogs.id,
      workType: employeeWorkLogs.workType,
      description: employeeWorkLogs.description,
      createdAt: employeeWorkLogs.createdAt,
      employeeName: employees.name,
    })
    .from(employeeWorkLogs)
    .leftJoin(employees, eq(employeeWorkLogs.employeeId, employees.id))
    .where(eq(employeeWorkLogs.bookingId, id))
    .orderBy(desc(employeeWorkLogs.createdAt));

  return NextResponse.json({
    booking,
    client,
    employees: bookingEmps,
    services: bookingServiceRows,
    aiSessions,
    looks,
    finalLook: finalSelection?.look ?? null,
    workLogs,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.salonId, session.user.salonId)))
    .limit(1);

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await db
    .update(bookings)
    .set({
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.advancePaid !== undefined && { advancePaid: String(body.advancePaid) }),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id))
    .returning();

  // Create work log on status change
  if (body.status && body.status !== booking.status && body.employeeId) {
    await db.insert(employeeWorkLogs).values({
      salonId: session.user.salonId,
      bookingId: id,
      clientId: booking.clientId,
      employeeId: body.employeeId,
      workType: "status_changed",
      description: `Status changed to ${body.status}`,
    });
  }

  return NextResponse.json(updated);
}
