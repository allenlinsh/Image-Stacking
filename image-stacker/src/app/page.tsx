"use client";
import { RoundedButton } from "@/components/RoundedButton";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
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

  const handleSelectImage = async () => {
    try {
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
          title="Select Image"
        />

        {error && <p className="text-red-500">{error}</p>}

        {selectedImage && (
          <div className="mt-4 p-4 border rounded-lg">
            <h2 className="text-xl mb-2">Selected Image Info:</h2>
            <p>Path: {selectedImage.path}</p>
            <p>
              Dimensions: {selectedImage.width} x {selectedImage.height}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
