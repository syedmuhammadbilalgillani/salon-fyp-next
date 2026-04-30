"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientSchema, type ClientInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClientForm() {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = async (data: ClientInput) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Failed to create client");
      return;
    }
    const client = await res.json();
    toast.success("Client added successfully");
    router.push(`/clients/${client.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Full Name *</Label>
              <Input {...register("fullName")} placeholder="Fatima Ahmed" />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Phone Number *</Label>
              <Input {...register("phone")} placeholder="03001234567" />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input {...register("email")} type="email" placeholder="client@email.com" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Wedding Date</Label>
              <Input {...register("weddingDate")} type="date" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Appearance & Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Skin Tone</Label>
              <Select onValueChange={(v) => setValue("skinTone", v)}>
                <SelectTrigger><SelectValue placeholder="Select skin tone" /></SelectTrigger>
                <SelectContent>
                  {["Fair", "Medium", "Dusky", "Dark"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Skin Undertone</Label>
              <Select onValueChange={(v) => setValue("skinUndertone", v)}>
                <SelectTrigger><SelectValue placeholder="Select undertone" /></SelectTrigger>
                <SelectContent>
                  {["Warm", "Cool", "Neutral"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Face Shape</Label>
              <Select onValueChange={(v) => setValue("faceShape", v)}>
                <SelectTrigger><SelectValue placeholder="Select face shape" /></SelectTrigger>
                <SelectContent>
                  {["Oval", "Round", "Square", "Heart", "Diamond"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Makeup Style Preference</Label>
              <Input {...register("makeupStylePreference")} placeholder="e.g. Natural glam" />
            </div>
            <div className="space-y-1">
              <Label>Hairstyle Preference</Label>
              <Input {...register("hairstylePreference")} placeholder="e.g. Open curls" />
            </div>
            <div className="space-y-1">
              <Label>Additional Notes</Label>
              <Textarea {...register("notes")} placeholder="Any special requests…" rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex gap-3">
        <Button type="submit" className="bg-primary hover:bg-rose-700" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Add Client"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
