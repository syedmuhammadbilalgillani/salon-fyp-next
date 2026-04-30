"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle, X, AlertCircle } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";

interface Props {
  onUploadComplete: (imageUrl: string) => void;
}

export function GalleryUpload({ onUploadComplete }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("clientPhotoUploader", {
    onUploadProgress: (p) => setProgress(p),
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setUploaded(true);
        setIsUploading(false);
        onUploadComplete(res[0].ufsUrl ?? res[0].url);
      }
    },
    onUploadError: (err) => {
      setError(err.message);
      setIsUploading(false);
    },
  });

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    setUploaded(false);
    setIsUploading(true);
    setProgress(0);
    startUpload([f]);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setIsUploading(false);
    setUploaded(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (preview) {
    return (
      <div className="space-y-3">
        <div className="relative w-40 h-40 mx-auto rounded-xl overflow-hidden border-2 border-gray-200">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={reset}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {isUploading && (
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-rose-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {uploaded && (
          <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" /> Photo uploaded successfully
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
            <button onClick={reset} className="underline">Retry</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith("image/")) handleFile(f);
      }}
    >
      <UploadCloud className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="font-medium text-gray-700">Click to select photo</p>
      <p className="text-sm text-gray-400 mt-1">or drag and drop</p>
      <p className="text-xs text-gray-300 mt-2">JPG, PNG up to 8MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
