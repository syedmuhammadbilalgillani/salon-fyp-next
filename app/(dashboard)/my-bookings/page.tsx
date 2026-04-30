"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, isFuture, isToday, isPast } from "date-fns";
import { Calendar, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const STATUS_TABS = ["all", "upcoming", "in_progress", "completed", "cancelled"] as const;
type Tab = (typeof STATUS_TABS)[number];

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

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [noEmployee, setNoEmployee] = useState(false);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    fetch("/api/employees/me")
      .then((r) => {
        if (r.status === 404) { setNoEmployee(true); setLoading(false); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) { setBookings(d.bookings ?? []); setLoading(false); }
      });
  }, []);

  const filtered = bookings.filter((b) => {
    if (tab === "all") return true;
    if (tab === "upcoming") {
      return b.bookingDate &&
        (isToday(new Date(b.bookingDate as string)) || isFuture(new Date(b.bookingDate as string)));
    }
    return b.status === tab;
  });

  if (noEmployee) {
    return (
      <div className="p-6 text-center py-20 text-gray-400">
        <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">No employee profile linked</p>
        <p className="text-sm">Ask your admin to link your account to an employee record.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-sm text-gray-500">All appointments you are assigned to</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize whitespace-nowrap transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No bookings found for this filter</p>
          </div>
        )}

        {!loading && filtered.map((b) => (
          <div key={b.id as string} className="flex items-center justify-between p-4 bg-white rounded-xl border hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3 min-w-0">
              {/* Date column */}
              <div className="text-center bg-rose-50 rounded-lg p-2 w-14 flex-shrink-0">
                <p className="text-xs text-rose-500 font-medium uppercase">
                  {b.bookingDate ? format(new Date(b.bookingDate as string), "MMM") : "—"}
                </p>
                <p className="text-xl font-bold text-rose-700 leading-tight">
                  {b.bookingDate ? format(new Date(b.bookingDate as string), "d") : "—"}
                </p>
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{b.clientName as string}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${eventColors[b.eventType as string] ?? ""}`}>
                    {b.eventType as string}
                  </span>
                  <span className="text-xs text-gray-400">{b.clientPhone as string}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs capitalize">{(b.assignmentRole as string)?.replace("_", " ")}</Badge>
                  {b.finalLookStatus === "selected" && (
                    <span className="text-xs flex items-center gap-0.5 text-purple-600">
                      <Sparkles className="w-3 h-3" /> Look selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[b.status as string] ?? ""}`}>
                {(b.status as string)?.replace("_", " ")}
              </span>
              <div className="flex gap-1.5">
                <Link href={`/bookings/${b.id}`}>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href={`/ai-studio/${b.id}`}>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50">
                    <Sparkles className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
