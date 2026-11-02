let benchmarkData = null;
let seed = 29012026;
let sink = new Float32Array(1024 * 1024);

function random() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}

function randomLine(maxLength) {
  const x0 = (random() * 601 | 0) - 300;
  const y0 = (random() * 601 | 0) - 300;
  const octant = random() * 8 | 0;
  const length = 8 + (random() * maxLength | 0);
  const sign = [1, -1][random() * 2 | 0];
  let dx;
  let dy;
  switch (octant) {
    case 0: dx = length; dy = random() * length | 0; break;
    case 1: dx = random() * length | 0; dy = length; break;
    case 2: dx = -(random() * length | 0); dy = length; break;
    case 3: dx = -length; dy = random() * length | 0; break;
    case 4: dx = -length; dy = -(random() * length | 0); break;
    case 5: dx = -(random() * length | 0); dy = -length; break;
    case 6: dx = random() * length | 0; dy = -length; break;
    default: dx = length; dy = -(random() * length | 0);
  }
  return [x0, y0, x0 + dx * sign, y0 + dy];
}

function target(x, y, intensity = 1) {
  const col = x + 512;
  const row = y + 512;
  if (col < 0 || row < 0 || col >= 1024 || row >= 1024) return;
  const index = row * 1024 + col;
  if (intensity > sink[index]) sink[index] = intensity;
}

function dda(x0, y0, x1, y1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  if (!steps) {
    target(x0, y0);
    return;
  }
  const xStep = (x1 - x0) / steps;
  const yStep = (y1 - y0) / steps;
  let x = x0;
  let y = y0;
  for (let i = 0; i <= steps; i++) {
    target(Math.round(x), Math.round(y));
    x += xStep;
    y += yStep;
  }
}

function bres(x0, y0, x1, y1) {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x);
  const dy = Math.abs(y1 - y);
  const sx = x < x1 ? 1 : -1;
  const sy = y < y1 ? 1 : -1;
  let error = dx - dy;
  for (;;) {
    target(x, y);
    if (x === x1 && y === y1) break;
    const doubledError = error * 2;
    if (doubledError > -dy) {
      error -= dy;
      x += sx;
    }
    if (doubledError < dx) {
      error += dx;
      y += sy;
    }
  }
}

function circle(cx, cy, radius) {
  let x = 0;
  let y = radius;
  let decision = 3 - 2 * radius;
  while (y >= x) {
    target(cx + x, cy + y);
    target(cx + y, cy + x);
    target(cx - x, cy + y);
    target(cx - y, cy + x);
    target(cx + x, cy - y);
    target(cx + y, cy - x);
    target(cx - x, cy - y);
    target(cx - y, cy - x);
    if (decision < 0) decision += 4 * x + 6;
    else {
      decision += 4 * (x - y) + 10;
      y--;
    }
    x++;
  }
}

function drawChart(canvas, series, labels) {
  const context = canvas.getContext('2d');
  const ratio = devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  canvas.width = bounds.width * ratio;
  canvas.height = bounds.height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const width = bounds.width;
  const height = bounds.height;
  const padding = { left: 48, right: 14, top: 14, bottom: 32 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  context.clearRect(0, 0, width, height);
  context.font = '10px DM Mono,monospace';
  const max = Math.max(1, ...series.flatMap(item => item.data)) * 1.12;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + plotHeight * i / 4;
    context.strokeStyle = '#e6e6df';
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.fillStyle = '#788079';
    context.textAlign = 'right';
    context.fillText((max * (1 - i / 4)).toFixed(max > 100 ? 0 : 1), padding.left - 7, y + 3);
  }
  labels.forEach((label, index) => {
    const x = padding.left + plotWidth * index / Math.max(1, labels.length - 1);
    context.fillStyle = '#788079';
    context.textAlign = 'center';
    context.fillText(label, x, height - 9);
  });
  series.forEach(item => {
    context.beginPath();
    item.data.forEach((value, index) => {
      const x = padding.left + plotWidth * index / Math.max(1, item.data.length - 1);
      const y = padding.top + plotHeight * (1 - value / max);
      if (!index) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.strokeStyle = item.color;
    context.lineWidth = 2;
    context.stroke();
    item.data.forEach((value, index) => {
      const x = padding.left + plotWidth * index / Math.max(1, item.data.length - 1);
      const y = padding.top + plotHeight * (1 - value / max);
      context.fillStyle = item.color;
      context.beginPath();
      context.arc(x, y, 2.5, 0, Math.PI * 2);
      context.fill();
    });
  });
  let legendX = padding.left;
  context.textAlign = 'left';
  series.forEach(item => {
    context.fillStyle = item.color;
    context.fillRect(legendX, padding.top, 8, 8);
    context.fillStyle = '#566057';
    context.fillText(item.name, legendX + 12, padding.top + 8);
    legendX += context.measureText(item.name).width + 30;
  });
}

export function drawCharts() {
  if (!benchmarkData) return;
  const byId = id => document.getElementById(id);
  drawChart(byId('lineChart'), [
    { name: 'ЦДА', color: '#dc774d', data: benchmarkData.dda },
    { name: 'Брезенхем', color: '#1a6b54', data: benchmarkData.bres }
  ], benchmarkData.labels);
  drawChart(byId('lengthChart'), [
    { name: 'ЦДА', color: '#dc774d', data: benchmarkData.lengthDDA },
    { name: 'Брезенхем', color: '#1a6b54', data: benchmarkData.lengthBres }
  ], ['20', '60', '100', '160', '220']);
}

async function runBenchmark() {
  const byId = id => document.getElementById(id);
  const button = byId('benchBtn');
  const progress = byId('progress');
  const progressBar = byId('progressBar');
  const status = byId('benchStatus');
  button.disabled = true;
  button.textContent = 'Выполняется…';
  progress.style.display = 'block';
  progressBar.style.width = '0%';
  status.textContent = 'Подготовка одинаковых наборов данных для двух методов…';
  seed = 29012026;
  const totals = [1000, 5000, 20000, 50000, 100000];
  const lines = Array.from({ length: 100000 }, () => randomLine(240));
  const labels = [];
  const ddaTimes = [];
  const bresTimes = [];
  for (let i = 0; i < 3000; i++) dda(...lines[i]);
  sink = new Float32Array(1024 * 1024);
  for (let i = 0; i < 3000; i++) bres(...lines[i]);
  sink = new Float32Array(1024 * 1024);
  let previous = 0;
  let ddaTotal = 0;
  let bresTotal = 0;
  let start;
  for (const end of totals) {
    start = performance.now();
    for (let i = previous; i < end; i++) dda(...lines[i]);
    ddaTotal += performance.now() - start;
    ddaTimes.push(+ddaTotal.toFixed(2));
    labels.push(`${end / 1000}k`);
    previous = end;
    progressBar.style.width = `${end / 2500}%`;
    status.textContent = `ЦДА: ${end.toLocaleString('ru-RU')} / 100 000`;
    await new Promise(requestAnimationFrame);
  }
  sink = new Float32Array(1024 * 1024);
  previous = 0;
  for (const end of totals) {
    start = performance.now();
    for (let i = previous; i < end; i++) bres(...lines[i]);
    bresTotal += performance.now() - start;
    bresTimes.push(+bresTotal.toFixed(2));
    previous = end;
    progressBar.style.width = `${40 + end / 2500}%`;
    status.textContent = `Брезенхем: ${end.toLocaleString('ru-RU')} / 100 000`;
    await new Promise(requestAnimationFrame);
  }
  const circles = Array.from({ length: 50000 }, () => [random() * 500 | 0, random() * 500 | 0, 2 + (random() * 150 | 0)]);
  sink = new Float32Array(1024 * 1024);
  for (let i = 0; i < 1000; i++) circle(...circles[i]);
  sink = new Float32Array(1024 * 1024);
  let circleTime = 0;
  for (let i = 0; i < circles.length; i += 2500) {
    start = performance.now();
    for (const [x, y, radius] of circles.slice(i, i + 2500)) circle(x, y, radius);
    circleTime += performance.now() - start;
    progressBar.style.width = `${80 + i / circles.length * 20}%`;
    status.textContent = `Окружности: ${(i + 2500).toLocaleString('ru-RU')} / 50 000`;
    await new Promise(requestAnimationFrame);
  }
  const count = 6000;
  const lengths = [20, 60, 100, 160, 220];
  const lengthDDA = [];
  const lengthBres = [];
  for (const length of lengths) {
    const testLines = Array.from({ length: count }, (_, index) => {
      const x = index % 97 - 48;
      const y = Math.floor(index / 97) % 97 - 48;
      return [x, y, x + length, y + (index * 37 % length)];
    });
    const ddaRuns = [];
    const bresRuns = [];
    for (let repeat = 0; repeat < 3; repeat++) {
      sink = new Float32Array(1024 * 1024);
      const ddaStart = performance.now();
      for (const line of testLines) dda(...line);
      ddaRuns.push(performance.now() - ddaStart);
      sink = new Float32Array(1024 * 1024);
      const bresStart = performance.now();
      for (const line of testLines) bres(...line);
      bresRuns.push(performance.now() - bresStart);
    }
    ddaRuns.sort((a, b) => a - b);
    bresRuns.sort((a, b) => a - b);
    lengthDDA.push(+ddaRuns[1].toFixed(2));
    lengthBres.push(+bresRuns[1].toFixed(2));
  }
  benchmarkData = { labels, dda: ddaTimes, bres: bresTimes, lengthDDA, lengthBres };
  drawCharts();
  byId('benchTable').innerHTML = `<tr><td>ЦДА · линии</td><td>100 000</td><td>${ddaTotal.toFixed(2)}</td><td>${(ddaTotal / 100).toFixed(3)}</td></tr><tr><td>Брезенхем · линии</td><td>100 000</td><td>${bresTotal.toFixed(2)}</td><td>${(bresTotal / 100).toFixed(3)}</td></tr><tr><td>Брезенхем · окружности</td><td>50 000</td><td>${circleTime.toFixed(2)}</td><td>${(circleTime / 50).toFixed(3)}</td></tr>`;
  status.textContent = 'Готово · 150 000 примитивов · растр 1024 × 1024';
  button.disabled = false;
  button.textContent = 'Запустить ещё раз';
  progressBar.style.width = '100%';
}

export function initializeBenchmark() {
  document.getElementById('benchBtn').addEventListener('click', runBenchmark);
}
