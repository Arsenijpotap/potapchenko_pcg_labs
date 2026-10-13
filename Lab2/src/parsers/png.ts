import { ImageInfo } from "../core/types";
import { ParseError, finitePositive } from "./utils";
export async function parsePNG(file: File): Promise<Partial<ImageInfo>> {
	const b = new DataView(await file.slice(0, 65536).arrayBuffer());
	if (b.byteLength < 33) throw new ParseError("PNG: файл слишком короткий");
	const sig = [137, 80, 78, 71, 13, 10, 26, 10];
	for (let i = 0; i < 8; i++) if (b.getUint8(i) !== sig[i]) throw new ParseError("PNG: неверная сигнатура");
	const ihdrLength = b.getUint32(8),
		ihdrType = String.fromCharCode(b.getUint8(12), b.getUint8(13), b.getUint8(14), b.getUint8(15)),
		w = b.getUint32(16),
		h = b.getUint32(20),
		bd = b.getUint8(24),
		ct = b.getUint8(25),
		compressionMethod = b.getUint8(26),
		filterMethod = b.getUint8(27),
		interlace = b.getUint8(28);
	if (ihdrLength !== 13 || ihdrType !== "IHDR") throw new ParseError("PNG: некорректный IHDR");
	if (!w || !h || compressionMethod !== 0 || filterMethod !== 0 || interlace > 1) throw new ParseError("PNG: некорректный заголовок");
	const validBitDepths: Record<number, number[]> = { 0: [1,2,4,8,16], 2: [8,16], 3: [1,2,4,8], 4: [8,16], 6: [8,16] };
	if (!validBitDepths[ct]?.includes(bd)) throw new ParseError("PNG: недопустимая глубина цвета");
	let p = 8,
		dpiX: number | undefined,
		dpiY: number | undefined,
		details = `color type ${ct}`;
	while (p + 12 <= b.byteLength) {
		const len = b.getUint32(p);
		const type = String.fromCharCode(b.getUint8(p + 4), b.getUint8(p + 5), b.getUint8(p + 6), b.getUint8(p + 7));
		if (type === "pHYs" && len >= 9 && p + 8 + 9 <= b.byteLength) {
			const x = b.getUint32(p + 8),
				y = b.getUint32(p + 12),
				u = b.getUint8(p + 16);
			if (u === 1) {
				dpiX = finitePositive(x / 39.37007874015748);
				dpiY = finitePositive(y / 39.37007874015748);
			}
		}
		if (type === "IDAT") break;
		p += 12 + len;
		if (p > 65536) break;
	}
	return { format: "PNG", width: w, height: h, colorDepth: bd, dpiX, dpiY, compression: "Deflate (zlib внутри IDAT)", details };
}
