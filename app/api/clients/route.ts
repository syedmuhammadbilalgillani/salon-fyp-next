import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { clients } from "@/db/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { clientSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const salonId = session.user.salonId;

  const where = search
    ? and(
        eq(clients.salonId, salonId),
        eq(clients.isActive, true),
        or(
          ilike(clients.fullName, `%${search}%`),
          ilike(clients.phone, `%${search}%`)
        )
      )
    : and(eq(clients.salonId, salonId), eq(clients.isActive, true));

  const rows = await db
    .select()
    .from(clients)
    .where(where)
    .orderBy(desc(clients.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { fullName, phone, email, weddingDate, skinTone, skinUndertone, faceShape, makeupStylePreference, hairstylePreference, notes } = parsed.data;

  const [client] = await db
    .insert(clients)
    .values({
      salonId: session.user.salonId,
      fullName,
      phone,
      email: email || null,
      weddingDate: weddingDate ? new Date(weddingDate) : null,
      skinTone: skinTone || null,
      skinUndertone: skinUndertone || null,
      faceShape: faceShape || null,
      preferences: {
        makeupStyle: makeupStylePreference,
        hairstyle: hairstylePreference,
      },
      notes: notes || null,
    })
    .returning();

  return NextResponse.json(client, { status: 201 });
}
