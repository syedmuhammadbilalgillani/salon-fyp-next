import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { employees, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /api/employees/[id]/account — create login credentials for an employee
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId || session.user.role !== "salon_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.salonId, session.user.salonId)))
    .limit(1);

  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  if (employee.userId) return NextResponse.json({ error: "Employee already has a login account" }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const [user] = await db
    .insert(users)
    .values({
      salonId: session.user.salonId,
      fullName: employee.name,
      email: parsed.data.email,
      passwordHash,
      role: employee.role,
      isEmailVerified: true,
      isActive: true,
    })
    .returning();

  // Link user → employee
  await db
    .update(employees)
    .set({ userId: user.id, updatedAt: new Date() })
    .where(eq(employees.id, id));

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}

// DELETE /api/employees/[id]/account — revoke login access
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId || session.user.role !== "salon_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.salonId, session.user.salonId)))
    .limit(1);

  if (!employee?.userId) return NextResponse.json({ error: "No account found" }, { status: 404 });

  await db.update(users).set({ isActive: false }).where(eq(users.id, employee.userId));

  return NextResponse.json({ success: true });
}
