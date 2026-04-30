"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service } from "@/types";

function formatMoney(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isFinite(n)) return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return String(v ?? "0");
}

export function ServicesTable() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (includeInactive) params.set("includeInactive", "1");
    const res = await fetch(`/api/services?${params.toString()}`);
    const data = await res.json();
    setServices(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, includeInactive]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchServices();
    }, 250);
    return () => clearTimeout(t);
  }, [fetchServices]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative w-80 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            className="text-xs text-gray-600"
            onClick={() => setIncludeInactive((v) => !v)}
          >
            {includeInactive ? (
              <ToggleRight className="w-4 h-4 mr-2 text-primary" />
            ) : (
              <ToggleLeft className="w-4 h-4 mr-2 text-gray-400" />
            )}
            Show inactive
          </Button>
        </div>

        <Link href="/services/new">
          <Button className="bg-primary hover:bg-rose-700">
            <Plus className="w-4 h-4 mr-1" /> Add Service
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Duration</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && services.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No services found
                </td>
              </tr>
            )}

            {!loading &&
              services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    {s.description && (
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {s.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.durationMinutes} min</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">Rs {formatMoney(s.price)}</td>
                  <td className="px-4 py-3">
                    {s.isActive ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/services/${s.id}`}>
                      <Button size="sm" variant="ghost">
                        <Pencil className="w-4 h-4" />
                      </Button>
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

