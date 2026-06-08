export interface DetectedType {
  ext: string;
  mime: string;
}

interface SignaturePart {
  offset: number;
  bytes: number[];
}

interface FileSignature extends DetectedType {
  parts: SignaturePart[];
}


const IMAGE_SIGNATURES: FileSignature[] = [
  { ext: 'jpg',  mime: 'image/jpeg', parts: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
  { ext: 'png',  mime: 'image/png',  parts: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }] },
  { ext: 'gif',  mime: 'image/gif',  parts: [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }] },               // "GIF8" (87a/89a)
  { ext: 'bmp',  mime: 'image/bmp',  parts: [{ offset: 0, bytes: [0x42, 0x4d] }] },                            // "BM"
  { ext: 'webp', mime: 'image/webp', parts: [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }] }, // RIFF…WEBP
  { ext: 'tif',  mime: 'image/tiff', parts: [{ offset: 0, bytes: [0x49, 0x49, 0x2a, 0x00] }] },                // little-endian
  { ext: 'tif',  mime: 'image/tiff', parts: [{ offset: 0, bytes: [0x4d, 0x4d, 0x00, 0x2a] }] },                // big-endian
  { ext: 'ico',  mime: 'image/x-icon', parts: [{ offset: 0, bytes: [0x00, 0x00, 0x01, 0x00] }] },
  { ext: 'heic', mime: 'image/heic', parts: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, { offset: 8, bytes: [0x68, 0x65, 0x69] }] },        // ftyp…hei(c/x)
  { ext: 'avif', mime: 'image/avif', parts: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, { offset: 8, bytes: [0x61, 0x76, 0x69, 0x66] }] },  // ftyp…avif
  { ext: 'psd',  mime: 'image/vnd.adobe.photoshop', parts: [{ offset: 0, bytes: [0x38, 0x42, 0x50, 0x53] }] }, // "8BPS"
];

const ZIP_PART: SignaturePart = { offset: 0, bytes: [0x50, 0x4b] };

function matchesPart(bytes: Uint8Array, part: SignaturePart): boolean {
  return part.bytes.every((b, i) => bytes[part.offset + i] === b);
}

function matchesSignature(bytes: Uint8Array, sig: FileSignature): boolean {
  return sig.parts.every(part => matchesPart(bytes, part));
}

export function detectImageType(bytes: Uint8Array): DetectedType | null {
  const hit = IMAGE_SIGNATURES.find(sig => matchesSignature(bytes, sig));
  return hit ? { ext: hit.ext, mime: hit.mime } : null;
}

/** Vrai si les octets commencent par la signature d'un ZIP ("PK"). */
export function isZip(bytes: Uint8Array): boolean {
  return matchesPart(bytes, ZIP_PART);
}

/**
 * SVG n'a pas de signature binaire : c'est du XML/texte. On regarde le début
 * (en sautant un éventuel BOM UTF-8) pour `<?xml` ou `<svg`.
 */
export function isSvg(bytes: Uint8Array): boolean {
  const head = new TextDecoder().decode(bytes.subarray(0, 256)).replace(/^﻿/, '').trimStart();
  return head.startsWith('<?xml') || head.startsWith('<svg');
}

/** Lit les `length` premiers octets d'un Blob/File sans charger tout le fichier. */
export async function readHeaderBytes(file: Blob, length = 16): Promise<Uint8Array> {
  const buffer = await file.slice(0, length).arrayBuffer();
  return new Uint8Array(buffer);
}
