import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { bookings, clients, aiLookSessions, aiGeneratedLooks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { callExternalAIModel } from "@/lib/external-ai";
import { callMockAI } from "@/lib/mock-ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId, clientImageUrl, preferences } = await req.json();

  // Verify booking belongs to this salon
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.salonId, session.user.salonId)))
    .limit(1);

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, booking.clientId))
    .limit(1);

  // Create session record with status = processing
  const [aiSession] = await db
    .insert(aiLookSessions)
    .values({
      salonId: session.user.salonId,
      bookingId,
      clientId: booking.clientId,
      inputImageUrl: clientImageUrl,
      eventType: booking.eventType,
      preferences,
      status: "processing",
    })
    .returning();

  // ─── AI call: real model if configured, otherwise mock ───────────────────
  const payload = {
    clientImageUrl,
    eventType: booking.eventType,
    preferences,
    clientDetails: {
      skinTone: client?.skinTone ?? null,
      skinUndertone: client?.skinUndertone ?? null,
      faceShape: client?.faceShape ?? null,
    },
  };

  const aiResponse = process.env.EXTERNAL_AI_API_URL
    ? await callExternalAIModel(payload)   // ← real model
    : await callMockAI(payload);           // ← mock (remove when model is ready)
  // ─────────────────────────────────────────────────────────────────────────

  if (!aiResponse.success || aiResponse.generatedImageUrls.length === 0) {
    await db
      .update(aiLookSessions)
      .set({ status: "failed", errorMessage: aiResponse.error ?? "No images returned" })
      .where(eq(aiLookSessions.id, aiSession.id));

    return NextResponse.json(
      { error: aiResponse.error ?? "AI generation failed" },
      { status: 500 }
    );
  }

  // Persist the 5 returned look images
  const looks = await db
    .insert(aiGeneratedLooks)
    .values(
      aiResponse.generatedImageUrls.map((url, i) => ({
        aiSessionId: aiSession.id,
        imageUrl: url,
        title: `${booking.eventType.charAt(0).toUpperCase() + booking.eventType.slice(1)} Look ${i + 1}`,
        status: "generated" as const,
        metadata: {
          skinTone: client?.skinTone ?? undefined,
          skinUndertone: client?.skinUndertone ?? undefined,
          faceShape: client?.faceShape ?? undefined,
        },
      }))
    )
    .returning();

  await db
    .update(aiLookSessions)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(aiLookSessions.id, aiSession.id));

  return NextResponse.json({ sessionId: aiSession.id, looks });
}
