"use client";

import { useState } from "react";
import { Camera, ImagePlus, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "./CameraCapture";
import { GalleryUpload } from "./GalleryUpload";

interface Props {
  clientName: string;
  onImageReady: (imageUrl: string) => void;
}

type Mode = null | "camera" | "gallery";

export function ImageSourceSelector({ clientName, onImageReady }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleImageReady = (url: string) => {
    setUploadedUrl(url);
    setCameraOpen(false);
    onImageReady(url);
  };

  const reset = () => {
    setMode(null);
    setUploadedUrl(null);
  };

  // ── Confirmed state ───────────────────────────────────────────────────────
  if (uploadedUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-green-300">
            <img src={uploadedUrl} alt="Client" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-800">Photo ready</p>
            </div>
            <p className="text-xs text-green-600 mt-0.5 truncate">{clientName}</p>
          </div>
          <Button size="sm" variant="outline" className="flex-shrink-0 text-xs" onClick={reset}>
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Change
          </Button>
        </div>
      </div>
    );
  }

  // ── Gallery mode ──────────────────────────────────────────────────────────
  if (mode === "gallery") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Upload from Gallery</p>
          <Button size="sm" variant="ghost" className="text-xs text-gray-400" onClick={() => setMode(null)}>
            ← Back
          </Button>
        </div>
        <GalleryUpload onUploadComplete={handleImageReady} />
      </div>
    );
  }

  // ── Source picker ─────────────────────────────────────────────────────────
  return (
    <>
      {cameraOpen && (
        <CameraCapture
          onCapture={handleImageReady}
          onClose={() => { setCameraOpen(false); setMode(null); }}
        />
      )}

      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Add a photo of <span className="font-semibold">{clientName}</span> so the AI can generate personalised looks.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Camera option */}
          <button
            onClick={() => { setMode("camera"); setCameraOpen(true); }}
            className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed
                       border-gray-200 hover:border-rose-400 hover:bg-rose-50 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
              <Camera className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-rose-700 transition-colors">
                Use Camera
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Capture photo in real time</p>
            </div>
          </button>

          {/* Gallery option */}
          <button
            onClick={() => setMode("gallery")}
            className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed
                       border-gray-200 hover:border-rose-400 hover:bg-rose-50 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
              <ImagePlus className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-rose-700 transition-colors">
                Upload from Gallery
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Select from device storage</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
