/**
 * Formats a number as a Euro currency string.
 * @example formatCurrency(1234.5) → "1 235 €"
 */
export function formatCurrency(amount: number, decimals = 0): string {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + ' €';
}

/**
 * Formats any date string to ISO format "YYYY-MM-DD".
 * Handles PS datetime strings ("YYYY-MM-DD HH:MM:SS") and ISO dates.
 */
export function formatDateISO(raw: string): string {
  if (!raw) return '—';
  // Extract YYYY-MM-DD from any format
  const match = raw.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : raw;
}

/**
 * Formats a PrestaShop datetime string ("YYYY-MM-DD HH:MM:SS") into
 * a French short date ("DD/MM/YYYY HH:MM").
 */
export function formatDateTime(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw.replace(' ', 'T'));
  if (isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mn = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mn}`;
}

/**
 * Formats an ISO date string ("YYYY-MM-DD") into a French localised short
 * date ("lun. 01 janv.").
 */
export function formatShortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

/**
 * Formats a PS date string ("YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD") to
 * a French date only ("25/05/2026").
 */
export function formatDateOnly(raw: string): string {
  if (!raw) return '—';
  const d = new Date(raw.slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('fr-FR');
}

/**
 * Formats a PS date string to a French long date ("25 mai 2026").
 */
export function formatDateLong(raw: string): string {
  if (!raw) return '—';
  const d = new Date(raw.slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
