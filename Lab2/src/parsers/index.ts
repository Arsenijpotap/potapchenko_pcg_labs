import { ImageInfo } from "../core/types";
import { parseJPEG } from "./jpeg";
import { parseGIF } from "./gif";
import { parsePNG } from "./png";
import { parseBMP } from "./bmp";
import { parsePCX } from "./pcx";
import { parseTIFF } from "./tiff";
import { ParseError } from "./utils";
export async function parseImage(file: File): Promise<Partial<ImageInfo>> {
	const h = new Uint8Array(await file.slice(0, 16).arrayBuffer());
	if (h.length < 2) throw new ParseError("Файл пустой или слишком короткий");
	if (h[0] === 0xff && h[1] === 0xd8) return parseJPEG(file);
	if (h.length >= 6 && String.fromCharCode(...h.slice(0, 6)).startsWith("GIF")) return parseGIF(file);
	if (h.length >= 8 && h[0] === 137 && h[1] === 80 && h[2] === 78 && h[3] === 71) return parsePNG(file);
	if (h[0] === 0x42 && h[1] === 0x4d) return parseBMP(file);
	if (h[0] === 0x0a) return parsePCX(file);
	if ((h[0] === 0x49 && h[1] === 0x49) || (h[0] === 0x4d && h[1] === 0x4d)) return parseTIFF(file);
	throw new ParseError("Неизвестный формат или повреждённая сигнатура");
}
