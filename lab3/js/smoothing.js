// Низкочастотные фильтры: средний, Гаусса и медианный.
import { clamp, edgeCoord, grayAt } from "./pixel-utils.js";

function makeKernel(method, size) {
  if (method === "mean") return Array(size).fill(1 / size);

  const radius = Math.floor(size / 2);
  const sigma = Math.max(0.8, size / 6);
  const kernel = [];
  let sum = 0;

  for (let i = -radius; i <= radius; i++) {
    const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(weight);
    sum += weight;
  }
  return kernel.map(weight => weight / sum);
}

export function separableFilter(source, method, size, edgeMode) {
  const width = source.width;
  const height = source.height;
  const src = source.data;
  const temp = new Float32Array(width * height);
  const output = new ImageData(width, height);
  const dst = output.data;
  const kernel = makeKernel(method, size);
  const radius = Math.floor(size / 2);

  // Проход 1: одномерная фильтрация по строкам.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let dx = -radius; dx <= radius; dx++) {
        sum += grayAt(src, width, height, x + dx, y, edgeMode) * kernel[dx + radius];
      }
      temp[y * width + x] = sum;
    }
  }

  // Проход 2: одномерная фильтрация по столбцам.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = edgeCoord(y + dy, height, edgeMode);
        sum += temp[yy * width + x] * kernel[dy + radius];
      }
      const p = (y * width + x) * 4;
      const value = clamp(Math.round(sum), 0, 255);
      dst[p] = dst[p + 1] = dst[p + 2] = value;
      dst[p + 3] = src[p + 3];
    }
  }
  return output;
}

export function medianFilter(source, size, edgeMode) {
  const width = source.width;
  const height = source.height;
  const src = source.data;
  const output = new ImageData(width, height);
  const dst = output.data;
  const radius = Math.floor(size / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const values = [];
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          values.push(grayAt(src, width, height, x + dx, y + dy, edgeMode));
        }
      }
      values.sort((a, b) => a - b);
      const value = values[Math.floor(values.length / 2)];
      const p = (y * width + x) * 4;
      dst[p] = dst[p + 1] = dst[p + 2] = value;
      dst[p + 3] = src[p + 3];
    }
  }
  return output;
}
