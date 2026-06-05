import { BaseSerializer } from './base.serializer';

export type FieldType =
  | 'int'            // toInt(v) — required integer
  | 'nullableInt'    // toNullableInt(v) — always-present number | null
  | 'optionalInt'    // v !== undefined ? toInt(v) : undefined
  | 'bool'           // toBool(v) — required boolean
  | 'optionalBool'   // v !== undefined ? toBool(v) : undefined
  | 'lang'           // normalizeLang(v) — required PsLang[]
  | 'string'         // v ?? '' — required string with empty fallback
  | 'stringZero'     // v ?? '0' — required numeric-string with zero fallback
  | 'optionalString' // v as string | undefined — raw pass-through
  | 'falsyUndef';    // v || undefined — zero/empty treated as absent (tax-rule only)

export interface FieldDef {
  key: string;
  type: FieldType;
  readOnly?: boolean;
}

export abstract class FieldMapSerializer<T, W, L = { id: number; href: string }>
  extends BaseSerializer<T, W, L> {

  protected abstract readonly fields: FieldDef[];

  protected mapToModel(raw: Record<string, unknown>): T {
    const result: Record<string, unknown> = {};
    for (const f of this.fields) {
      result[f.key] = this.readField(f, raw[f.key]);
    }
    return result as T;
  }

  protected mapToXml(data: W): object {
    const r: Record<string, unknown> = {};
    const d = data as Record<string, unknown>;

    for (const f of this.fields) {
      if (f.readOnly) continue;

      const v = d[f.key];
      if (v === undefined) continue;

      r[f.key] = this.writeField(f, v);
    }

    return r;
  }

  private readField(f: FieldDef, v: unknown): unknown {
    switch (f.type) {
      case 'int':
        return this.toInt(v);
      case 'nullableInt':
        return this.toNullableInt(v);
      case 'optionalInt':
        return v !== undefined ? this.toInt(v) : undefined;
      case 'bool':
        return this.toBool(v);
      case 'optionalBool':
        return v !== undefined ? this.toBool(v) : undefined;
      case 'lang':
        return this.normalizeLang(v);
      case 'string':
        return (v ?? '') as string;
      case 'stringZero':
        return (v ?? '0') as string;
      case 'optionalString':
        return v as string | undefined;
      case 'falsyUndef':
        return (v as any) || undefined;
    }
  }

  private writeField(f: FieldDef, v: unknown): unknown {
    switch (f.type) {
      case 'bool':
      case 'optionalBool':
        return this.fromBool(v as boolean);
      case 'nullableInt':
        return this.fromNullableInt(v as number | null);
      case 'lang':
        return this.fromLang(v as any[]);
      default:
        return v;
    }
  }
}
