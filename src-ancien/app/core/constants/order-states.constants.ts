import { BadgeVariant } from '@app/shared/ui/badge/badge.component';

export const ORDER_STATE_CART = 1;
export const ORDER_STATE_PAYMENT_ACCEPTED = 11;
export const ORDER_STATE_DELIVERED = 5;
export const ORDER_STATE_PAYMENT_CANCELLED = 6;

export interface OrderStateInfo {
  id: number;
  label: string;
  labelPastTense: string;
  variant: BadgeVariant;
}

export const ORDER_STATE_MAP: Record<number, OrderStateInfo> = {
  [ORDER_STATE_CART]: {
    id: ORDER_STATE_CART,
    label: 'Dans le panier',
    labelPastTense: 'Dans le panier',
    variant: 'warning',
  },
  [ORDER_STATE_PAYMENT_ACCEPTED]: {
    id: ORDER_STATE_PAYMENT_ACCEPTED,
    label: 'Paiement effectué',
    labelPastTense: 'Paiement accepté',
    variant: 'success',
  },
  [ORDER_STATE_DELIVERED]: {
    id: ORDER_STATE_DELIVERED,
    label: 'Commande Livrée',
    labelPastTense: 'Livrée',
    variant: 'info',
  },
  [ORDER_STATE_PAYMENT_CANCELLED]: {
    id: ORDER_STATE_PAYMENT_CANCELLED,
    label: 'Annulé',
    labelPastTense: 'Annulé',
    variant: 'danger',
  },
};

export function getOrderStateName(stateId: number | null): string {
  if (stateId === null) return '—';
  return ORDER_STATE_MAP[stateId]?.label ?? `État ${stateId}`;
}

export function getOrderStateVariant(stateId: number | null): BadgeVariant {
  if (stateId === null) return 'neutral';
  return ORDER_STATE_MAP[stateId]?.variant ?? 'neutral';
}

export function resolveOrderStateByName(name: string): number | null {
  const n = name.toLowerCase().trim();
  if (!n || n === 'dans le panier') return null;
  if (n === 'livré') return ORDER_STATE_DELIVERED;
  if (n === 'paiement accepté') return ORDER_STATE_PAYMENT_ACCEPTED;
  if (n === 'annulé') return ORDER_STATE_PAYMENT_CANCELLED;
  return null;
}
