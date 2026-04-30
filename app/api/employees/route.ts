import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { employees } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { employeeSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = req.nextUrl.searchParams.get("role");
  const salonId = session.user.salonId;

  const where = role
    ? and(
        eq(employees.salonId, salonId),
        eq(employees.role, role as "salon_admin" | "receptionist" | "stylist" | "makeup_artist" | "hair_stylist")
      )
    : eq(employees.salonId, salonId);

  const rows = await db.select().from(employees).where(where).orderBy(desc(employees.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "salon_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, phone, email, role, specialization, experienceYears, status, notes } = parsed.data;

  const [employee] = await db
    .insert(employees)
    .values({
      salonId: session.user.salonId,
      name,
      phone,
      email: email || null,
      role,
      specialization: specialization || null,
      experienceYears: experienceYears ?? 0,
      status,
      notes: notes || null,
    })
    .returning();

  return NextResponse.json(employee, { status: 201 });
}
