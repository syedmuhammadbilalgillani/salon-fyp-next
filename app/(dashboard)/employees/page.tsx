"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const ROLE_FILTERS = ["all", "makeup_artist", "hair_stylist", "stylist", "receptionist", "salon_admin"];

const roleColors: Record<string, string> = {
  makeup_artist: "bg-pink-100 text-pink-800",
  hair_stylist: "bg-purple-100 text-purple-800",
  stylist: "bg-blue-100 text-blue-800",
  receptionist: "bg-gray-100 text-gray-800",
  salon_admin: "bg-red-100 text-red-800",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    const url = roleFilter === "all" ? "/api/employees" : `/api/employees?role=${roleFilter}`;
    fetch(url).then((r) => r.json()).then((d) => { setEmployees(Array.isArray(d) ? d : []); setLoading(false); });
  }, [roleFilter]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500">Manage your salon team</p>
        </div>
        <Link href="/employees/new">
          <Button className="bg-primary hover:bg-rose-700"><Plus className="w-4 h-4 mr-1" /> Add Employee</Button>
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize whitespace-nowrap transition-colors ${
              roleFilter === r ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {r.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && employees.length === 0 && (
          <p className="text-sm text-gray-400 col-span-full text-center py-12">No employees found</p>
        )}
        {!loading && employees.map((emp) => (
          <Link key={emp.id as string} href={`/employees/${emp.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-rose-700">
                      {(emp.name as string)[0].toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {emp.status as string}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{emp.name as string}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block ${roleColors[(emp.role as string)] ?? ""}`}>
                  {(emp.role as string).replace("_", " ")}
                </span>
                {emp.specialization && (
                  <p className="text-xs text-gray-500 mt-1">{emp.specialization as string}</p>
                )}
                {(emp.experienceYears as number) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{emp.experienceYears as number} yrs experience</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
