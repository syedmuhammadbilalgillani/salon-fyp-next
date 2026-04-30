"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { bookingSchema, type BookingInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Suspense } from "react";

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const label = `${h > 12 ? h - 12 : h}:${m} ${h >= 12 ? "PM" : "AM"}`;
  return { value: `${String(h).padStart(2, "0")}:${m}`, label };
});

const EVENT_TYPES = ["mehndi", "barat", "valima", "engagement", "other"];
const ASSIGNMENT_ROLES = ["makeup", "hair", "styling", "consultation"];

function NewBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preClientId = searchParams.get("clientId");

  const [step, setStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Record<string, string> | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<Record<string, string>[]>([]);
  const [services, setServices] = useState<Record<string, string>[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Record<string, string>[]>([]);
  const [employeeAssignments, setEmployeeAssignments] = useState<{ employeeId: string; assignmentRole: string }[]>([]);
  const [timeSlot, setTimeSlot] = useState("10:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { employeeAssignments: [], serviceIds: [], advancePaid: 0, totalAmount: 0 },
  });

  const eventType = watch("eventType");
  const bookingDate = watch("bookingDate");
  const advancePaid = watch("advancePaid");

  const totalAmount = selectedServices.reduce((sum, id) => {
    const svc = services.find((s) => s.id === id);
    return sum + (svc ? Number(svc.price) : 0);
  }, 0);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
    fetch("/api/employees").then((r) => r.json()).then(setEmployees);
  }, []);

  useEffect(() => {
    if (preClientId) {
      fetch(`/api/clients/${preClientId}`)
        .then((r) => r.json())
        .then((d) => { if (d.client) { setSelectedClient(d.client); setValue("clientId", d.client.id); } });
    }
  }, [preClientId, setValue]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!clientSearch) { setClientResults([]); return; }
      fetch(`/api/clients?search=${clientSearch}`)
        .then((r) => r.json())
        .then(setClientResults);
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  useEffect(() => {
    setValue("serviceIds", selectedServices);
    setValue("totalAmount", totalAmount);
  }, [selectedServices, totalAmount, setValue]);

  useEffect(() => {
    setValue("employeeAssignments", employeeAssignments as BookingInput["employeeAssignments"]);
  }, [employeeAssignments, setValue]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const toggleEmployee = (empId: string) => {
    setEmployeeAssignments((prev) => {
      if (prev.find((e) => e.employeeId === empId)) return prev.filter((e) => e.employeeId !== empId);
      return [...prev, { employeeId: empId, assignmentRole: "makeup" }];
    });
  };

  const setRole = (empId: string, role: string) => {
    setEmployeeAssignments((prev) =>
      prev.map((e) => e.employeeId === empId ? { ...e, assignmentRole: role } : e)
    );
  };

  const onSubmit = async (data: BookingInput) => {
    setIsSubmitting(true);
    try {
      const dateTime = new Date(`${data.bookingDate}T${timeSlot}`);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, bookingDate: dateTime.toISOString(), advancePaid: Number(data.advancePaid) }),
      });
      if (!res.ok) { toast.error("Failed to create booking"); return; }
      const booking = await res.json();
      toast.success("Booking created successfully");
      router.push(`/bookings/${booking.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { n: 1, label: "Client" },
    { n: 2, label: "Details" },
    { n: 3, label: "Staff" },
  ];

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= s.n ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
              {step > s.n ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span className={`text-sm font-medium ${step === s.n ? "text-rose-700" : "text-gray-400"}`}>{s.label}</span>
            {i < steps.length - 1 && <div className="h-px w-8 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Step 1 — Select Client</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {selectedClient ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-rose-50 border-rose-200">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedClient.fullName}</p>
                    <p className="text-sm text-gray-500">{selectedClient.phone}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setSelectedClient(null); setValue("clientId", ""); }}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search client by name or phone…"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-9"
                  />
                  {clientResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {clientResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-rose-50 transition-colors border-b last:border-b-0"
                          onClick={() => { setSelectedClient(c); setValue("clientId", c.id); setClientSearch(""); setClientResults([]); }}
                        >
                          <p className="font-medium text-sm">{c.fullName}</p>
                          <p className="text-xs text-gray-500">{c.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.clientId && <p className="text-xs text-red-500">{errors.clientId.message}</p>}
              <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => { if (!selectedClient) { toast.error("Select a client first"); return; } setStep(2); }} className="bg-primary hover:bg-rose-700">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Step 2 — Booking Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Event Type *</Label>
                  <Select onValueChange={(v) => setValue("eventType", v as BookingInput["eventType"])}>
                    <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((e) => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.eventType && <p className="text-xs text-red-500">{errors.eventType.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <Input type="date" {...register("bookingDate")} min={new Date().toISOString().split("T")[0]} />
                  {errors.bookingDate && <p className="text-xs text-red-500">{errors.bookingDate.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Time</Label>
                  <Select value={timeSlot} onValueChange={setTimeSlot}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Advance Paid (Rs.)</Label>
                  <Input type="number" {...register("advancePaid", { valueAsNumber: true })} min={0} max={totalAmount} />
                  {errors.advancePaid && <p className="text-xs text-red-500">{errors.advancePaid.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Services *</Label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {services.map((s) => {
                    const selected = selectedServices.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border text-sm text-left transition-colors ${selected ? "border-rose-400 bg-rose-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <span className="font-medium">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Rs.{Number(s.price).toLocaleString()}</span>
                          {selected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {totalAmount > 0 && (
                  <p className="text-sm font-semibold text-gray-900">Total: Rs.{totalAmount.toLocaleString()}</p>
                )}
                {errors.serviceIds && <p className="text-xs text-red-500">{errors.serviceIds.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea {...register("notes")} rows={3} placeholder="Any special requirements…" />
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button type="button" onClick={() => { if (!eventType || !bookingDate || selectedServices.length === 0) { toast.error("Fill all required fields"); return; } setStep(3); }} className="bg-primary hover:bg-rose-700">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Step 3 — Assign Staff</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {employees.filter((e) => e.status === "active").map((emp) => {
                  const assigned = employeeAssignments.find((a) => a.employeeId === emp.id);
                  return (
                    <div
                      key={emp.id}
                      className={`p-3 rounded-lg border transition-colors ${assigned ? "border-rose-400 bg-rose-50" : "border-gray-200"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{emp.role?.replace("_", " ")}</p>
                        </div>
                        <Button type="button" size="sm" variant={assigned ? "default" : "outline"} onClick={() => toggleEmployee(emp.id)}
                          className={assigned ? "bg-primary hover:bg-rose-700" : ""}>
                          {assigned ? "Assigned" : "Assign"}
                        </Button>
                      </div>
                      {assigned && (
                        <div className="mt-2">
                          <Select value={assigned.assignmentRole} onValueChange={(v) => setRole(emp.id, v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ASSIGNMENT_ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.employeeAssignments && <p className="text-xs text-red-500">{errors.employeeAssignments.message}</p>}

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button type="submit" className="bg-primary hover:bg-rose-700" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create Booking"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense>
      <NewBookingForm />
    </Suspense>
  );
}
