"use client";
import { Button } from "@/components/ui/button";
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
        <Button
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            void handleSelectImage();
          }}
          loading={isLoading}
          className="min-w-32"
        >
          Select Image
        </Button>

        {error && <p className="text-red-500">{error}</p>}

        {selectedImage && (
          <div className="mt-4 p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-6">
              <div className="relative w-80 h-auto rounded-lg overflow-hidden shrink-0">
                <img
                  src={convertFileSrc(selectedImage.path)}
                  alt="Selected image preview"
                  className="w-full h-full object-contain object-top"
                />
              </div>
              <div className="flex flex-col gap-4 min-w-0">
                <div className="space-y-2 text-gray-600 w-full">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Path:</span>
                    <span className="text-sm break-all pl-2">
                      {selectedImage.path}
                    </span>
                  </div>
                  <p>
                    <span className="font-medium">Dimensions:</span>{" "}
                    {selectedImage.width} x {selectedImage.height}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
