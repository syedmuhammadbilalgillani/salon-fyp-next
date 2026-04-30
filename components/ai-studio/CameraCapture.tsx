"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, X, Check, FlipHorizontal, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";

interface Props {
  onCapture: (imageUrl: string) => void;
  onClose: () => void;
}

type FacingMode = "user" | "environment";
type Stage = "preview" | "captured" | "uploading" | "error";

function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

export function CameraCapture({ onCapture, onClose }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [stage, setStage] = useState<Stage>("preview");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { startUpload } = useUploadThing("clientPhotoUploader", {
    onUploadProgress: (p) => setUploadProgress(p),
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        onCapture(res[0].ufsUrl ?? res[0].url);
      }
    },
    onUploadError: (err) => {
      setCameraError(`Upload failed: ${err.message}`);
      setStage("error");
    },
  });

  const capture = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setCapturedImage(screenshot);
      setStage("captured");
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
    setStage("preview");
    setUploadProgress(0);
    setCameraError(null);
  };

  const usePhoto = async () => {
    if (!capturedImage) return;
    setStage("uploading");
    const file = dataURLtoFile(capturedImage, `client-photo-${Date.now()}.jpg`);
    await startUpload([file]);
  };

  const flipCamera = () =>
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Capture Client Photo</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera / Captured view */}
      <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-black border border-white/10 relative">
        {stage === "preview" && (
          <>
            {cameraError ? (
              <div className="aspect-video flex flex-col items-center justify-center text-white/60 gap-3 p-6">
                <AlertTriangle className="w-10 h-10 text-yellow-400" />
                <p className="text-sm text-center">{cameraError}</p>
                <p className="text-xs text-white/40 text-center">
                  Camera access was denied or no camera found. Please use "Upload from Gallery" instead.
                </p>
              </div>
            ) : (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.92}
                mirrored={facingMode === "user"}
                videoConstraints={{ facingMode, width: 640, height: 480 }}
                onUserMediaError={(err) => {
                  const msg = typeof err === "string" ? err : err?.message ?? "Camera error";
                  setCameraError(
                    msg.includes("Permission")
                      ? "Camera permission denied. Please allow camera access in your browser settings."
                      : "Could not access camera. Try the gallery upload option."
                  );
                }}
                className="w-full aspect-video object-cover"
              />
            )}
          </>
        )}

        {(stage === "captured" || stage === "uploading") && capturedImage && (
          <img
            src={capturedImage}
            alt="Captured photo"
            className="w-full aspect-video object-cover"
          />
        )}

        {/* Live indicator */}
        {stage === "preview" && !cameraError && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2.5 py-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-medium">LIVE</span>
          </div>
        )}

        {/* Upload progress overlay */}
        {stage === "uploading" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            <p className="text-white text-sm font-medium">Uploading… {uploadProgress}%</p>
            <div className="w-48 bg-white/20 rounded-full h-1.5">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg mt-6">
        {stage === "preview" && !cameraError && (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={flipCamera}
            >
              <FlipHorizontal className="w-4 h-4 mr-2" />
              Flip
            </Button>

            {/* Shutter button */}
            <button
              onClick={capture}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center
                         bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-white" />
            </button>

            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}

        {stage === "captured" && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-white/30 text-white bg-transparent hover:bg-white/10"
              onClick={retake}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-rose-700"
              onClick={usePhoto}
            >
              <Check className="w-4 h-4 mr-2" />
              Use This Photo
            </Button>
          </div>
        )}

        {stage === "error" && (
          <div className="space-y-3">
            <p className="text-red-400 text-sm text-center">{cameraError}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/30 text-white bg-transparent hover:bg-white/10"
                onClick={retake}
              >
                Try Again
              </Button>
              <Button variant="ghost" className="flex-1 text-white/70 hover:text-white" onClick={onClose}>
                Use Gallery Instead
              </Button>
            </div>
          </div>
        )}

        {stage === "preview" && cameraError && (
          <Button className="w-full" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4 mr-2" /> Close & Use Gallery
          </Button>
        )}
      </div>
    </div>
  );
}
