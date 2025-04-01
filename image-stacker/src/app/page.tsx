"use client";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState, MouseEvent } from "react";
import { ImagePreview } from "@/components/ImagePreview";
import { Eraser } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );
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
        setSelectedImages((prev) => [...prev, ...newImages]);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSelected = () => {
    setSelectedImages((prev) =>
      prev.filter((_, index) => !selectedIndices.has(index))
    );
    setSelectedIndices(new Set());
  };

  const toggleImageSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Image Management */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 pb-2 border-b border-border space-y-2">
          <h2 className="text-lg font-semibold pb-2">Image Stacker</h2>
          <div className="flex flex-col gap-2">
            {selectedIndices.size > 0 ? (
              <Button
                variant="destructive"
                onClick={handleRemoveSelected}
                className="flex-1"
              >
                Remove {selectedIndices.size} image
                {selectedIndices.size > 1 ? "s" : ""}
              </Button>
            ) : (
              <Button
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  void handleSelectImages();
                }}
                loading={isLoading}
                className="flex-1"
              >
                Add Image(s)
              </Button>
            )}
          </div>
          {selectedIndices.size > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                {selectedIndices.size} image
                {selectedIndices.size > 1 ? "s" : ""} selected
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedIndices(new Set());
                      }}
                      className="h-6 w-6"
                    >
                      <Eraser className="size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear Selection</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Image List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {error && <p className="text-red-500 p-2">{error}</p>}
          {selectedImages.map((image, index) => (
            <div
              key={image.path}
              className={cn(
                "relative group rounded-lg border transition-colors cursor-pointer",
                selectedIndices.has(index)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent/5"
              )}
              onClick={() => {
                toggleImageSelection(index);
              }}
            >
              <div className="p-2">
                <ImagePreview image={image} index={index} variant="thumbnail" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" disabled={selectedImages.length === 0}>
              Align Images
            </Button>
            <Button variant="outline" disabled={selectedImages.length === 0}>
              Stack Images
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" disabled={selectedImages.length === 0}>
              Export
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-8 flex items-center justify-center bg-accent/5">
          {selectedImages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <h3 className="text-xl font-semibold mb-2">No Images Selected</h3>
              <p>Add images using the sidebar to begin stacking</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Preview of the first image or stacked result will go here */}
              <ImagePreview
                image={selectedImages[0]}
                index={0}
                variant="full"
              />
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="h-8 border-t border-border px-4 flex items-center text-sm text-muted-foreground">
          {selectedImages.length} images loaded
        </div>
      </div>
    </div>
  );
}
