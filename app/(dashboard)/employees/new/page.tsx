"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { employeeSchema, type EmployeeInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import z from "zod";

const ROLES = ["makeup_artist", "hair_stylist", "stylist", "receptionist", "salon_admin"];

export default function NewEmployeePage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<z.input<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { experienceYears: 0, status: "active" },
  });

  const onSubmit = async (data: EmployeeInput) => {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Failed to add employee"); return; }
    toast.success("Employee added");
    router.push("/employees");
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Add Employee</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader><CardTitle className="text-base">Employee Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label>Full Name *</Label>
                <Input {...register("name")} placeholder="Hira Baig" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Phone *</Label>
                <Input {...register("phone")} placeholder="03001234567" />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input {...register("email")} type="email" placeholder="hira@salon.com" />
              </div>
              <div className="space-y-1">
                <Label>Role *</Label>
                <Select onValueChange={(v) => setValue("role", v as EmployeeInput["role"])}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select defaultValue="active" onValueChange={(v) => setValue("status", v as "active" | "inactive")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Specialization</Label>
                <Input {...register("specialization")} placeholder="e.g. Bridal Makeup" />
              </div>
              <div className="space-y-1">
                <Label>Experience (years)</Label>
                <Input type="number" {...register("experienceYears", { valueAsNumber: true })} min={0} max={50} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Notes</Label>
                <Textarea {...register("notes")} rows={3} placeholder="Any additional notes…" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-primary hover:bg-rose-700" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Add Employee"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
