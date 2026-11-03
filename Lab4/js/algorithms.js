export const rasterWidth = 81;
export const rasterHeight = 61;
export const xMin = -40;
export const yMax = 30;
export const virtualGrid = new Float32Array(rasterWidth * rasterHeight);
export const drawOrder = [];

export function setPixel(x, y, intensity = 1) {
  x = Math.round(x);
  y = Math.round(y);
  const col = x - xMin;
  const row = yMax - y;
  if (col < 0 || col >= rasterWidth || row < 0 || row >= rasterHeight) return;
  const index = row * rasterWidth + col;
  if (intensity > virtualGrid[index]) virtualGrid[index] = Math.min(1, intensity);
  drawOrder.push([x, y, intensity]);
}

export function clearRaster() {
  virtualGrid.fill(0);
  drawOrder.length = 0;
}

export function lineStep(x0, y0, x1, y1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  if (!steps) {
    setPixel(x0, y0);
    return;
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    setPixel(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
  }
}

export function dda(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if (!steps) {
    setPixel(x0, y0);
    return;
  }
  let x = x0;
  let y = y0;
  const xStep = dx / steps;
  const yStep = dy / steps;
  for (let i = 0; i <= steps; i++) {
    setPixel(x, y);
    x += xStep;
    y += yStep;
  }
}

export function bres(x0, y0, x1, y1) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x);
  const dy = Math.abs(y1 - y);
  const sx = x < x1 ? 1 : -1;
  const sy = y < y1 ? 1 : -1;
  let error = dx - dy;
  for (;;) {
    setPixel(x, y);
    if (x === x1 && y === y1) break;
    const doubledError = 2 * error;
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

export function wu(x0, y0, x1, y1) {
  let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
  if (steep) {
    [x0, y0] = [y0, x0];
    [x1, y1] = [y1, x1];
  }
  if (x0 > x1) {
    [x0, x1] = [x1, x0];
    [y0, y1] = [y1, y0];
  }
  const dx = x1 - x0;
  const dy = y1 - y0;
  const gradient = dx === 0 ? 1 : dy / dx;
  let y = y0;
  for (let x = Math.ceil(x0); x <= Math.floor(x1); x++) {
    const fraction = y - Math.floor(y);
    const lower = Math.floor(y);
    if (steep) {
      setPixel(lower, x, 1 - fraction);
      setPixel(lower + 1, x, fraction);
    } else {
      setPixel(x, lower, 1 - fraction);
      setPixel(x, lower + 1, fraction);
    }
    y += gradient;
  }
}

export function circle(cx, cy, radius) {
  let x = 0;
  let y = radius;
  let decision = 3 - 2 * radius;
  while (y >= x) {
    for (const [dx, dy] of [[x, y], [y, x], [-x, y], [-y, x], [x, -y], [y, -x], [-x, -y], [-y, -x]]) {
      setPixel(cx + dx, cy + dy);
    }
    if (decision < 0) decision += 4 * x + 6;
    else {
      decision += 4 * (x - y) + 10;
      y--;
    }
    x++;
  }
}

function getOctant(gx, gy) {
  let octant = 0;
  if (gx < 0) {
    octant = 7;
    gx = -gx;
  }
  if (gy > 0) {
    octant ^= 3;
    gy = -gy;
  }
  if (gx > -gy) octant ^= 1;
  return octant + 1;
}

export function pitConic(xs, ys, xe, ye, A, B, C, D, E, F) {
  let x;
  let y;
  let swap;
  let octant = getOctant(D, E);
  let octantCount;
  let pixelCount;
  let dxSquare;
  let dySquare;
  let dxDiagonal;
  let dyDiagonal;
  let decision;
  let u;
  let v;
  let k1;
  let k2;
  let k3;
  if (xs !== xe || ys !== ye) {
    x = xe - xs;
    y = ye - ys;
    const gx = 2 * A * x + B * y + D;
    const gy = B * x + 2 * C * y + E;
    octantCount = getOctant(gx, gy) - octant;
    if (octantCount < 0) octantCount += 8;
  } else octantCount = 8;
  dxDiagonal = dyDiagonal = 1;
  dxSquare = dySquare = 0;
  if ((octant + 1) & 4) {
    D = -D;
    dxDiagonal = -1;
  }
  if ((octant - 1) & 4) {
    E = -E;
    dyDiagonal = -1;
  }
  if ((octant - 1) & 2) B = -B;
  if (octant & 2) {
    dySquare = dyDiagonal;
    swap = A;
    A = C;
    C = swap;
    swap = D;
    D = E;
    E = swap;
  } else dxSquare = dxDiagonal;
  A *= 4;
  B *= 4;
  C *= 4;
  D *= 4;
  E *= 4;
  F *= 4;
  decision = A + B / 2 + C / 4 + D + E / 2 + F;
  u = A + B / 2 + D;
  v = A + B / 2 + D + E;
  k1 = 2 * A;
  k2 = 2 * A + B;
  k3 = 2 * A + 2 * B + 2 * C;
  if (!(octant & 1)) {
    decision = -decision;
    k1 = -k1;
    u = -u;
    k2 = -k2;
    v = -v;
    k3 = -k3;
  }
  x = xs;
  y = ys;
  pixelCount = -1;
  for (let guard = 0; guard < 100000; guard++) {
    if (!octantCount) pixelCount = (octant & 2) ? 1 + Math.abs(ye - y) : 1 + Math.abs(xe - x);
    while ((u > 0 || (octant & 1)) && (v < 0 || !(octant & 1))) {
      setPixel(x, y);
      if (--pixelCount === 0) return;
      if (decision < 0) {
        x += dxSquare;
        y += dySquare;
        u += k1;
        v += k2;
        decision += u;
      } else {
        x += dxDiagonal;
        y += dyDiagonal;
        u += k2;
        v += k3;
        decision += v;
      }
    }
    if (--octantCount < 0) {
      bres(x, y, xe, ye);
      return;
    }
    if (++octant & 1) {
      decision = -decision - u + v - k1 + k2;
      v = -2 * u + v - k1 + k2;
      u = -u - k1 + k2;
      k3 = -4 * k1 + 4 * k2 - k3;
      k2 = -2 * k1 + k2;
      k1 = -k1;
      swap = dxDiagonal;
      dxDiagonal = -dyDiagonal;
      dyDiagonal = swap;
    } else {
      decision = -decision + u - v / 2 + k2 / 2 - 3 * k3 / 8;
      u = u - v + k2 / 2 - k3 / 2;
      v = -v + k2 - k3 / 2;
      k1 = -k1 + 2 * k2 - k3;
      k2 = k2 - k3;
      k3 = -k3;
      swap = dxSquare;
      dxSquare = -dySquare;
      dySquare = swap;
    }
  }
}

export function pitEllipse(cx, cy, rx, ry) {
  rx = Math.max(1, Math.round(rx));
  ry = Math.max(1, Math.round(ry));
  const xProduct = rx * ry;
  const A = ry * ry;
  const C = rx * rx;
  const D = 2 * ry * xProduct;
  pitConic(cx + rx, cy, cx + rx, cy, A, 0, C, D, 0, 0);
}
