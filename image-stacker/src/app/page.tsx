"use client";
import { RoundedButton } from "@/components/RoundedButton";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useState, MouseEvent } from "react";

interface ImageInfo {
  path: string;
  width: number;
  height: number;
}

interface FileFilter {
  name: string;
  extensions: string[];
}

interface OpenDialogOptions {
  multiple?: boolean;
  filters?: FileFilter[];
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectImage = async () => {
    try {
      setIsLoading(true);
      const options: OpenDialogOptions = {
        multiple: false,
        filters: [
          {
            name: "Images",
            extensions: ["jpg", "jpeg", "png", "tiff"],
          },
        ],
      };

      const selected = await (
        open as (
          options: OpenDialogOptions
        ) => Promise<string | string[] | null>
      )(options);

      if (selected && typeof selected === "string") {
        const imageInfo = await invoke<ImageInfo>("get_image_info", {
          path: selected,
        });
        setSelectedImage(imageInfo);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load image");
      setSelectedImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">Image Stacker</h1>

      <div className="flex flex-col items-center gap-4">
        <RoundedButton
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            void handleSelectImage();
          }}
          title={isLoading ? "Loading..." : "Select Image"}
          disabled={isLoading}
        />

        {isLoading && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {selectedImage && (
          <div className="mt-4 p-4 border rounded-lg space-y-4">
            <h2 className="text-xl mb-2">Selected Image Info:</h2>
            <p>Path: {selectedImage.path}</p>
            <p>
              Dimensions: {selectedImage.width} x {selectedImage.height}
            </p>
            <div className="relative w-64 h-64 border rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={convertFileSrc(selectedImage.path)}
                alt="Selected image preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
