// Общие функции доступа к пикселям и обработки границ.
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function toGray(image) {
  const output = new ImageData(image.width, image.height);
  const src = image.data;
  const dst = output.data;

  for (let i = 0; i < src.length; i += 4) {
    const gray = Math.round(0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]);
    dst[i] = dst[i + 1] = dst[i + 2] = gray;
    dst[i + 3] = src[i + 3];
  }
  return output;
}

export function edgeCoord(index, length, mode) {
  if (mode === "clamp") return clamp(index, 0, length - 1);
  if (length <= 1) return 0;

  // Зеркальное отражение без повторного выхода за диапазон.
  while (index < 0 || index >= length) {
    if (index < 0) index = -index - 1;
    if (index >= length) index = 2 * length - index - 1;
  }
  return index;
}

export function grayAt(data, width, height, x, y, edgeMode) {
  const xx = edgeCoord(x, width, edgeMode);
  const yy = edgeCoord(y, height, edgeMode);
  return data[(yy * width + xx) * 4];
}
