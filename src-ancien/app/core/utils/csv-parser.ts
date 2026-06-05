import Papa from 'papaparse';
import { ProductCategoryRow, CombinationRow, OrderRow, OrderItem } from '../models/import.model';
export type { ProductCategoryRow, CombinationRow, OrderRow, OrderItem };

export interface CsvParseResult<T> {
  rows:   T[];
  errors: { row: number; error: string }[];
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function parseFloatFr(s: string): number {
  return parseFloat(s.replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
}

function parseDateDdMmYyyy(s: string): string {
  const parts = s.trim().split('/');
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
}

function parseDateDDMmYyyyHhMmSs(s: string): string {
  const parts = s.trim().split(/[\s/:]+/);
  return parts.length >= 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` + ' 00:00:00' : '';
}

function isValidDdMmYyyy(s: string): boolean {
  const m = s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return false;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

function missingCols(actual: string[], required: string[]): string[] {
  return required.filter(c => !actual.includes(c));
}

// ── Import 1 ─────────────────────────────────────────────────────────────────

const PRODUCT_CATEGORY_REQUIRED_COLUMNS = [
  'date_availability_produit', 'nom', 'reference', 'prix_ttc', 'Taxe', 'categorie', 'prix_achat',
];

function mapProductCategoryRecord(r: Record<string, string>): ProductCategoryRow {
  return {
    dateAvailability: parseDateDdMmYyyy(r['date_availability_produit'] ?? ''),
    nom:              (r['nom']       ?? '').trim(),
    reference:        (r['reference'] ?? '').trim(),
    prixTtc:          parseFloatFr(r['prix_ttc']   ?? '0'),
    taxePercent:      parseFloatFr(r['Taxe']       ?? '0'),
    categorie:        (r['categorie'] ?? '').trim(),
    prixAchat:        parseFloatFr(r['prix_achat'] ?? '0'),
  };
}

function validateProductCategoryRows(
  data: Record<string, string>[],
): CsvParseResult<ProductCategoryRow> {
  const rows: ProductCategoryRow[] = [];
  const errors: { row: number; error: string }[] = [];

  data.forEach((r, i) => {
    const rowNum = i + 2;
    const rowErrors: string[] = [];
    const row = mapProductCategoryRecord(r);

    const rawDate = (r['date_availability_produit'] ?? '').trim();
    if (rawDate && !isValidDdMmYyyy(rawDate)) {
      rowErrors.push(`date_availability_produit "${rawDate}" invalide — format attendu : DD/MM/YYYY`);
    }
    if (!row.nom) rowErrors.push('colonne "nom" vide');
    if (!row.reference) rowErrors.push('colonne "reference" vide');
    if (row.prixTtc <= 0) {
      rowErrors.push(`prix_ttc doit être un montant positif (reçu : "${r['prix_ttc'] ?? ''}")`);
    }
    if (row.prixAchat < 0) {
      rowErrors.push(`prix_achat ne peut pas être négatif (reçu : "${r['prix_achat'] ?? ''}")`);
    }

    if (rowErrors.length) {
      rowErrors.forEach(e => errors.push({ row: rowNum, error: e }));
    } else {
      rows.push(row);
    }
  });

  return { rows, errors };
}

export function parseProductCategoryCsv(file: File): Promise<CsvParseResult<ProductCategoryRow>> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      delimiter: ',',
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: results => {
        const missing = missingCols(results.meta.fields ?? [], PRODUCT_CATEGORY_REQUIRED_COLUMNS);
        if (missing.length) {
          reject(new Error(`Colonnes manquantes : ${missing.join(', ')}`));
          return;
        }
        resolve(validateProductCategoryRows(results.data));
      },
      error: err => reject(new Error(err.message)),
    });
  });
}

export function parseProductCategoryCsvFromString(content: string): CsvParseResult<ProductCategoryRow> {
  const result = Papa.parse<Record<string, string>>(content.trim(), {
    header: true,
    delimiter: ',',
    skipEmptyLines: true,
  });
  const missing = missingCols(result.meta.fields ?? [], PRODUCT_CATEGORY_REQUIRED_COLUMNS);
  if (missing.length) {
    throw new Error(`Colonnes manquantes : ${missing.join(', ')}`);
  }
  return validateProductCategoryRows(result.data);
}

// ── Import 2 ─────────────────────────────────────────────────────────────────

const COMBINATION_REQUIRED_COLUMNS = ['reference', 'karazany', 'stock_initial', 'prix_vente_ttc'];
const IMPORT2_SPEC_VARIANTS = ['specificité', 'specificite'];

function checkImport2Headers(fields: string[]): string[] {
  const missing = missingCols(fields, COMBINATION_REQUIRED_COLUMNS);
  const hasSpec = IMPORT2_SPEC_VARIANTS.some(v => fields.includes(v));
  if (!hasSpec) missing.push('"specificite" (ou "specificité")');
  return missing;
}

function mapCombinationRecord(r: Record<string, string>): CombinationRow {
  const ttcRaw = (r['prix_vente_ttc'] ?? '').trim();

  // Find the specificite key regardless of accent or exact spelling
  const keys = Object.keys(r);
  const specKey = keys.find(k => {
    const norm = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return norm === 'specificite' || norm === 'specificite';
  }) || 'specificité';

  return {
    reference:    (r['reference'] ?? '').trim(),
    specificite:  (r[specKey] ?? '').trim(),
    karazany:     (r['karazany'] ?? '').trim(),
    stockInitial: parseFloatFr(r['stock_initial'] ?? '0'),
    prixVenteTtc: ttcRaw ? parseFloatFr(ttcRaw) : null,
  };
}

function validateCombinationRows(data: Record<string, string>[]): CsvParseResult<CombinationRow> {
  const rows: CombinationRow[] = [];
  const errors: { row: number; error: string }[] = [];

  data.forEach((r, i) => {
    const rowNum = i + 2;
    const rowErrors: string[] = [];
    const row = mapCombinationRecord(r);

    if (!row.reference) rowErrors.push('colonne "reference" vide');

    if (row.stockInitial < 0) {
      rowErrors.push(`stock_initial doit être positif ou nul (reçu : "${r['stock_initial'] ?? ''}")`);
    }
    if (row.prixVenteTtc !== null && row.prixVenteTtc < 0) {
      rowErrors.push(`prix_vente_ttc ne peut pas être négatif (reçu : "${r['prix_vente_ttc'] ?? ''}")`);
    }
    if (!!row.specificite !== !!row.karazany) {
      rowErrors.push(
        `"specificite" et "karazany" doivent être tous les deux remplis ou tous les deux vides` +
        ` (reçu : specificite="${row.specificite}", karazany="${row.karazany}")`,
      );
    }

    if (rowErrors.length) {
      rowErrors.forEach(e => errors.push({ row: rowNum, error: e }));
    } else {
      rows.push(row);
    }
  });

  return { rows, errors };
}

export function parseCombinationCsv(file: File): Promise<CsvParseResult<CombinationRow>> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      delimiter: ',',
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: results => {
        const missing = checkImport2Headers(results.meta.fields ?? []);
        if (missing.length) {
          reject(new Error(`Colonnes manquantes : ${missing.join(', ')}`));
          return;
        }
        resolve(validateCombinationRows(results.data));
      },
      error: err => reject(new Error(err.message)),
    });
  });
}

export function parseCombinationCsvFromString(content: string): CsvParseResult<CombinationRow> {
  const result = Papa.parse<Record<string, string>>(content.trim(), {
    header: true,
    delimiter: ',',
    skipEmptyLines: true,
  });
  const missing = checkImport2Headers(result.meta.fields ?? []);
  if (missing.length) throw new Error(`Colonnes manquantes : ${missing.join(', ')}`);
  return validateCombinationRows(result.data);
}

// ── Import 3 ─────────────────────────────────────────────────────────────────

const ORDER_REQUIRED_COLUMNS = ['date', 'nom', 'email', 'pwd', 'adresse', 'achat', 'etat'];

// Parses: [(ref;qty;variant),(ref;qty;variant)]
function parseAchat(raw: string): OrderItem[] {
  const content = raw.trim().slice(1, -1); // strip outer [ ]
  if (!content) return [];
  const parts = content.split(/\),\s*\(/);
  return parts.map(part => {
    const clean    = part.replace(/^\(/, '').replace(/\)$/, '');
    const segments = clean.split(';');
    const ref      = (segments[0] ?? '').replace(/^"(.*)"$/, '$1').trim();
    const qty      = parseInt((segments[1] ?? '1').trim(), 10) || 1;
    const variant  = (segments[2] ?? '').replace(/^"(.*)"$/, '$1').trim();
    return { reference: ref, qty, variant };
  }).filter(i => !!i.reference);
}

function mapOrderRecord(r: Record<string, string>): OrderRow {
  return {
    date:    parseDateDDMmYyyyHhMmSs((r['date']    ?? '').trim()),
    nom:     (r['nom']     ?? '').trim(),
    email:   (r['email']   ?? '').trim(),
    pwd:     (r['pwd']     ?? '').trim(),
    adresse: (r['adresse'] ?? '').trim(),
    items:   parseAchat((r['achat'] ?? '').trim()),
    etat:    (r['etat']    ?? '').trim(),
  };
}

function validateOrderRows(data: Record<string, string>[]): CsvParseResult<OrderRow> {
  const rows: OrderRow[] = [];
  const errors: { row: number; error: string }[] = [];

  data.forEach((r, i) => {
    const rowNum = i + 2;
    const rowErrors: string[] = [];
    const row = mapOrderRecord(r);

    const rawDate = (r['date'] ?? '').trim();
    if (!rawDate) {
      rowErrors.push('colonne "date" vide');
    } else if (!isValidDdMmYyyy(rawDate)) {
      rowErrors.push(`date "${rawDate}" invalide — format attendu : DD/MM/YYYY ou DD/MM/YYYY HH:MM:SS`);
    }
    if (!row.email) rowErrors.push('colonne "email" vide');
    if (!row.nom)   rowErrors.push('colonne "nom" vide');
    if (row.items.length === 0) {
      rowErrors.push(`colonne "achat" vide ou mal formée (reçu : "${r['achat'] ?? ''}")`);
    }

    if (rowErrors.length) {
      rowErrors.forEach(e => errors.push({ row: rowNum, error: e }));
    } else {
      rows.push(row);
    }
  });

  return { rows, errors };
}

export function parseOrderCsv(file: File): Promise<CsvParseResult<OrderRow>> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      delimiter: ',',
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: results => {
        const missing = missingCols(results.meta.fields ?? [], ORDER_REQUIRED_COLUMNS);
        if (missing.length) {
          reject(new Error(`Colonnes manquantes : ${missing.join(', ')}`));
          return;
        }
        resolve(validateOrderRows(results.data));
      },
      error: err => reject(new Error(err.message)),
    });
  });
}

export function parseOrderCsvFromString(content: string): CsvParseResult<OrderRow> {
  const result = Papa.parse<Record<string, string>>(content.trim(), {
    header: true,
    delimiter: ',',
    skipEmptyLines: true,
  });
  const missing = missingCols(result.meta.fields ?? [], ORDER_REQUIRED_COLUMNS);
  if (missing.length) throw new Error(`Colonnes manquantes : ${missing.join(', ')}`);
  return validateOrderRows(result.data);
}
