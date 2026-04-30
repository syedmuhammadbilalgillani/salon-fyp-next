"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChevronLeft, Sparkles, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Client } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const eventColors: Record<string, string> = {
  mehndi: "bg-amber-100 text-amber-800",
  barat: "bg-red-100 text-red-800",
  valima: "bg-green-100 text-green-800",
  engagement: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, [id]);

  const updateStatus = async (status: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success("Status updated"); fetchData(); }
    else toast.error("Failed to update status");
  };

  if (loading) return <div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  if (!data) return <div className="p-6 text-gray-500">Booking not found</div>;

  const booking = data.booking as Record<string, unknown>;
  const client = data.client as Client;
  const emps = data.employees as Record<string, unknown>[];
  const services = data.services as Record<string, unknown>[];
  const looks = data.looks as Record<string, unknown>[];
  const finalLook = data.finalLook as Record<string, unknown> | null;
  const workLogs = data.workLogs as Record<string, unknown>[];

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/bookings" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to Bookings
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Booking #{(booking.id as string).slice(-8).toUpperCase()}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${eventColors[booking.eventType as string] ?? ""}`}>
              {booking.eventType as string}
            </span>
          </div>
          <Select defaultValue={booking.status as string} onValueChange={updateStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {booking.bookingDate ? format(new Date(booking.bookingDate as string), "PPPp") : "—"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Client Information</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{client?.fullName as string}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{client?.phone as string}</span></div>
              {client?.email && <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{client.email as string}</span></div>}
              {client?.skinTone && <div className="flex justify-between"><span className="text-gray-500">Skin Tone</span><span>{client.skinTone as string}</span></div>}
              {client?.faceShape && <div className="flex justify-between"><span className="text-gray-500">Face Shape</span><span>{client.faceShape as string}</span></div>}
              <div className="pt-1">
                <Link href={`/clients/${client?.id}`} className="text-primary text-xs hover:underline">View Client Profile →</Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Assigned Staff</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {emps?.map((e) => (
                <div key={e.id as string} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{e.name as string}</p>
                    <p className="text-xs text-gray-500 capitalize">{(e.role as string)?.replace("_", " ")}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">{e.assignmentRole as string}</Badge>
                </div>
              ))}
              {(!emps || emps.length === 0) && <p className="text-sm text-gray-400">No staff assigned</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Services & Payment</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {services?.map((s) => (
                <div key={s.id as string} className="flex justify-between text-sm">
                  <span>{s.name as string}</span>
                  <span className="font-medium">Rs.{Number(s.priceAtBooking).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>Rs.{Number(booking.totalAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Advance Paid</span>
                  <span>Rs.{Number(booking.advancePaid).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-orange-600 font-medium">
                  <span>Balance Due</span>
                  <span>Rs.{(Number(booking.totalAmount) - Number(booking.advancePaid)).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" /> AI Studio</CardTitle></CardHeader>
            <CardContent>
              {finalLook ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Final Look Selected
                  </div>
                  <div className="aspect-3/4 rounded-lg overflow-hidden">
                    <img src={finalLook.imageUrl as string} alt="Final Look" className="w-full h-full object-cover" />
                  </div>
                  <Link href={`/ai-studio/${id}`}>
                    <Button variant="outline" size="sm" className="w-full">Change Look</Button>
                  </Link>
                </div>
              ) : looks && looks.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <Clock className="w-4 h-4" />
                    Looks generated — select final
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {looks.slice(0, 4).map((l) => (
                      <div key={l.id as string} className="aspect-[3/4] rounded overflow-hidden bg-gray-100">
                        <img src={l.imageUrl as string} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <Link href={`/ai-studio/${id}`}>
                    <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">View & Select Look</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 text-center py-4">
                  <p className="text-sm text-gray-400">No AI looks generated yet</p>
                  <Link href={`/ai-studio/${id}`}>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Open AI Studio</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {workLogs && workLogs.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Work Timeline</CardTitle></CardHeader>
              <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                {workLogs.map((log) => (
                  <div key={log.id as string} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-800">{log.description as string ?? log.workType as string}</p>
                      <p className="text-xs text-gray-400">{log.employeeName as string} · {format(new Date(log.createdAt as string), "MMM d, p")}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
