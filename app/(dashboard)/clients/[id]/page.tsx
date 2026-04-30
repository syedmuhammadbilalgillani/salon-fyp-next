import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import db from "@/db/index";
import { aiGeneratedLooks, aiLookSessions, bookings, clients, employeeWorkLogs, employees } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { format } from "date-fns";
import { and, desc, eq } from "drizzle-orm";
import { Calendar, ChevronLeft, Mail, Phone } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.salonId, session!.user.salonId)))
    .limit(1);

  if (!client) notFound();

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

  const allLooks = sessions.length
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
    })
    .from(employeeWorkLogs)
    .leftJoin(employees, eq(employeeWorkLogs.employeeId, employees.id))
    .where(eq(employeeWorkLogs.clientId, id))
    .orderBy(desc(employeeWorkLogs.createdAt));

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/clients" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to Clients
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.fullName}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{client.phone}</span>
              {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{client.email}</span>}
              {client.weddingDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Wedding: {format(new Date(client.weddingDate), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
          <Link href={`/bookings/new?clientId=${client.id}`}>
            <Button className="bg-primary hover:bg-rose-700">+ New Booking</Button>
          </Link>
        </div>

        {(client.skinTone || client.faceShape) && (
          <div className="flex gap-2 mt-3">
            {client.skinTone && <Badge variant="outline">{client.skinTone} skin</Badge>}
            {client.skinUndertone && <Badge variant="outline">{client.skinUndertone} undertone</Badge>}
            {client.faceShape && <Badge variant="outline">{client.faceShape} face</Badge>}
          </div>
        )}
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Bookings ({clientBookings.length})</TabsTrigger>
          <TabsTrigger value="looks">AI Looks ({allLooks.length})</TabsTrigger>
          <TabsTrigger value="history">Styling History</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          <div className="space-y-3">
            {clientBookings.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No bookings yet</p>
            )}
            {clientBookings.map((b) => (
              <Link key={b.id} href={`/bookings/${b.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{b.eventType} Event</p>
                      <p className="text-sm text-gray-500">{format(new Date(b.bookingDate), "PPP")}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[b.status] ?? ""}`}>
                      {b.status.replace("_", " ")}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="looks" className="mt-4">
          {allLooks.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No AI looks generated yet</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allLooks.map((look) => (
              <div key={look.id} className="rounded-lg overflow-hidden border bg-white">
                <div className="aspect-[3/4] bg-gray-100 relative">
                  <img src={look.imageUrl} alt={look.title ?? "Look"} className="w-full h-full object-cover" />
                  {look.status === "selected" && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      ✓ Final
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-700">{look.title}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="space-y-3">
            {workLogs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No styling history yet</p>
            )}
            {workLogs.map((log) => (
              <div key={log.id} className="flex gap-3 p-3 rounded-lg border bg-white">
                <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.description ?? log.workType}</p>
                  <p className="text-xs text-gray-500">
                    {log.employeeName} · {format(new Date(log.createdAt), "PPp")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
