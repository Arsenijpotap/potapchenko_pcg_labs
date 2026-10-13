// Морфологические операции на яркостном изображении.
import { grayAt } from "./pixel-utils.js";

function structuringOffsets(size, shape) {
  const radius = Math.floor(size / 2);
  const offsets = [];

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (shape === "cross" && dx !== 0 && dy !== 0) continue;
      if (shape === "diamond" && Math.abs(dx) + Math.abs(dy) > radius) continue;
      offsets.push([dx, dy]);
    }
  }
  return offsets;
}

export function morphPrimitive(source, kind, size, shape, edgeMode) {
  const width = source.width;
  const height = source.height;
  const src = source.data;
  const output = new ImageData(width, height);
  const dst = output.data;
  const offsets = structuringOffsets(size, shape);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = kind === "min" ? 255 : 0;
      for (const [dx, dy] of offsets) {
        const sample = grayAt(src, width, height, x + dx, y + dy, edgeMode);
        value = kind === "min" ? Math.min(value, sample) : Math.max(value, sample);
      }
      const p = (y * width + x) * 4;
      dst[p] = dst[p + 1] = dst[p + 2] = value;
      dst[p + 3] = src[p + 3];
    }
  }
  return output;
}

function subtractImages(a, b) {
  const output = new ImageData(a.width, a.height);
  for (let i = 0; i < a.data.length; i += 4) {
    const value = Math.max(0, a.data[i] - b.data[i]);
    output.data[i] = output.data[i + 1] = output.data[i + 2] = value;
    output.data[i + 3] = a.data[i + 3];
  }
  return output;
}

export function morphology(source, method, size, shape, edgeMode) {
  const erode = image => morphPrimitive(image, "min", size, shape, edgeMode);
  const dilate = image => morphPrimitive(image, "max", size, shape, edgeMode);

  switch (method) {
    case "erosion": return erode(source);
    case "dilation": return dilate(source);
    case "opening": return dilate(erode(source));
    case "closing": return erode(dilate(source));
    case "gradient": return subtractImages(dilate(source), erode(source));
    case "tophat": return subtractImages(source, morphology(source, "opening", size, shape, edgeMode));
    case "blackhat": return subtractImages(morphology(source, "closing", size, shape, edgeMode), source);
    default: return source;
  }
}
