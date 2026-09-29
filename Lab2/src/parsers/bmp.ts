import { ImageInfo } from "../core/types";
import { ParseError } from "./utils";
export async function parseBMP(file: File): Promise<Partial<ImageInfo>> {
	const b = new DataView(await file.slice(0, 64).arrayBuffer());
	if (b.byteLength < 54 || b.getUint8(0) !== 0x42 || b.getUint8(1) !== 0x4d) throw new ParseError("BMP: неверная сигнатура");
	const w = b.getInt32(18, true),
		h = Math.abs(b.getInt32(22, true)),
		bd = b.getUint16(28, true),
		xppm = b.getInt32(38, true),
		yppm = b.getInt32(42, true);
	return {
		format: "BMP",
		width: Math.abs(w),
		height: h,
		colorDepth: bd,
		dpiX: xppm > 0 ? xppm * 0.0254 : undefined,
		dpiY: yppm > 0 ? yppm * 0.0254 : undefined,
		compression: ["BI_RGB", "BI_RLE8", "BI_RLE4", "BI_BITFIELDS", "BI_JPEG", "BI_PNG"][b.getUint32(30, true)] ?? `BI_${b.getUint32(30, true)}`,
	};
}
