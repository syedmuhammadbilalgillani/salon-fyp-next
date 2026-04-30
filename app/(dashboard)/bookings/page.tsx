"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_TABS = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled"] as const;

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

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = activeTab === "all" ? "/api/bookings" : `/api/bookings?status=${activeTab}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setBookings(Array.isArray(d) ? d : []); setLoading(false); });
  }, [activeTab]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500">Track all client appointments</p>
        </div>
        <Link href="/bookings/new">
          <Button className="bg-primary hover:bg-rose-700">
            <Plus className="w-4 h-4 mr-1" /> New Booking
          </Button>
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                ))}
              </tr>
            ))}
            {!loading && bookings.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No bookings found</td></tr>
            )}
            {!loading && bookings.map((b: Record<string, unknown>) => (
              <tr key={b.id as string} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{b.clientName as string}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${eventColors[b.eventType as string] ?? ""}`}>
                    {b.eventType as string}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {b.bookingDate ? format(new Date(b.bookingDate as string), "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[b.status as string] ?? ""}`}>
                    {(b.status as string).replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">Rs.{Number(b.totalAmount as string).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/bookings/${b.id}`}>
                    <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
