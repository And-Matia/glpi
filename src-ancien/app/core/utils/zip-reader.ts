/**
 * Minimal in-browser ZIP reader — no external dependency.
 *
 * It walks the archive's central directory by hand and inflates DEFLATE
 * entries with the browser's native `DecompressionStream`. Stored (method 0)
 * and deflate (method 8) entries are supported — enough for a user-built
 * archive of product images. ZIP64 archives are not supported.
 */

export interface ZipEntry {
  /** Entry path inside the archive (may contain folders). */
  name: string;
  /** Decompressed file bytes. */
  bytes: Uint8Array<ArrayBuffer>;
}

const EOCD_SIGNATURE = 0x06054b50; // End Of Central Directory
const CENTRAL_SIGNATURE = 0x02014b50; // Central directory file header

/** Reads every file entry of a ZIP blob, decompressing as needed. */
export async function readZipEntries(file: Blob): Promise<ZipEntry[]> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const eocd = findEocd(view);
  if (eocd < 0) {
    throw new Error('Archive ZIP invalide (fin de répertoire central introuvable).');
  }

  const entryCount = view.getUint16(eocd + 10, true);
  let pointer = view.getUint32(eocd + 16, true);

  const entries: ZipEntry[] = [];
  for (let i = 0; i < entryCount; i++) {
    if (view.getUint32(pointer, true) !== CENTRAL_SIGNATURE) {
      throw new Error('Archive ZIP corrompue (entrée de répertoire central invalide).');
    }
    const method = view.getUint16(pointer + 10, true);
    const compressedSize = view.getUint32(pointer + 20, true);
    const nameLength = view.getUint16(pointer + 28, true);
    const extraLength = view.getUint16(pointer + 30, true);
    const commentLength = view.getUint16(pointer + 32, true);
    const localOffset = view.getUint32(pointer + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(pointer + 46, pointer + 46 + nameLength));
    pointer += 46 + nameLength + extraLength + commentLength;

    if (name.endsWith('/')) continue; // directory entry — no content

    // The local header repeats the name/extra fields with its own lengths,
    // which may differ from the central directory's — read them to locate data.
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.subarray(dataStart, dataStart + compressedSize);

    let content: Uint8Array<ArrayBuffer>;
    if (method === 0) {
      content = compressed;
    } else if (method === 8) {
      content = await inflateRaw(compressed);
    } else {
      throw new Error(`« ${name} » : méthode de compression ${method} non supportée.`);
    }
    entries.push({ name, bytes: content });
  }
  return entries;
}

/** Scans backwards from the end of the file for the EOCD record. */
function findEocd(view: DataView): number {
  const min = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let i = view.byteLength - 22; i >= min; i--) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) return i;
  }
  return -1;
}

/** Inflates a raw DEFLATE stream via the browser's DecompressionStream. */
async function inflateRaw(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
