import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import {
  employees,
  bookings,
  bookingEmployees,
  clients,
  employeeWorkLogs,
  aiGeneratedLooks,
  aiLookSessions,
} from "@/db/schema";
import { eq, and, desc, gte, count } from "drizzle-orm";
import { users } from "@/db/schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the employee record linked to this user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, user.id))
    .limit(1);

  if (!employee) return NextResponse.json({ error: "No employee record found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const assignedBookings = await db
    .select({
      id: bookings.id,
      eventType: bookings.eventType,
      bookingDate: bookings.bookingDate,
      status: bookings.status,
      finalLookStatus: bookings.finalLookStatus,
      assignmentRole: bookingEmployees.assignmentRole,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      clientId: clients.id,
    })
    .from(bookingEmployees)
    .leftJoin(bookings, eq(bookingEmployees.bookingId, bookings.id))
    .leftJoin(clients, eq(bookings.clientId, clients.id))
    .where(eq(bookingEmployees.employeeId, employee.id))
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
    .where(eq(employeeWorkLogs.employeeId, employee.id))
    .orderBy(desc(employeeWorkLogs.createdAt))
    .limit(20);

  const todayBookings = assignedBookings.filter(
    (b) => b.bookingDate && new Date(b.bookingDate) >= today
  ).length;

  const completedBookings = assignedBookings.filter((b) => b.status === "completed").length;

  return NextResponse.json({
    employee,
    bookings: assignedBookings,
    workLogs,
    stats: {
      total: assignedBookings.length,
      todayUpcoming: todayBookings,
      completed: completedBookings,
      workLogs: workLogs.length,
    },
  });
}
