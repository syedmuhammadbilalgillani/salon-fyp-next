"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LookCard } from "./LookCard";
import type { AIGeneratedLook } from "@/types";

interface Props {
  looks: AIGeneratedLook[];
  isLoading: boolean;
  onSelect: (lookId: string, status: "shortlisted" | "selected" | "rejected" | "generated") => void;
  finalSelectedLookId: string | null;
  onRetry?: () => void;
}

export function GeneratedLooksGrid({ looks, isLoading, onSelect, finalSelectedLookId, onRetry }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="p-2 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isLoading && looks.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-gray-400">No looks were generated. Please try again.</p>
        {onRetry && <Button variant="outline" onClick={onRetry}>Retry</Button>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {looks.map((look) => (
        <LookCard
          key={look.id}
          look={look}
          isFinal={look.id === finalSelectedLookId}
          onShortlist={() => onSelect(look.id, "shortlisted")}
          onReject={() => onSelect(look.id, "rejected")}
          onSelectAsFinal={() => onSelect(look.id, "selected")}
          onRestore={() => onSelect(look.id, "generated")}
        />
      ))}
    </div>
  );
}
