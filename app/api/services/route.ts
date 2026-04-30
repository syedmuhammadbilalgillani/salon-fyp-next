import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { services } from "@/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { serviceSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "1";
  const search = (req.nextUrl.searchParams.get("search") ?? "").trim();

  // Only admins can request inactive services (management view).
  if (includeInactive && session.user.role !== "salon_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where = and(
    eq(services.salonId, session.user.salonId),
    ...(includeInactive ? [] : [eq(services.isActive, true)]),
    ...(search
      ? [
          or(
            ilike(services.name, `%${search}%`),
            ilike(services.description, `%${search}%`)
          ),
        ]
      : [])
  );

  const rows = await db
    .select()
    .from(services)
    .where(where)
    .orderBy(desc(services.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "salon_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, description, price, durationMinutes, isActive } = parsed.data;

  const [service] = await db
    .insert(services)
    .values({
      salonId: session.user.salonId,
      name,
      description: description || null,
      price: String(price),
      durationMinutes,
      isActive: isActive ?? true,
    })
    .returning();

  return NextResponse.json(service, { status: 201 });
}
