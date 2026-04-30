"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { aiPreferencesSchema } from "@/lib/validations";

interface Props {
  eventType: string;
  onSubmit: (data: z.input<typeof aiPreferencesSchema>) => void;
  isLoading: boolean;
}

const MAKEUP_STYLES = [
  "Traditional Bridal",
  "Contemporary Glam",
  "Smokey & Dramatic",
  "Natural Glow",
  "Dewy & Fresh",
  "Airbrush",
];
const HAIRSTYLES = [
  "Classic Bun",
  "Open Curls",
  "Side Swept",
  "Half Up Half Down",
  "Braided Updo",
  "Straight Blow Dry",
];
const COLOR_THEMES = [
  "Red & Gold",
  "Pastel Pink",
  "Emerald & Gold",
  "Royal Blue & Silver",
  "Ivory & Champagne",
  "Coral & Peach",
];
const DUPATTA_STYLES = [
  "Draped over head",
  "Pinned on one side",
  "Open (held)",
  "No dupatta",
];

const eventColors: Record<string, string> = {
  mehndi: "bg-amber-100 text-amber-800",
  barat: "bg-red-100 text-red-800",
  valima: "bg-green-100 text-green-800",
  engagement: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

export function PreferencesForm({ eventType, onSubmit, isLoading }: Props) {
  const [notes, setNotes] = useState("");
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof aiPreferencesSchema>>({
    resolver: zodResolver(aiPreferencesSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Event:</span>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${eventColors[eventType] ?? "bg-gray-100 text-gray-700"}`}
        >
          {eventType}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Makeup Style *</Label>
          <Select onValueChange={(v) => setValue("makeupStyle", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {MAKEUP_STYLES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.makeupStyle && (
            <p className="text-xs text-red-500">{errors.makeupStyle.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Hairstyle *</Label>
          <Select onValueChange={(v) => setValue("hairstyle", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select hairstyle" />
            </SelectTrigger>
            <SelectContent>
              {HAIRSTYLES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.hairstyle && (
            <p className="text-xs text-red-500">{errors.hairstyle.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Color Theme *</Label>
          <Select onValueChange={(v) => setValue("colorTheme", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              {COLOR_THEMES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.colorTheme && (
            <p className="text-xs text-red-500">{errors.colorTheme.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Dupatta Style</Label>
          <Select onValueChange={(v) => setValue("dupattaStyle", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select dupatta style" />
            </SelectTrigger>
            <SelectContent>
              {DUPATTA_STYLES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Additional Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => {
            const v = e.target.value.slice(0, 300);
            setNotes(v);
            setValue("additionalNotes", v);
          }}
          rows={3}
          placeholder="Any specific requests, references, or preferences…"
        />
        <p className="text-xs text-gray-400 text-right">{notes.length}/300</p>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-rose-700"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="animate-spin mr-2">⟳</span> Generating Looks…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" /> Generate Looks
          </>
        )}
      </Button>
    </form>
  );
}
