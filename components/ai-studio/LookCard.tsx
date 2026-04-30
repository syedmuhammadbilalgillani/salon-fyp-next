"use client";

import { useState } from "react";
import { Heart, X, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { AIGeneratedLook } from "@/types";

interface Props {
  look: AIGeneratedLook;
  isFinal: boolean;
  onShortlist: () => void;
  onReject: () => void;
  onSelectAsFinal: () => void;
  onRestore: () => void;
}

const statusBadge: Record<string, { label: string; className: string }> = {
  shortlisted: { label: "♥ Shortlisted", className: "bg-yellow-400 text-yellow-900" },
  selected: { label: "✓ Final", className: "bg-green-500 text-white" },
  rejected: { label: "Rejected", className: "bg-gray-400 text-white" },
};

export function LookCard({ look, isFinal, onShortlist, onReject, onSelectAsFinal, onRestore }: Props) {
  const [lightbox, setLightbox] = useState(false);
  const badge = statusBadge[look.status];

  return (
    <>
      <div className={`rounded-xl overflow-hidden border bg-white ${isFinal ? "ring-2 ring-green-500" : ""}`}>
        <div className="aspect-[3/4] relative cursor-pointer" onClick={() => setLightbox(true)}>
          <img src={look.imageUrl} alt={look.title ?? "Look"} className="w-full h-full object-cover" />
          {/* gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
          {look.title && (
            <p className="absolute bottom-2 left-2 text-white text-xs font-medium">{look.title}</p>
          )}
          {badge && (
            <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
              {badge.label}
            </span>
          )}
          {isFinal && (
            <div className="absolute top-2 left-0 bg-green-500 text-white text-xs px-2 py-0.5 font-bold tracking-wide">
              FINAL
            </div>
          )}
        </div>

        <div className="p-2 space-y-1.5">
          {look.status === "generated" && (
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="flex-1 text-yellow-700 border-yellow-300 hover:bg-yellow-50 text-xs" onClick={onShortlist}>
                <Heart className="w-3 h-3 mr-1" /> Shortlist
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-gray-500 text-xs" onClick={onReject}>
                <X className="w-3 h-3 mr-1" /> Skip
              </Button>
            </div>
          )}
          {look.status === "shortlisted" && (
            <div className="space-y-1">
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-xs" onClick={onSelectAsFinal}>
                <CheckCircle className="w-3 h-3 mr-1" /> Select as Final
              </Button>
              <Button size="sm" variant="ghost" className="w-full text-xs text-gray-400" onClick={onReject}>Remove</Button>
            </div>
          )}
          {look.status === "rejected" && (
            <Button size="sm" variant="ghost" className="w-full text-xs" onClick={onRestore}>
              <RotateCcw className="w-3 h-3 mr-1" /> Restore
            </Button>
          )}
          {look.status === "selected" && (
            <div className="space-y-1">
              <Button size="sm" className="w-full bg-green-500 text-xs" disabled>
                ✓ Final Look Selected
              </Button>
              <Button size="sm" variant="ghost" className="w-full text-xs text-gray-400" onClick={onShortlist}>Change Selection</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-xl p-2">
          <img src={look.imageUrl} alt={look.title ?? "Look"} className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </>
  );
}
