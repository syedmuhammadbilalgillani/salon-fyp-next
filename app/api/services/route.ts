import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { services } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(services)
    .where(and(eq(services.salonId, session.user.salonId), eq(services.isActive, true)));

  return NextResponse.json(rows);
}
