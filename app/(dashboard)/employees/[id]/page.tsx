"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, KeyRound, ShieldOff, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ROLE_COLORS, ROLE_LABELS, type UserRole } from "@/lib/permissions";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "salon_admin";

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountDialog, setAccountDialog] = useState(false);
  const [revokeDialog, setRevokeDialog] = useState(false);
  const [accountForm, setAccountForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    fetch(`/api/employees/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, [id]);

  const createAccount = async () => {
    if (!accountForm.email || !accountForm.password) {
      toast.error("Email and password are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${id}/account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountForm),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Failed to create account");
      } else {
        toast.success("Login account created! Employee can now sign in.");
        setAccountDialog(false);
        setAccountForm({ email: "", password: "" });
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  const revokeAccount = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${id}/account`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Login access revoked");
        setRevokeDialog(false);
        fetchData();
      } else {
        toast.error("Failed to revoke access");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (!data) return <div className="p-6 text-gray-500">Employee not found</div>;

  const emp = data.employee as Record<string, unknown>;
  const bookingsList = data.bookings as Record<string, unknown>[];
  const workLogs = data.workLogs as Record<string, unknown>[];
  const hasAccount = !!emp.userId;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/employees" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to Employees
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-rose-700">
                {(emp.name as string).split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{emp.name as string}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[emp.role as UserRole] ?? "bg-gray-100 text-gray-700"}`}>
                  {ROLE_LABELS[emp.role as UserRole] ?? emp.role as string}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {emp.status as string}
                </span>
                {hasAccount && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> Login Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Admin-only account actions */}
          {isAdmin && (
            <div className="flex gap-2 flex-shrink-0">
              {!hasAccount ? (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                  onClick={() => setAccountDialog(true)}
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                  Create Login
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                  onClick={() => setRevokeDialog(true)}
                >
                  <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
                  Revoke Access
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {emp.phone && (
          <Card><CardContent className="p-4">
            <p className="text-xs text-gray-500">Phone</p>
            <p className="font-medium text-sm mt-0.5">{emp.phone as string}</p>
          </CardContent></Card>
        )}
        {emp.email && (
          <Card><CardContent className="p-4">
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium text-sm mt-0.5 truncate">{emp.email as string}</p>
          </CardContent></Card>
        )}
        {emp.specialization && (
          <Card><CardContent className="p-4">
            <p className="text-xs text-gray-500">Specialization</p>
            <p className="font-medium text-sm mt-0.5">{emp.specialization as string}</p>
          </CardContent></Card>
        )}
        {(emp.experienceYears as number) > 0 && (
          <Card><CardContent className="p-4">
            <p className="text-xs text-gray-500">Experience</p>
            <p className="font-medium text-sm mt-0.5">{emp.experienceYears as number} years</p>
          </CardContent></Card>
        )}
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Total Bookings</p>
          <p className="font-bold text-lg text-primary mt-0.5">{bookingsList?.length ?? 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Work Entries</p>
          <p className="font-bold text-lg text-purple-600 mt-0.5">{workLogs?.length ?? 0}</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Assigned Bookings ({bookingsList?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="history">Work History ({workLogs?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  {isAdmin && <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookingsList?.length === 0 && (
                  <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-gray-400">No bookings assigned yet</td></tr>
                )}
                {bookingsList?.map((b) => (
                  <tr key={b.id as string} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{b.clientName as string}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{b.eventType as string}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {b.bookingDate ? format(new Date(b.bookingDate as string), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[b.status as string] ?? ""}`}>
                        {(b.status as string)?.replace("_", " ")}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <Link href={`/bookings/${b.id}`} className="text-xs text-primary hover:underline">View</Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="space-y-3">
            {workLogs?.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No work history yet</p>
            )}
            {workLogs?.map((log) => (
              <div key={log.id as string} className="flex gap-3 p-3 rounded-lg border bg-white">
                <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{log.description as string ?? log.workType as string}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium capitalize">{log.clientName as string}</span>
                    {log.eventType && <> · {log.eventType as string}</>}
                    {" · "}{format(new Date(log.createdAt as string), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create account dialog */}
      <Dialog open={accountDialog} onOpenChange={setAccountDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Login for {emp.name as string}</DialogTitle>
            <DialogDescription>
              This will let the employee sign in with their own credentials and access the system with their role permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="hira@salon.com"
                value={accountForm.email}
                onChange={(e) => setAccountForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Temporary Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={accountForm.password}
                  onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">Share this password with the employee — they can't change it yet.</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 space-y-1">
              <p className="font-medium">Access level: {ROLE_LABELS[emp.role as UserRole] ?? emp.role as string}</p>
              {["makeup_artist", "hair_stylist", "stylist"].includes(emp.role as string) && (
                <p>Can view: My Bookings, AI Studio, Work History</p>
              )}
              {emp.role === "receptionist" && (
                <p>Can view: Dashboard, Clients, Bookings, Work History</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={createAccount} disabled={saving}>
                {saving ? "Creating…" : "Create Account"}
              </Button>
              <Button variant="outline" onClick={() => setAccountDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke access dialog */}
      <Dialog open={revokeDialog} onOpenChange={setRevokeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke Login Access</DialogTitle>
            <DialogDescription>
              {emp.name as string} will no longer be able to sign in. Their data and history will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={revokeAccount} disabled={saving}>
              {saving ? "Revoking…" : "Revoke Access"}
            </Button>
            <Button variant="outline" onClick={() => setRevokeDialog(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
