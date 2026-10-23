/** Module responsible for rendering surfaces, heatmaps, and anomaly regions. */

import { useEffect, useRef } from "react";
import type { Region } from "../lib/types";

interface Props {
  pixels: number[][];
  heatmap?: number[][];
  regions?: Region[];
}

export function SurfaceCanvas({ pixels, heatmap, regions = [] }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !pixels.length) return;
    const size = pixels.length;
    canvas.width = size;
    canvas.height = size;
    const image = context.createImageData(size, size);
    pixels.forEach((row, y) =>
      row.forEach((value, x) => {
        const offset = (y * size + x) * 4;
        const gray = Math.round(value * 255);
        const anomaly = Math.min(
          1,
          Math.max(0, (heatmap?.[y]?.[x] ?? 0) - 0.7),
        );
        image.data[offset] = Math.round(gray * (1 - anomaly) + 255 * anomaly);
        image.data[offset + 1] = Math.round(
          gray * (1 - anomaly) + 90 * anomaly,
        );
        image.data[offset + 2] = Math.round(
          gray * (1 - anomaly) + 95 * anomaly,
        );
        image.data[offset + 3] = 255;
      }),
    );
    context.putImageData(image, 0, 0);
    context.strokeStyle = "#ffcc66";
    context.lineWidth = 1;
    regions.forEach((region) =>
      context.strokeRect(region.x, region.y, region.width, region.height),
    );
  }, [heatmap, pixels, regions]);

  return (
    <canvas
      aria-label="Inspected surface"
      className="surface-canvas"
      ref={ref}
    />
  );
}
