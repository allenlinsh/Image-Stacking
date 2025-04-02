"use client";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState, MouseEvent, useEffect } from "react";
import { ImagePreview } from "@/components/ImagePreview";
import { Eraser, Layers, AlignCenter, Download, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

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

// Helper function to get filename from path
function getFilenameFromPath(path: string): string {
  // Handle both forward and backslashes for cross-platform support
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1];
}

export default function Home() {
  const [selectedImages, setSelectedImages] = useState<ImageInfo[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Alignment parameters
  const [alignmentMethod, setAlignmentMethod] = useState("orb");
  const [referenceImage, setReferenceImage] = useState(0);
  const [allowRotation, setAllowRotation] = useState(true);
  const [featureSensitivity, setFeatureSensitivity] = useState([50]);
  const [showPreview, setShowPreview] = useState(false);

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
    setLastSelectedIndex(null);
  };

  const toggleImageSelection = (
    index: number,
    event: MouseEvent<HTMLDivElement>
  ) => {
    // If it's a right click, handle context menu behavior
    if (event.button === 2) {
      // If not already selected, clear selection and select only this one
      if (!selectedIndices.has(index)) {
        setSelectedIndices(new Set([index]));
        setLastSelectedIndex(index);
      }
      // If already selected, just keep the current selection
      return;
    }

    const isCtrlPressed = event.ctrlKey || event.metaKey; // metaKey is Command on Mac
    const isShiftPressed = event.shiftKey;

    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      
      // Handle regular click (no modifiers) - clear selection and select only current
      if (!isCtrlPressed && !isShiftPressed) {
        // If clicking on the only selected item, clear selection entirely
        if (newSet.has(index) && newSet.size === 1) {
          newSet.clear();
          setLastSelectedIndex(null);
          return newSet;
        }
        
        // Otherwise, clear and select only current
        newSet.clear();
        newSet.add(index);
      } 
      // Handle Ctrl/Cmd click - toggle the current item
      else if (isCtrlPressed) {
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
      } 
      // Handle Shift click - select range from last selected to current
      else if (isShiftPressed && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        
        for (let i = start; i <= end; i++) {
          newSet.add(i);
        }
      }
      
      return newSet;
    });
    
    // Update the last selected index (if we didn't clear selection above)
    if (selectedIndices.has(index) && selectedIndices.size === 1) {
      // Don't update lastSelectedIndex if we cleared selection
    } else {
      setLastSelectedIndex(index);
    }
  };

  // Dummy align images function
  const handleAlignImages = () => {
    console.log("Aligning images with params:", {
      method: alignmentMethod,
      referenceImage,
      allowRotation,
      featureSensitivity: featureSensitivity[0],
    });
    // Here you would call the Rust function to align images
    // For now, just toggle the preview
    setShowPreview(!showPreview);
  };

  // Dummy stack images function
  const handleStackImages = () => {
    console.log("Stacking images");
    // Here you would call the Rust function to stack images
  };

  // Prevent browser context menu
  useEffect(() => {
    const handleContextMenu = (e: Event) => {
      // Let our custom context menu handle it
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background select-none">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Image Management */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 pb-2 border-b border-border space-y-2">
            <h2 className="text-lg font-semibold pb-2">Image Stacker</h2>
            <div className="flex flex-col gap-2">
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
            </div>
          </div>

          {/* Image List */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex flex-col gap-2">
              {error && <p className="text-red-500 p-2">{error}</p>}
              {selectedImages.map((image, index) => (
                <ContextMenu key={image.path}>
                  <ContextMenuTrigger
                    onContextMenu={() => {
                      // When right-clicking, update selection immediately before showing menu
                      if (!selectedIndices.has(index)) {
                        setSelectedIndices(new Set([index]));
                        setLastSelectedIndex(index);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "relative group rounded-lg border transition-all cursor-pointer overflow-hidden",
                        selectedIndices.has(index)
                          ? "border-primary/20"
                          : "border-border hover:bg-accent/5"
                      )}
                      onClick={(e) => {
                        toggleImageSelection(index, e);
                      }}
                    >
                      <div className="p-2">
                        <ImagePreview
                          image={image}
                          index={index}
                          variant="thumbnail"
                        />
                      </div>
                      {selectedIndices.has(index) && (
                        <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive flex gap-2 items-center"
                      onClick={handleRemoveSelected}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove{" "}
                      {selectedIndices.size > 1
                        ? `${selectedIndices.size.toString()} selected images`
                        : "selected image"}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center bg-accent/5 overflow-hidden">
            {selectedImages.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <h3 className="text-xl font-semibold mb-2">
                  No Images Selected
                </h3>
                <p>Add images using the sidebar to begin stacking</p>
              </div>
            ) : (
              <div className="relative w-full h-full p-8">
                <ImagePreview
                  image={selectedImages[lastSelectedIndex ?? 0]}
                  index={lastSelectedIndex ?? 0}
                  variant="full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Workflow */}
        <div className="w-80 border-l border-border flex flex-col overflow-hidden">
          <div className="p-4 pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Workflow</h2>
            </div>
          </div>

          <Tabs defaultValue="align" className="flex-1 flex flex-col">
            <div className="border-b">
              <TabsList className="w-full rounded-none border-b-0 bg-transparent p-0 h-10">
                <TabsTrigger
                  value="align"
                  className="flex items-center gap-1 rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-background data-[state=active]:shadow-none h-10 px-4"
                >
                  <AlignCenter className="h-4 w-4" /> Align
                </TabsTrigger>
                <TabsTrigger
                  value="stack"
                  className="flex items-center gap-1 rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-background data-[state=active]:shadow-none h-10 px-4"
                >
                  <Layers className="h-4 w-4" /> Stack
                </TabsTrigger>
                <TabsTrigger
                  value="export"
                  className="flex items-center gap-1 rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-background data-[state=active]:shadow-none h-10 px-4"
                >
                  <Download className="h-4 w-4" /> Export
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <TabsContent
                value="align"
                className="p-4 space-y-4 m-0 border-0 data-[state=active]:mt-0"
              >
                <div className="space-y-2">
                  <Label htmlFor="alignment-method">
                    Feature Detection Method
                  </Label>
                  <Select
                    value={alignmentMethod}
                    onValueChange={setAlignmentMethod}
                  >
                    <SelectTrigger
                      id="alignment-method"
                      className="w-full truncate"
                    >
                      <SelectValue
                        placeholder="Select method"
                        className="truncate"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orb" className="truncate">
                        ORB (Oriented FAST and Rotated BRIEF)
                      </SelectItem>
                      <SelectItem value="flann" className="truncate">
                        FLANN (Fast Library for Approximate Nearest Neighbors)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference-image">Reference Image</Label>
                  <Select
                    value={referenceImage.toString()}
                    onValueChange={(v: string) => {
                      setReferenceImage(parseInt(v));
                    }}
                  >
                    <SelectTrigger
                      id="reference-image"
                      className="w-full truncate"
                    >
                      <SelectValue
                        placeholder="Select reference image"
                        className="truncate"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedImages.map((image, idx) => (
                        <SelectItem
                          key={idx}
                          value={idx.toString()}
                          className="truncate"
                        >
                          {getFilenameFromPath(image.path)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow-rotation">Allow Rotation</Label>
                    <Switch
                      id="allow-rotation"
                      checked={allowRotation}
                      onCheckedChange={setAllowRotation}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feature-sensitivity">
                    Feature Sensitivity: {featureSensitivity[0]}%
                  </Label>
                  <Slider
                    id="feature-sensitivity"
                    min={0}
                    max={100}
                    step={1}
                    value={featureSensitivity}
                    onValueChange={setFeatureSensitivity}
                  />
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    handleAlignImages();
                  }}
                  disabled={selectedImages.length < 2}
                >
                  Align Images
                </Button>

                {showPreview && (
                  <div className="p-2 border rounded mt-4">
                    <p className="text-sm text-center">Alignment Preview</p>
                    <div className="h-32 bg-muted rounded flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">
                        Preview would appear here
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="stack"
                className="p-4 space-y-4 m-0 border-0 data-[state=active]:mt-0"
              >
                <p className="text-sm text-muted-foreground">
                  Align images first before stacking.
                </p>

                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    handleStackImages();
                  }}
                  disabled={selectedImages.length < 2}
                >
                  Stack Images
                </Button>
              </TabsContent>

              <TabsContent
                value="export"
                className="p-4 space-y-4 m-0 border-0 data-[state=active]:mt-0"
              >
                <p className="text-sm text-muted-foreground">
                  Stack images before exporting the result.
                </p>

                <Button
                  className="w-full mt-4"
                  disabled={selectedImages.length < 2}
                >
                  Export Result
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 min-h-[32px] border-t border-border px-4 flex items-center justify-between text-sm text-muted-foreground bg-background z-10">
        <div className="flex items-center gap-4">
          <span>
            {selectedImages.length} image
            {selectedImages.length !== 1 ? "s" : ""} loaded
          </span>
          {selectedIndices.size > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-primary">
                {selectedIndices.size} selected
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedIndices(new Set());
                      }}
                      className="h-5 w-5 ml-1"
                    >
                      <Eraser className="size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Clear Selection</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
