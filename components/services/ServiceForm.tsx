"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { serviceSchema, type ServiceInput, type ServiceParsed } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Service } from "@/types";

type Props = {
  mode: "create" | "edit";
  initial?: Service | null;
};

export function ServiceForm({ mode, initial }: Props) {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      durationMinutes: 60,
      isActive: true,
    },
  });

  useEffect(() => {
    if (mode === "edit" && initial) {
      reset({
        name: (initial.name ?? "") as string,
        description: (initial.description ?? "") as string,
        price: Number(initial.price ?? 0),
        durationMinutes: Number(initial.durationMinutes ?? 60),
        isActive: Boolean(initial.isActive),
      });
    }
  }, [mode, initial, reset]);

  const onSubmit = async (data: ServiceInput) => {
    const payload: ServiceParsed = serviceSchema.parse(data);

    const res = await fetch(
      mode === "create" ? "/api/services" : `/api/services/${initial?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body?.error ? "Validation error" : "Request failed");
      return;
    }

    toast.success(mode === "create" ? "Service created" : "Service updated");
    if (mode === "create") router.push(`/services/${body.id}`);
    router.refresh();
  };

  const deactivate = async () => {
    if (!initial?.id) return;
    const res = await fetch(`/api/services/${initial.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to deactivate service");
      return;
    }
    toast.success("Service deactivated");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {mode === "create" ? "Service Details" : "Edit Service"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Service Name *</Label>
            <Input {...register("name")} placeholder="Bridal Makeup Package" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={3} placeholder="What’s included…" />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Price (Rs) *</Label>
              <Input type="number" step="0.01" min={0} {...register("price", { valueAsNumber: true })} />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Duration (minutes) *</Label>
              <Input type="number" min={1} max={1440} {...register("durationMinutes", { valueAsNumber: true })} />
              {errors.durationMinutes && (
                <p className="text-xs text-red-500">{errors.durationMinutes.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="bg-primary hover:bg-rose-700" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : mode === "create" ? "Create Service" : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            {mode === "edit" && initial?.isActive && (
              <Button type="button" variant="destructive" onClick={deactivate} disabled={isSubmitting}>
                Deactivate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

