import { convertFileSrc } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";

interface ImageInfo {
  path: string;
  width: number;
  height: number;
}

interface ImagePreviewProps {
  image: ImageInfo;
  index: number;
  variant?: "thumbnail" | "full";
  className?: string;
}

export function ImagePreview({ 
  image, 
  index,
  variant = "thumbnail",
  className 
}: ImagePreviewProps) {
  if (variant === "thumbnail") {
    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className="relative w-16 h-16 rounded overflow-hidden shrink-0 bg-accent/10">
          <img
            src={convertFileSrc(image.path)}
            alt={`Image ${String(index + 1)}`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 pt-1 space-y-1">
          <p className="text-sm font-medium truncate">
            {image.path.split("/").pop()}
          </p>
          <p className="text-xs text-muted-foreground">
            {image.width} × {image.height}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <img
        src={convertFileSrc(image.path)}
        alt={`Image ${String(index + 1)}`}
        className="w-full h-full object-contain"
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
        <p className="text-sm font-medium">
          {image.path.split("/").pop()}
        </p>
        <p className="text-xs text-muted-foreground">
          {image.width} × {image.height}
        </p>
      </div>
    </div>
  );
}
