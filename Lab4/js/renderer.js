import { drawOrder, rasterHeight, rasterWidth, virtualGrid, xMin, yMax } from './algorithms.js';

export function renderRaster(canvas, { zoom, showGrid, showSteps }) {
  const context = canvas.getContext('2d');
  const ratio = devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  canvas.width = Math.floor(bounds.width * ratio);
  canvas.height = Math.floor(bounds.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const width = bounds.width;
  const height = bounds.height;
  const cell = Math.max(4, Math.min(width / (rasterWidth + 3), height / (rasterHeight + 3)) * zoom);
  const left = (width - rasterWidth * cell) / 2;
  const top = (height - rasterHeight * cell) / 2;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#fbfaf6';
  context.fillRect(0, 0, width, height);
  if (showGrid) {
    context.lineWidth = 1;
    for (let col = 0; col <= rasterWidth; col++) {
      const x = left + col * cell;
      context.strokeStyle = col - 1 === 40 ? '#52675b' : '#e8e8e0';
      context.beginPath();
      context.moveTo(x, top);
      context.lineTo(x, top + rasterHeight * cell);
      context.stroke();
    }
    for (let row = 0; row <= rasterHeight; row++) {
      const y = top + row * cell;
      context.strokeStyle = row - 1 === 30 ? '#52675b' : '#e8e8e0';
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(left + rasterWidth * cell, y);
      context.stroke();
    }
    context.fillStyle = '#788079';
    context.font = '10px DM Mono,monospace';
    context.textAlign = 'center';
    for (let x = -40; x <= 40; x += 10) context.fillText(String(x), left + (x - xMin + 0.5) * cell, top + rasterHeight * cell + 13);
    context.textAlign = 'right';
    for (let y = -30; y <= 30; y += 10) {
      if (y) context.fillText(String(y), left - 5, top + (yMax - y + 0.68) * cell);
    }
  }
  for (let index = 0; index < virtualGrid.length; index++) {
    const intensity = virtualGrid[index];
    if (intensity <= 0) continue;
    const col = index % rasterWidth;
    const row = (index / rasterWidth) | 0;
    context.fillStyle = `rgba(26,107,84,${0.2 + 0.8 * intensity})`;
    context.fillRect(left + col * cell + 0.7, top + row * cell + 0.7, Math.max(1, cell - 1.4), Math.max(1, cell - 1.4));
  }
  if (showSteps && drawOrder.length < 180) {
    drawOrder.forEach(([x, y], index) => {
      context.fillStyle = '#dc774d';
      context.font = '9px DM Mono,monospace';
      context.textAlign = 'center';
      context.fillText(String(index), left + (x - xMin + 0.5) * cell, top + (yMax - y + 0.6) * cell);
    });
  }
  return `${zoom.toFixed(zoom === 1 ? 0 : 1)}×`;
}
