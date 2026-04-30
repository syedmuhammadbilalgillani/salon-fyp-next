export interface AIGenerateRequest {
  clientImageUrl: string;
  eventType: string;
  preferences: {
    makeupStyle: string;
    hairstyle: string;
    colorTheme: string;
    dupattaStyle: string;
    additionalNotes?: string;
  };
  clientDetails: {
    skinTone?: string | null;
    skinUndertone?: string | null;
    faceShape?: string | null;
  };
}

export interface AIGenerateResponse {
  success: boolean;
  generatedImageUrls: string[];
  error?: string;
}

export async function callExternalAIModel(
  payload: AIGenerateRequest
): Promise<AIGenerateResponse> {
  const url = process.env.EXTERNAL_AI_API_URL;
  if (!url) {
    return { success: false, generatedImageUrls: [], error: "AI API URL not configured" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXTERNAL_AI_API_KEY ?? ""}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, generatedImageUrls: [], error: `AI model request failed: ${response.status}` };
    }

    const data = await response.json();
    const urls: string[] =
      data.images ??
      data.results?.map((r: { url: string }) => r.url) ??
      data.output ??
      [];

    return { success: true, generatedImageUrls: urls };
  } catch (err) {
    return { success: false, generatedImageUrls: [], error: String(err) };
  }
}
