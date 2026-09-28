export type ImageFormat = 'JPEG' | 'GIF' | 'TIFF' | 'BMP' | 'PNG' | 'PCX' | 'UNKNOWN';
export type ParseStatus = 'ok' | 'error' | 'unsupported';
export interface ImageInfo {
  id: string; name: string; path: string; sizeBytes: number; format: ImageFormat; status: ParseStatus;
  width?: number; height?: number; dpiX?: number; dpiY?: number; colorDepth?: number;
  compression?: string; details?: string; error?: string;
}
export interface ParseInput { name: string; path: string; sizeBytes: number; file: File }
