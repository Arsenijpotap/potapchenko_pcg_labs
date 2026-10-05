import { ImageInfo } from '../core/types';
import { ParseError } from './utils';

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

export async function parseTIFF(file: File): Promise<Partial<ImageInfo>> {
  const header = new DataView(await file.slice(0, 32).arrayBuffer());
  if (header.byteLength < 8) throw new ParseError('TIFF: файл слишком короткий');
  const order = String.fromCharCode(header.getUint8(0), header.getUint8(1));
  if (order !== 'II' && order !== 'MM') throw new ParseError('TIFF: неверный byte order');
  const le = order === 'II';
  const magic = header.getUint16(2, le);
  const big = magic === 43;
  if (!big && magic !== 42) throw new ParseError('TIFF: неизвестный формат');

  let offset: number;
  if (big) {
    if (header.byteLength < 16 || header.getUint16(4, le) !== 8 || header.getUint16(6, le) !== 0) {
      throw new ParseError('TIFF: некорректный BigTIFF header');
    }
    offset = Number(header.getBigUint64(8, le));
  } else {
    offset = header.getUint32(4, le);
  }

  let width: number | undefined;
  let height: number | undefined;
  let depth: number | undefined;
  let dpiX: number | undefined;
  let dpiY: number | undefined;
  let unit: number | undefined;
  let compression: number | undefined;
  let ifds = 0;
  const seen = new Set<number>();

  while (offset > 0 && ifds < 64 && !seen.has(offset)) {
    seen.add(offset);
    const countSize = big ? 8 : 2;
    const entrySize = big ? 20 : 12;
    const nextSize = big ? 8 : 4;
    const countBuf = new DataView(await file.slice(offset, offset + countSize).arrayBuffer());
    if (countBuf.byteLength < countSize) throw new ParseError('TIFF: IFD выходит за пределы файла');
    const count = big ? Number(countBuf.getBigUint64(0, le)) : countBuf.getUint16(0, le);
    if (!Number.isSafeInteger(count) || count > 10000) throw new ParseError('TIFF: слишком большой IFD');

    const tableSize = countSize + count * entrySize + nextSize;
    const table = new DataView(await file.slice(offset, offset + tableSize).arrayBuffer());
    if (table.byteLength < tableSize) throw new ParseError('TIFF: неполный IFD');

    for (let i = 0; i < count; i++) {
      const o = countSize + i * entrySize;
      const tag = table.getUint16(o, le);
      const type = table.getUint16(o + 2, le);
      const itemSize = TYPE_SIZE[type];
      if (!itemSize) continue;
      const valueCount = big ? Number(table.getBigUint64(o + 4, le)) : table.getUint32(o + 4, le);
      if (!Number.isSafeInteger(valueCount) || valueCount <= 0 || valueCount > 100000) continue;
      const totalBytes = valueCount * itemSize;
      const inlineBytes = big ? 8 : 4;
      let raw: DataView | null = null;

      if (totalBytes <= inlineBytes) {
        raw = new DataView(table.buffer, table.byteOffset + o + (big ? 12 : 8), inlineBytes);
      } else {
        const valueOffset = big ? Number(table.getBigUint64(o + 12, le)) : table.getUint32(o + 8, le);
        if (!Number.isSafeInteger(valueOffset) || valueOffset >= file.size) continue;
        const readSize = Math.min(totalBytes, 65536);
        const data = await file.slice(valueOffset, valueOffset + readSize).arrayBuffer();
        if (data.byteLength < Math.min(totalBytes, readSize)) continue;
        raw = new DataView(data);
      }
      if (!raw) continue;

      const number = () => {
        if (type === 3 && raw!.byteLength >= 2) return raw!.getUint16(0, le);
        if (type === 4 && raw!.byteLength >= 4) return raw!.getUint32(0, le);
        if (type === 8 && raw!.byteLength >= 2) return raw!.getInt16(0, le);
        if (type === 9 && raw!.byteLength >= 4) return raw!.getInt32(0, le);
        return undefined;
      };
      const rational = () => {
        if ((type === 5 || type === 10) && raw!.byteLength >= 8) {
          const n = type === 5 ? raw!.getUint32(0, le) : raw!.getInt32(0, le);
          const d = type === 5 ? raw!.getUint32(4, le) : raw!.getInt32(4, le);
          return d ? n / d : undefined;
        }
        return undefined;
      };

      if (tag === 256) width = number();
      if (tag === 257) height = number();
      if (tag === 258) {
        if (type === 3) {
          let sum = 0;
          for (let j = 0; j < valueCount && j * 2 + 2 <= raw.byteLength; j++) sum += raw.getUint16(j * 2, le);
          if (sum) depth = sum;
        } else {
          depth = number();
        }
      }
      if (tag === 259) compression = number();
      if (tag === 282) dpiX = rational();
      if (tag === 283) dpiY = rational();
      if (tag === 296) unit = number();
    }

    const nextPos = countSize + count * entrySize;
    offset = big ? Number(table.getBigUint64(nextPos, le)) : table.getUint32(nextPos, le);
    ifds++;
  }

  if (!width || !height) throw new ParseError('TIFF: Width/Height не найдены');
  const resUnit = unit ?? 2;
  const factor = resUnit === 2 ? 1 : resUnit === 3 ? 2.54 : undefined;
  return {
    format: 'TIFF', width, height, colorDepth: depth,
    dpiX: factor && dpiX ? dpiX * factor : undefined,
    dpiY: factor && dpiY ? dpiY * factor : undefined,
    compression: compressionName(compression),
    details: `${big ? 'BigTIFF' : 'TIFF'}; IFD: ${ifds}`,
  };
}

function compressionName(n: number | undefined) {
  const names: Record<number, string> = { 1: 'None', 2: 'CCITT Group 3', 3: 'CCITT T.4', 4: 'CCITT T.6', 5: 'LZW', 6: 'JPEG', 7: 'JPEG', 8: 'Deflate', 32773: 'PackBits', 32946: 'Deflate' };
  return n === undefined ? '—' : names[n] ?? `TIFF ${n}`;
}
