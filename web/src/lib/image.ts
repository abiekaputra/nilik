/** Module responsible for normalizing uploaded images into grayscale matrices. */

import type { DemoSample } from "./types";

const targetSize = 64;

export async function fileToSample(file: File): Promise<DemoSample> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable in this browser");
  context.drawImage(bitmap, 0, 0, targetSize, targetSize);
  const { data } = context.getImageData(0, 0, targetSize, targetSize);
  const pixels = Array.from({ length: targetSize }, (_, y) =>
    Array.from({ length: targetSize }, (_, x) => {
      const index = (y * targetSize + x) * 4;
      return Number(
        (
          (data[index] * 0.299 +
            data[index + 1] * 0.587 +
            data[index + 2] * 0.114) /
          255
        ).toFixed(4),
      );
    }),
  );
  bitmap.close();
  return {
    name: file.name.slice(0, 80),
    label: "Uploaded image",
    expected: "ANOMALY",
    pixels,
  };
}
