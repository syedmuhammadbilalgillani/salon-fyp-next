/**
 * MOCK AI SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * This file simulates an external AI model that generates bridal look images.
 * When you receive the real model API, do the following:
 *
 *   1. Replace the body of `callExternalAIModel()` in lib/external-ai.ts
 *      with a real fetch() call to your model endpoint.
 *   2. Set EXTERNAL_AI_API_URL in your .env.local.
 *   3. The generate route (app/api/ai/generate/route.ts) will automatically
 *      use the real model once EXTERNAL_AI_API_URL is set.
 *   4. Remove this file.
 *
 * The mock returns 5 images from a curated pool, chosen based on the
 * color theme preference so results feel contextually relevant.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface MockAIRequest {
  clientImageUrl: string;
  eventType: string;
  preferences: {
    makeupStyle: string;
    hairstyle: string;
    colorTheme: string;
    dupattaStyle?: string;
    additionalNotes?: string;
  };
  clientDetails: {
    skinTone?: string | null;
    skinUndertone?: string | null;
    faceShape?: string | null;
  };
}

export interface MockAIResponse {
  success: boolean;
  generatedImageUrls: string[];
  error?: string;
}

// ─── Curated bridal look image pools ───────────────────────────────────────
// Using high-quality portrait images from Unsplash (free to use).
// Each "theme" maps to a set of images that visually fit that color palette.
// When you swap in your real model these are simply replaced with model output.

const LOOK_POOLS: Record<string, string[]> = {
  "Red & Gold": [
    "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1583939411023-14783179e581?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1532635241-17e820acc59f?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=480&q=80&fit=crop&crop=face",
  ],
  "Pastel Pink": [
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524638431109-93d95c968f03?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480&q=80&fit=crop&crop=face",
  ],
  "Emerald & Gold": [
    "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1521302200778-33500795e128?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1511285605577-4d62fb50d2f7?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1503236823255-94609f598e71?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1549834125-82d3c9657b6e?w=480&q=80&fit=crop&crop=face",
  ],
  "Royal Blue & Silver": [
    "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1485178575877-1a13bf489dfe?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1546961342-ea5f60b193b5?w=480&q=80&fit=crop&crop=face",
  ],
  "Ivory & Champagne": [
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1496440737103-cd596325d314?w=480&q=80&fit=crop&crop=face",
  ],
  "Coral & Peach": [
    "https://images.unsplash.com/photo-1500840216050-6ffa99d75160?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1514315384763-ba401779410f?w=480&q=80&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=480&q=80&fit=crop&crop=face",
  ],
};

// Fallback pool used when colorTheme doesn't match a specific pool
const DEFAULT_POOL: string[] = [
  "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=480&q=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=480&q=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=480&q=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=480&q=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=480&q=80&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?w=480&q=80&fit=crop&crop=face",
];

/** Pick `count` unique random items from an array. */
function pickRandom<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/** Simulated processing delay (1.5 – 3 seconds) */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main mock function ─────────────────────────────────────────────────────

export async function callMockAI(req: MockAIRequest): Promise<MockAIResponse> {
  // Simulate model processing time
  await delay(1500 + Math.random() * 1500);

  const pool = LOOK_POOLS[req.preferences.colorTheme] ?? DEFAULT_POOL;
  const selected = pickRandom(pool, 5);

  // TODO: Replace this entire function with a real API call when model is ready.
  // The caller in app/api/ai/generate/route.ts checks EXTERNAL_AI_API_URL first.
  // If set, it uses lib/external-ai.ts. If not, it falls through to this mock.

  return { success: true, generatedImageUrls: selected };
}
