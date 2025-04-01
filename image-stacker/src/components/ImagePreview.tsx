import { convertFileSrc } from "@tauri-apps/api/core";

interface ImageInfo {
  path: string;
  width: number;
  height: number;
}

interface ImagePreviewProps {
  image: ImageInfo;
  index: number;
}

export function ImagePreview({ image, index }: ImagePreviewProps) {
  return (
    <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-6">
        <div className="relative w-80 h-auto rounded-lg overflow-hidden shrink-0">
          <img
            src={convertFileSrc(image.path)}
            alt={`Image preview ${String(index + 1)}`}
            className="w-full h-full object-contain object-top"
          />
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          <div className="space-y-2 text-gray-600 w-full">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Path:</span>
              <span className="text-sm break-all pl-2">{image.path}</span>
            </div>
            <p>
              <span className="font-medium">Dimensions:</span> {image.width} x{" "}
              {image.height}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
