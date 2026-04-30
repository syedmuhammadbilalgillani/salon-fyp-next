import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { employeeWorkLogs, clients, employees, bookings } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const employeeId = searchParams.get("employeeId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const eventType = searchParams.get("eventType");
  const workType = searchParams.get("workType");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const isAdmin = session.user.role === "salon_admin";

  // Non-admin users must only access their own employee work history.
  let effectiveEmployeeId = employeeId;
  if (!isAdmin) {
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(
        and(
          eq(employees.userId, session.user.id),
          eq(employees.salonId, session.user.salonId)
        )
      )
      .limit(1);

    if (!employee) {
      return NextResponse.json(
        { error: "No employee record found for this user" },
        { status: 404 }
      );
    }

    if (employeeId && employeeId !== employee.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    effectiveEmployeeId = employee.id;
  }

  const conditions = [eq(employeeWorkLogs.salonId, session.user.salonId)];
  if (effectiveEmployeeId) conditions.push(eq(employeeWorkLogs.employeeId, effectiveEmployeeId));
  if (from) conditions.push(gte(employeeWorkLogs.createdAt, new Date(from)));
  if (to) conditions.push(lte(employeeWorkLogs.createdAt, new Date(to)));
  if (workType) conditions.push(eq(employeeWorkLogs.workType, workType));

  const rows = await db
    .select({
      id: employeeWorkLogs.id,
      workType: employeeWorkLogs.workType,
      description: employeeWorkLogs.description,
      createdAt: employeeWorkLogs.createdAt,
      bookingId: employeeWorkLogs.bookingId,
      clientName: clients.fullName,
      clientId: clients.id,
      employeeName: employees.name,
      employeeRole: employees.role,
      eventType: bookings.eventType,
      bookingDate: bookings.bookingDate,
    })
    .from(employeeWorkLogs)
    .leftJoin(clients, eq(employeeWorkLogs.clientId, clients.id))
    .leftJoin(employees, eq(employeeWorkLogs.employeeId, employees.id))
    .leftJoin(bookings, eq(employeeWorkLogs.bookingId, bookings.id))
    .where(and(...conditions))
    .orderBy(desc(employeeWorkLogs.createdAt))
    .limit(limit)
    .offset(offset);

  // Filter by eventType post-join (drizzle doesn't easily filter on joined columns in where)
  const filtered = eventType ? rows.filter((r) => r.eventType === eventType) : rows;

  return NextResponse.json({ data: filtered, page, limit });
}
