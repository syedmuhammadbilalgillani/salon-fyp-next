import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { employees, bookingEmployees, bookings, clients, employeeWorkLogs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { employeeSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.salonId, session.user.salonId)))
    .limit(1);

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assignedBookings = await db
    .select({
      id: bookings.id,
      eventType: bookings.eventType,
      bookingDate: bookings.bookingDate,
      status: bookings.status,
      clientName: clients.fullName,
    })
    .from(bookingEmployees)
    .leftJoin(bookings, eq(bookingEmployees.bookingId, bookings.id))
    .leftJoin(clients, eq(bookings.clientId, clients.id))
    .where(eq(bookingEmployees.employeeId, id))
    .orderBy(desc(bookings.bookingDate));

  const workLogs = await db
    .select({
      id: employeeWorkLogs.id,
      workType: employeeWorkLogs.workType,
      description: employeeWorkLogs.description,
      createdAt: employeeWorkLogs.createdAt,
      clientName: clients.fullName,
      eventType: bookings.eventType,
    })
    .from(employeeWorkLogs)
    .leftJoin(clients, eq(employeeWorkLogs.clientId, clients.id))
    .leftJoin(bookings, eq(employeeWorkLogs.bookingId, bookings.id))
    .where(eq(employeeWorkLogs.employeeId, id))
    .orderBy(desc(employeeWorkLogs.createdAt));

  return NextResponse.json({ employee, bookings: assignedBookings, workLogs });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = employeeSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(employees)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(employees.id, id), eq(employees.salonId, session.user.salonId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
