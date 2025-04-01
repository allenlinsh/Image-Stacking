"use client";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState, MouseEvent } from "react";
import { ImagePreview } from "@/components/ImagePreview";

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
  const [selectedImages, setSelectedImages] = useState<ImageInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectImages = async () => {
    try {
      setIsLoading(true);
      const options: OpenDialogOptions = {
        multiple: true,
        filters: [
          {
            name: "Images",
            extensions: ["jpg", "jpeg", "png", "tiff", "tif"],
          },
        ],
      };

      const selected = await (
        open as (
          options: OpenDialogOptions
        ) => Promise<string | string[] | null>
      )(options);

      if (selected && Array.isArray(selected)) {
        const newImages = await Promise.all(
          selected.map((path) => invoke<ImageInfo>("get_image_info", { path }))
        );
        setSelectedImages(newImages);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">Image Stacker</h1>

      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            void handleSelectImages();
          }}
          loading={isLoading}
          className="min-w-32"
        >
          Select Images
        </Button>

        {error && <p className="text-red-500">{error}</p>}

        <div className="w-full max-w-4xl space-y-4">
          {selectedImages.map((image, index) => (
            <ImagePreview key={image.path} image={image} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
