"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const workTypeColors: Record<string, string> = {
  booking_assigned: "bg-blue-100 text-blue-800",
  final_look_selected: "bg-purple-100 text-purple-800",
  status_changed: "bg-orange-100 text-orange-800",
};

const eventColors: Record<string, string> = {
  mehndi: "bg-amber-100 text-amber-800",
  barat: "bg-red-100 text-red-800",
  valima: "bg-green-100 text-green-800",
  engagement: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

export default function WorkHistoryPage() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState<Record<string, string>[]>([]);
  const [filters, setFilters] = useState({ employeeId: "", from: "", to: "", eventType: "", workType: "" });

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then((d) => setEmployees(Array.isArray(d) ? d : []));
  }, []);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filters.employeeId) params.set("employeeId", filters.employeeId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.workType) params.set("workType", filters.workType);

    fetch(`/api/work-history?${params}`)
      .then((r) => r.json())
      .then((d) => { setLogs(Array.isArray(d.data) ? d.data : []); setLoading(false); });
  }, [page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const clearFilters = () => setFilters({ employeeId: "", from: "", to: "", eventType: "", workType: "" });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Work History</h1>
        <p className="text-sm text-gray-500">Complete timeline of all salon activities</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-xl">
        <div className="space-y-1">
          <Label className="text-xs">Employee</Label>
          <Select value={filters.employeeId} onValueChange={(v) => setFilters((p) => ({ ...p, employeeId: v === "_all" ? "" : v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All employees" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All</SelectItem>
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" className="h-8 text-xs" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" className="h-8 text-xs" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Event Type</Label>
          <Select value={filters.eventType} onValueChange={(v) => setFilters((p) => ({ ...p, eventType: v === "_all" ? "" : v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All events" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All</SelectItem>
              {["mehndi", "barat", "valima", "engagement", "other"].map((e) => (
                <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Work Type</Label>
          <Select value={filters.workType} onValueChange={(v) => setFilters((p) => ({ ...p, workType: v === "_all" ? "" : v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All</SelectItem>
              <SelectItem value="booking_assigned">Booking Assigned</SelectItem>
              <SelectItem value="final_look_selected">Look Selected</SelectItem>
              <SelectItem value="status_changed">Status Changed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 md:col-span-5 flex justify-end">
          <Button size="sm" variant="ghost" onClick={clearFilters} className="text-xs">Clear filters</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date & Time</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                ))}
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No work history found</td></tr>
            )}
            {!loading && logs.map((log) => (
              <tr key={log.id as string} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {log.createdAt ? format(new Date(log.createdAt as string), "MMM d, p") : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/clients/${log.clientId}`} className="font-medium text-gray-900 hover:text-primary">
                    {log.clientName as string}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {log.eventType && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${eventColors[log.eventType as string] ?? ""}`}>
                      {log.eventType as string}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm">{log.employeeName as string}</p>
                  <p className="text-xs text-gray-400 capitalize">{(log.employeeRole as string)?.replace("_", " ")}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${workTypeColors[log.workType as string] ?? "bg-gray-100 text-gray-700"}`}>
                    {(log.workType as string).replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{log.description as string ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-500">Page {page}</span>
        <Button size="sm" variant="outline" disabled={logs.length < 20} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
