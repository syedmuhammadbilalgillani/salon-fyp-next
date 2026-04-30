import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { aiGeneratedLooks, aiLookSessions, lookSelections, bookings, employeeWorkLogs, bookingEmployees, employees } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ lookId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lookId } = await params;
  const { bookingId, status } = await req.json();

  const [look] = await db
    .select()
    .from(aiGeneratedLooks)
    .where(eq(aiGeneratedLooks.id, lookId))
    .limit(1);

  if (!look) return NextResponse.json({ error: "Look not found" }, { status: 404 });

  const [updated] = await db
    .update(aiGeneratedLooks)
    .set({ status })
    .where(eq(aiGeneratedLooks.id, lookId))
    .returning();

  if (status === "selected") {
    // Deselect all other looks in this booking's sessions
    const sessions = await db
      .select({ id: aiLookSessions.id })
      .from(aiLookSessions)
      .where(eq(aiLookSessions.bookingId, bookingId));

    for (const s of sessions) {
      await db
        .update(aiGeneratedLooks)
        .set({ status: "generated" })
        .where(and(eq(aiGeneratedLooks.aiSessionId, s.id), ne(aiGeneratedLooks.id, lookId)));
    }

    // Remove existing final selections
    await db
      .delete(lookSelections)
      .where(and(eq(lookSelections.bookingId, bookingId), eq(lookSelections.isFinal, true)));

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);

    // Find an employee for the log
    const [firstEmp] = await db
      .select()
      .from(bookingEmployees)
      .where(eq(bookingEmployees.bookingId, bookingId))
      .limit(1);

    await db.insert(lookSelections).values({
      salonId: session.user.salonId,
      bookingId,
      clientId: booking.clientId,
      generatedLookId: lookId,
      selectedByEmployeeId: firstEmp?.employeeId ?? null,
      status: "selected",
      isFinal: true,
    });

    await db
      .update(bookings)
      .set({ finalLookStatus: "selected", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));

    if (firstEmp) {
      await db.insert(employeeWorkLogs).values({
        salonId: session.user.salonId,
        bookingId,
        clientId: booking.clientId,
        employeeId: firstEmp.employeeId,
        workType: "final_look_selected",
        description: `Final bridal look selected for ${booking.eventType} event`,
      });
    }
  }

  return NextResponse.json(updated);
}
