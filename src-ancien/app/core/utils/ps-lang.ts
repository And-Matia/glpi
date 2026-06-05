import { PsLang } from '@app/core/models';
import { DEFAULT_LANG } from '@app/core/constants';

/**
 * Extracts the localised string value from a PrestaShop multilingual array.
 * Falls back to the first available language if DEFAULT_LANG is not found.
 *
 * @example
 *   psLang(product.name)  // → "Mon produit"
 */
export function psLang(langs: PsLang[] | undefined): string {
  if (!langs?.length) return '';
  return langs.find(l => l.id === DEFAULT_LANG)?.value ?? langs[0]?.value ?? '';
}
