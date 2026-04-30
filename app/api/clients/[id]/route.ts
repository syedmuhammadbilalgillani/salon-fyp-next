import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { clients, bookings, aiLookSessions, aiGeneratedLooks, employeeWorkLogs, employees } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { clientSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.salonId, session.user.salonId)))
    .limit(1);

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const clientBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.clientId, id))
    .orderBy(desc(bookings.bookingDate));

  const sessions = await db
    .select()
    .from(aiLookSessions)
    .where(eq(aiLookSessions.clientId, id))
    .orderBy(desc(aiLookSessions.createdAt));

  const looks = sessions.length
    ? await db
        .select()
        .from(aiGeneratedLooks)
        .where(eq(aiGeneratedLooks.aiSessionId, sessions[0].id))
    : [];

  const workLogs = await db
    .select({
      id: employeeWorkLogs.id,
      workType: employeeWorkLogs.workType,
      description: employeeWorkLogs.description,
      createdAt: employeeWorkLogs.createdAt,
      employeeName: employees.name,
      employeeRole: employees.role,
    })
    .from(employeeWorkLogs)
    .leftJoin(employees, eq(employeeWorkLogs.employeeId, employees.id))
    .where(eq(employeeWorkLogs.clientId, id))
    .orderBy(desc(employeeWorkLogs.createdAt));

  return NextResponse.json({ client, bookings: clientBookings, sessions, looks, workLogs });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = clientSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { fullName, phone, email, weddingDate, skinTone, skinUndertone, faceShape, notes } = parsed.data;

  const [updated] = await db
    .update(clients)
    .set({
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      email: email || null,
      weddingDate: weddingDate ? new Date(weddingDate) : undefined,
      skinTone: skinTone ?? undefined,
      skinUndertone: skinUndertone ?? undefined,
      faceShape: faceShape ?? undefined,
      notes: notes ?? undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.salonId, session.user.salonId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .update(clients)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.salonId, session.user.salonId)));

  return NextResponse.json({ success: true });
}
