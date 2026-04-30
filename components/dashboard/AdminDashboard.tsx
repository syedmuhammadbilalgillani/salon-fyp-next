import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/db/index";
import { clients, bookings, employees, aiGeneratedLooks, aiLookSessions } from "@/db/schema";
import { eq, and, count, gte, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, UserCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const salonId = session!.user.salonId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [[{ totalClients }], [{ todayBookings }], [{ activeEmployees }], [{ totalLooks }]] =
    await Promise.all([
      db.select({ totalClients: count() }).from(clients).where(and(eq(clients.salonId, salonId), eq(clients.isActive, true))),
      db.select({ todayBookings: count() }).from(bookings).where(and(eq(bookings.salonId, salonId), gte(bookings.bookingDate, today))),
      db.select({ activeEmployees: count() }).from(employees).where(and(eq(employees.salonId, salonId), eq(employees.status, "active"))),
      db.select({ totalLooks: count() }).from(aiGeneratedLooks)
        .leftJoin(aiLookSessions, eq(aiGeneratedLooks.aiSessionId, aiLookSessions.id))
        .where(eq(aiLookSessions.salonId, salonId)),
    ]);

  const recentBookings = await db
    .select({
      id: bookings.id,
      eventType: bookings.eventType,
      bookingDate: bookings.bookingDate,
      status: bookings.status,
      clientName: clients.fullName,
    })
    .from(bookings)
    .leftJoin(clients, eq(bookings.clientId, clients.id))
    .where(eq(bookings.salonId, salonId))
    .orderBy(desc(bookings.bookingDate))
    .limit(5);

  const recentClients = await db
    .select()
    .from(clients)
    .where(and(eq(clients.salonId, salonId), eq(clients.isActive, true)))
    .orderBy(desc(clients.createdAt))
    .limit(5);

  const stats = [
    { label: "Total Clients", value: totalClients, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Today's Bookings", value: todayBookings, icon: Calendar, color: "text-primary", bg: "bg-rose-50" },
    { label: "Active Employees", value: activeEmployees, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "AI Looks Generated", value: totalLooks, icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back to Shall be</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Bookings</CardTitle>
              <Link href="/bookings" className="text-xs text-primary hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentBookings.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No bookings yet</p>
            )}
            {recentBookings.map((b) => (
              <Link key={b.id} href={`/bookings/${b.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.clientName}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {b.eventType} · {b.bookingDate ? format(new Date(b.bookingDate), "MMM d, yyyy") : "—"}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[b.status] ?? ""}`}>
                  {b.status?.replace("_", " ")}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Clients</CardTitle>
              <Link href="/clients" className="text-xs text-primary hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentClients.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No clients yet</p>
            )}
            {recentClients.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.fullName}</p>
                  <p className="text-xs text-gray-500">{c.phone}</p>
                </div>
                {c.weddingDate && (
                  <span className="text-xs text-gray-400">
                    Wed: {format(new Date(c.weddingDate), "MMM d, yyyy")}
                  </span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
