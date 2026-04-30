"use client";

import { GeneratedLooksGrid } from "@/components/ai-studio/GeneratedLooksGrid";
import { ImageSourceSelector } from "@/components/ai-studio/ImageSourceSelector";
import { PreferencesForm } from "@/components/ai-studio/PreferencesForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aiPreferencesSchema } from "@/lib/validations";
import type { AIGeneratedLook } from "@/types";
import { CheckCircle, ChevronLeft, Loader2, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";

type Step = 1 | 2 | 3;

const eventColors: Record<string, string> = {
  mehndi: "bg-amber-100 text-amber-800",
  barat: "bg-red-100 text-red-800",
  valima: "bg-green-100 text-green-800",
  engagement: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

const GENERATION_MESSAGES = [
  "Analysing client features…",
  "Matching makeup style to skin tone…",
  "Composing colour palette…",
  "Generating look variations…",
  "Finalising results…",
];

export default function AIStudioPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [client, setClient] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>(1);
  const [clientImageUrl, setClientImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState(GENERATION_MESSAGES[0]);
  const [generatedLooks, setGeneratedLooks] = useState<AIGeneratedLook[]>([]);
  const [finalLookId, setFinalLookId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((d) => {
        setBooking(d.booking);
        setClient(d.client);
        if (d.looks?.length > 0) {
          setGeneratedLooks(d.looks);
          setStep(3);
        }
        if (d.finalLook) setFinalLookId(d.finalLook.id);
        setLoading(false);
      });
  }, [bookingId]);

  // Cycle through status messages while generating
  useEffect(() => {
    if (!isGenerating) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % GENERATION_MESSAGES.length;
      setGeneratingMsg(GENERATION_MESSAGES[i]);
    }, 700);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleImageReady = (url: string) => {
    setClientImageUrl(url);
    setStep(2);
  };

  const handleGenerate = async (preferences: z.input<typeof aiPreferencesSchema>) => {
    if (!clientImageUrl) { toast.error("No image uploaded"); return; }
    setIsGenerating(true);
    setError(null);
    setGeneratingMsg(GENERATION_MESSAGES[0]);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, clientImageUrl, preferences }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        toast.error(data.error ?? "AI generation failed");
      } else {
        setGeneratedLooks(data.looks);
        setStep(3);
        toast.success(`${data.looks.length} looks generated!`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLookSelect = async (
    lookId: string,
    status: "shortlisted" | "selected" | "rejected" | "generated"
  ) => {
    const res = await fetch(`/api/ai/looks/${lookId}/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, status }),
    });
    if (!res.ok) { toast.error("Failed to update look status"); return; }

    setGeneratedLooks((prev) =>
      prev.map((l) => {
        if (l.id === lookId) return { ...l, status };
        if (status === "selected" && l.status === "selected") return { ...l, status: "generated" };
        return l;
      })
    );

    if (status === "selected") {
      setFinalLookId(lookId);
      toast.success("✓ Final look saved to booking!");
    }
  };

  const resetToStep1 = () => {
    setStep(1);
    setClientImageUrl(null);
    setGeneratedLooks([]);
    setFinalLookId(null);
    setError(null);
  };

  // ── Step indicator ─────────────────────────────────────────────────────────
  const steps = [
    { n: 1 as Step, label: "Client Photo" },
    { n: 2 as Step, label: "Preferences" },
    { n: 3 as Step, label: "Select Look" },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/bookings/${bookingId}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Booking
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Look Studio
          </h1>
          {client && (
            <span className="text-gray-500 text-sm">— {client.fullName as string}</span>
          )}
          {booking && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${eventColors[booking.eventType as string] ?? ""}`}>
              {booking.eventType as string}
            </span>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step > s.n
                  ? "bg-green-500 text-white"
                  : step === s.n
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {step > s.n ? "✓" : s.n}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step === s.n ? "text-rose-700" : "text-gray-400"}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="h-px w-6 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Final look banner */}
      {finalLookId && step === 3 && (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium text-sm">Final look saved to this booking</span>
          </div>
          <Link href={`/bookings/${bookingId}`}>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Return to Booking
            </Button>
          </Link>
        </div>
      )}

      {/* ── STEP 1: Photo ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
              Add Client Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageSourceSelector
              clientName={(client?.fullName as string) ?? "Client"}
              onImageReady={handleImageReady}
            />
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Preferences + Generating ── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Confirmed photo strip */}
          {clientImageUrl && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <img
                src={clientImageUrl}
                alt="Client"
                className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Photo ready</p>
                <p className="text-xs text-gray-400">{client?.fullName as string}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-gray-400 hover:text-gray-600"
                onClick={resetToStep1}
              >
                Change
              </Button>
            </div>
          )}

          {/* Generating overlay */}
          {isGenerating ? (
            <Card className="border-purple-100 bg-purple-50">
              <CardContent className="py-12 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                  <Sparkles className="w-5 h-5 text-purple-600 absolute inset-0 m-auto" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold text-purple-800">Generating AI Looks…</p>
                  <p className="text-sm text-purple-500 animate-pulse">{generatingMsg}</p>
                </div>
                <p className="text-xs text-purple-400">This usually takes 2–5 seconds</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                  Style Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PreferencesForm
                  eventType={(booking?.eventType as string) ?? "other"}
                  onSubmit={handleGenerate}
                  isLoading={isGenerating}
                />
                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error} —{" "}
                    <button className="underline" onClick={() => setError(null)}>
                      Try again
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── STEP 3: Select Look ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                Select a Look
              </h2>
              <p className="text-sm text-gray-500 mt-0.5 ml-8">
                Shortlist favourites with the client, then mark one as final
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToStep1}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              New Session
            </Button>
          </div>

          <GeneratedLooksGrid
            looks={generatedLooks}
            isLoading={false}
            onSelect={handleLookSelect}
            finalSelectedLookId={finalLookId}
            onRetry={resetToStep1}
          />
        </div>
      )}
    </div>
  );
}
