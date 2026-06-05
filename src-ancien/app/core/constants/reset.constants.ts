import { RESOURCE_LABELS } from '../models/api.model';
import { ProgressInfo, ResetResource } from '../models/reset-result.model';

export interface EndpointOption {
  endpoint: ResetResource;
  label:    string;
  badge:    string | null;
}

export const ALL_ENDPOINTS: readonly EndpointOption[] = [
  // ── Order resources (delete children before parents) ─────────────────────
  { endpoint: 'order_cart_rules', label: RESOURCE_LABELS['order_cart_rules'], badge: null },
  { endpoint: 'order_payments',   label: RESOURCE_LABELS['order_payments'],   badge: null },
  { endpoint: 'order_slip',       label: RESOURCE_LABELS['order_slip'],       badge: null },
  { endpoint: 'order_invoices',   label: RESOURCE_LABELS['order_invoices'],   badge: null },
  { endpoint: 'order_carriers',   label: RESOURCE_LABELS['order_carriers'],   badge: null },
  { endpoint: 'order_histories',  label: RESOURCE_LABELS['order_histories'],  badge: null },
  { endpoint: 'order_details',    label: RESOURCE_LABELS['order_details'],    badge: null },
  { endpoint: 'orders',           label: RESOURCE_LABELS['orders'],           badge: 'Supprimer après les sous-ressources' },
  { endpoint: 'carts',            label: RESOURCE_LABELS['carts'],            badge: 'Supprimer après les commandes' },
  { endpoint: 'addresses',        label: RESOURCE_LABELS['addresses'],        badge: 'Adresses système préservées' },
  { endpoint: 'customers',        label: RESOURCE_LABELS['customers'],        badge: 'Supprimer en dernier' },
  // ── Stock ─────────────────────────────────────────────────────────────────
  { endpoint: 'stock_movements',        label: RESOURCE_LABELS['stock_movements'],        badge: 'Supprimer avant les produits' },
  // ── Catalog resources ─────────────────────────────────────────────────────
  { endpoint: 'combinations',          label: RESOURCE_LABELS['combinations'],          badge: 'Supprimer avant les produits' },
  { endpoint: 'product_option_values', label: RESOURCE_LABELS['product_option_values'], badge: null },
  { endpoint: 'product_options',       label: RESOURCE_LABELS['product_options'],       badge: null },
  { endpoint: 'products',              label: RESOURCE_LABELS['products'],              badge: null },
  { endpoint: 'categories',            label: RESOURCE_LABELS['categories'],            badge: 'Racine & Accueil préservées' },
  { endpoint: 'tax_rule_groups',       label: RESOURCE_LABELS['tax_rule_groups'],       badge: null },
  { endpoint: 'taxes',                 label: RESOURCE_LABELS['taxes'],                 badge: null },
];

export const PHASE_LABELS: Record<ProgressInfo['phase'], string> = {
  fetching: 'Chargement…',
  deleting: 'Suppression…',
  done:     'Terminé',
};
