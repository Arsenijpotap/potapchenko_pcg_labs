import { bres, circle, clearRaster, dda, lineStep, pitConic, pitEllipse, virtualGrid, wu } from './algorithms.js';
import { drawCharts, initializeBenchmark } from './benchmark.js';
import { renderRaster } from './renderer.js';

const byId = id => document.getElementById(id);
const canvas = byId('plot');

function render() {
  const zoom = Number(byId('zoom').value);
  const scale = renderRaster(canvas, {
    zoom,
    showGrid: byId('showGrid').checked,
    showSteps: byId('showSteps').checked
  });
  byId('viewScale').textContent = `МАСШТАБ ${scale}`;
}

function getNumber(id) {
  return Math.max(-500, Math.min(500, Math.round(Number(byId(id).value) || 0)));
}

function draw() {
  clearRaster();
  const primitive = byId('primitive').value;
  const algorithm = byId('algorithm').value;
  const start = performance.now();
  if (primitive === 'line') {
    const x0 = getNumber('x0');
    const y0 = getNumber('y0');
    const x1 = getNumber('x1');
    const y1 = getNumber('y1');
    ({ step: lineStep, dda, bres, wu, pit: bres }[algorithm])(x0, y0, x1, y1);
    byId('coordsMetric').textContent = `(${x0},${y0}) → (${x1},${y1})`;
  } else if (primitive === 'arc') {
    const x0 = getNumber('asx');
    const y0 = getNumber('asy');
    const x1 = getNumber('aex');
    const y1 = getNumber('aey');
    pitConic(x0, y0, x1, y1, getNumber('coefA'), getNumber('coefB'), getNumber('coefC'), getNumber('coefD'), getNumber('coefE'), getNumber('coefF'));
    byId('coordsMetric').textContent = `(${x0},${y0}) → (${x1},${y1})`;
  } else {
    const cx = getNumber('cx');
    const cy = getNumber('cy');
    const rx = Math.max(1, getNumber('rx'));
    const ry = Math.max(1, getNumber('ry'));
    if (primitive === 'circle') circle(cx, cy, rx);
    else pitEllipse(cx, cy, rx, ry);
    byId('coordsMetric').textContent = primitive === 'circle' ? `r = ${rx}` : `${rx} × ${ry}`;
  }
  const elapsed = performance.now() - start;
  render();
  byId('pixelCount').textContent = virtualGrid.reduce((count, value) => count + (value > 0), 0);
  byId('drawTime').textContent = `${elapsed.toFixed(3)} ms`;
}

function updateInputs() {
  const primitive = byId('primitive').value;
  const isLine = primitive === 'line';
  const isArc = primitive === 'arc';
  byId('lineInputs').style.display = isLine ? 'block' : 'none';
  byId('shapeInputs').style.display = !isLine && !isArc ? 'block' : 'none';
  byId('arcInputs').style.display = isArc ? 'block' : 'none';
  if (primitive === 'ellipse' || isArc) byId('algorithm').value = 'pit';
  else if (primitive === 'circle') byId('algorithm').value = 'bres';
  if (isLine && byId('algorithm').value === 'pit') byId('algorithm').value = 'bres';
  byId('algorithm').disabled = !isLine;
  byId('algorithm').querySelector('option[value="pit"]').disabled = isLine;
}

document.querySelectorAll('.tab').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab, .view').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    byId(button.dataset.view).classList.add('active');
    if (button.dataset.view === 'studio') render();
    if (button.dataset.view === 'benchmark') drawCharts();
  });
});

byId('drawBtn').addEventListener('click', draw);
byId('clearBtn').addEventListener('click', () => {
  clearRaster();
  render();
  byId('pixelCount').textContent = '0';
  byId('drawTime').textContent = '—';
  byId('coordsMetric').textContent = '—';
});
byId('primitive').addEventListener('change', updateInputs);
byId('algorithm').addEventListener('change', updateInputs);
byId('zoom').addEventListener('change', render);
byId('showGrid').addEventListener('change', render);
byId('showSteps').addEventListener('change', render);
window.addEventListener('resize', render);
initializeBenchmark();
updateInputs();
draw();
