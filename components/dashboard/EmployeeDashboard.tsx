"use client";

import { EmployeeWorkLog } from "@/app/(dashboard)/work-history/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_COLORS, ROLE_LABELS, type UserRole } from "@/lib/permissions";
import { Employee } from "@/types";
import { format, isFuture, isToday } from "date-fns";
import { Calendar, CheckCircle, ClipboardList, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

export function EmployeeDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [noEmployee, setNoEmployee] = useState(false);

  useEffect(() => {
    fetch("/api/employees/me")
      .then((r) => {
        if (r.status === 404) { setNoEmployee(true); setLoading(false); return null; }
        return r.json();
      })
      .then((d) => { if (d) { setData(d); setLoading(false); } });
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (noEmployee) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center py-16 space-y-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <ClipboardList className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">No Employee Profile Found</h2>
          <p className="text-sm text-gray-500">
            Your account is not yet linked to an employee record. Please ask your salon admin to set this up.
          </p>
        </div>
      </div>
    );
  }

  const emp = data?.employee as Employee;
  const bookings = (data?.bookings as Record<string, unknown>[]) ?? [];
  const workLogs = (data?.workLogs as EmployeeWorkLog[]) ?? [];
  const stats = data?.stats as Record<string, number>;

  const upcomingBookings = bookings.filter(
    (b) => b.bookingDate && (isToday(new Date(b.bookingDate as string)) || isFuture(new Date(b.bookingDate as string)))
  ).slice(0, 5);

  const recentLogs = workLogs.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {session?.user?.fullName?.split(" ")[0] ?? "there"}!
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[emp?.role as UserRole] ?? "bg-gray-100 text-gray-700"}`}>
            {ROLE_LABELS[emp?.role as UserRole] ?? emp?.role as string}
          </span>
          {emp?.specialization && (
            <span className="text-sm text-gray-500">· {emp.specialization as string}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total ?? 0}</p>
              <p className="text-xs text-gray-500">Total Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.todayUpcoming ?? 0}</p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.completed ?? 0}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.workLogs ?? 0}</p>
              <p className="text-xs text-gray-500">Work Entries</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming bookings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Bookings</CardTitle>
              <Link href="/my-bookings" className="text-xs text-primary hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingBookings.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No upcoming bookings</p>
            )}
            {upcomingBookings.map((b) => (
              <Link key={b.id as string} href={`/bookings/${b.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.clientName as string}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${eventColors[b.eventType as string] ?? ""}`}>
                      {b.eventType as string}
                    </span>
                    <span className="text-xs text-gray-400">
                      {b.bookingDate ? format(new Date(b.bookingDate as string), "MMM d, yyyy") : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[b.status as string] ?? ""}`}>
                    {(b.status as string)?.replace("_", " ")}
                  </span>
                  {b.finalLookStatus === "selected" && (
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent work */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Link href="/work-history" className="text-xs text-primary hover:underline">Full history →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLogs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No activity yet</p>
            )}
            {recentLogs.map((log) => (
              <div key={log.id as string} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {log.description as string ?? (log.workType as string).replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {log.clientName as string}
                    {log.eventType && <> · <span className="capitalize">{log.eventType as string}</span></>}
                    {" · "}{format(new Date(log.createdAt as string), "MMM d")}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
