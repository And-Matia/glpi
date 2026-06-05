import { inject } from '@angular/core';
import { PsLang } from '../models/ps/ps-shared.model';
import { XmlSerializer } from '../utils/xml-serializer';
export abstract class BaseSerializer<T, W, L = { id: number; href: string }> {
  protected readonly s = inject(XmlSerializer);

  protected abstract readonly singularKey: string;
  protected abstract readonly pluralKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract mapToModel(raw: any): T;
  protected abstract mapToXml(data: W): object;

  // ── public API ────────────────────────────────────────────────────────────

  parseList(xml: string): L[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root = this.s.fromXml(xml) as any;
    let items = root?.prestashop?.[this.pluralKey]?.[this.singularKey];
    if (!items) return [];
    if (!Array.isArray(items)) items = [items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return items.map((i: any) => ({
      id:   this.toInt(i['@_id']),
      href: i['@_xlink:href'] ?? '',
    } as unknown as L));
  }

  parseFullList(xml: string): T[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root = this.s.fromXml(xml) as any;
    let items = root?.prestashop?.[this.pluralKey]?.[this.singularKey];
    if (!items) return [];
    if (!Array.isArray(items)) items = [items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return items.map((i: any) => this.mapToModel(i));
  }

  parseOne(xml: string): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root = this.s.fromXml(xml) as any;
    const raw = root?.prestashop?.[this.singularKey];
    if (!raw) {
      const psErrors = extractPsErrors(root);
      if (psErrors.length) throw new Error(psErrors.join(' | '));
      throw new Error(
        `${this.constructor.name}.parseOne: missing <${this.singularKey}> in PS response — snippet: ${xml.slice(0, 400)}`,
      );
    }
    return this.mapToModel(raw);
  }

  serializeForWrite(data: W): string {
    return this.s.toXml({ prestashop: { [this.singularKey]: this.mapToXml(data) } });
  }

  serializeForUpdate(id: number, data: W): string {
    return this.s.toXml({ prestashop: { [this.singularKey]: { id, ...this.mapToXml(data) } } });
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  protected toInt(v: unknown): number {
    return parseInt(this.extractScalar(v), 10) || 0;
  }

  protected toNullableInt(v: unknown): number | null {
    const n = parseInt(this.extractScalar(v), 10);
    return isNaN(n) || n === 0 ? null : n;
  }

  // PS8 returns linked fields as { "#text": "6", "@_xlink:href": "..." } — unwrap to plain value
  private extractScalar(v: unknown): string {
    if (v !== null && typeof v === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return String((v as any)['#text'] ?? '');
    }
    return String(v ?? '');
  }

  protected toBool(v: unknown): boolean {
    return v === true || v === 1 || v === '1';
  }

  protected fromBool(v: boolean): 0 | 1 {
    return v ? 1 : 0;
  }

  protected fromNullableInt(v: number | null): number {
    return v ?? 0;
  }

  protected normalizeLang(field: unknown): PsLang[] {
    if (!field) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (field as any).language;
    if (!raw) return [];
    const nodes = Array.isArray(raw) ? raw : [raw];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return nodes.filter(Boolean).map((n: any) => ({
      id:    this.toInt(n['@_id']),
      value: String(n['#text'] ?? ''),
    }));
  }

  protected fromLang(langs: PsLang[]): object {
    return { language: langs.map((l) => ({ '@_id': l.id, '#text': l.value })) };
  }

  protected normalizeAssoc<A>(wrapper: unknown, key: string): A[] {
    if (!wrapper) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (wrapper as any)[key];
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }
}

// ── PS error extractor (used by parseOne) ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPsErrors(root: any): string[] {
  const errors = root?.prestashop?.errors?.error;
  if (!errors) return [];
  const arr = Array.isArray(errors) ? errors : [errors];
  return arr
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => {
      const msg = e?.message;
      if (!msg) return '';
      // fast-xml-parser wraps CDATA in { '#text': '...' }
      return typeof msg === 'string' ? msg : String(msg?.['#text'] ?? msg ?? '');
    })
    .filter(Boolean);
}
