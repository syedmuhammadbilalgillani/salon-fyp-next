import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { services } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { serviceSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), eq(services.salonId, session.user.salonId)))
    .limit(1);

  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "salon_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = serviceSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, description, price, durationMinutes, isActive } = parsed.data;

  const [updated] = await db
    .update(services)
    .set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(price !== undefined && { price: String(price) }),
      ...(durationMinutes !== undefined && { durationMinutes }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    })
    .where(and(eq(services.id, id), eq(services.salonId, session.user.salonId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "salon_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await db
    .update(services)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(services.id, id), eq(services.salonId, session.user.salonId)));

  return NextResponse.json({ success: true });
}

