import { SelectOption } from '@app/shared/ui/select/select.component';

/* ============================================================================
 *  Single source of truth for every GLPI ↔ app mapping and option list.
 *  (Tickets, asset types, item statuses.)
 * ========================================================================== */

/* ── Tickets : GLPI code → label ──────────────────────────────────────────── */

export const GLPI_TICKET_STATUS: Record<number, string> = {
  1: 'New',
  2: 'Processing (assigned)',
  3: 'Processing (planned)',
  4: 'Pending',
  5: 'Solved',
  6: 'Closed',
};

export const GLPI_TICKET_PRIORITY: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High',
  6: 'Major',
};

export const GLPI_TICKET_TYPE: Record<number, string> = {
  1: 'Incident',
  2: 'Request',
};

/* ── Tickets : French option lists (create form & filters) ──────────────────── */

export const TICKET_TYPE_OPTIONS: SelectOption[] = [
  { value: 1, label: 'Incident' },
  { value: 2, label: 'Demande' },
];

export const TICKET_PRIORITY_OPTIONS: SelectOption[] = [
  { value: 1, label: 'Très basse' },
  { value: 2, label: 'Basse' },
  { value: 3, label: 'Moyenne' },
  { value: 4, label: 'Haute' },
  { value: 5, label: 'Très haute' },
  { value: 6, label: 'Majeure' },
];

/* ── Tickets : CSV import label → GLPI code (English labels + French aliases) ── */

export const TICKET_TYPE_CODE: Record<string, number> = {
  Incident: 1,
  Request:  2,
  Demande:  2,
};

export const TICKET_STATUS_CODE: Record<string, number> = {
  'New':                    1,
  'Processing (assigned)':  2,
  'Processing (planned)':   3,
  'Pending':                4,
  'Solved':                 5,
  'Closed':                 6,
};

export const TICKET_PRIORITY_CODE: Record<string, number> = {
  'Very Low':  1,
  'Low':       2,
  'Medium':    3,
  'High':      4,
  'Very High': 5,
  'Major':     6,
};

/* ============================================================================
 *  GLPI asset types — extensible registry.
 *
 *  Supporting a NEW asset type (Printer, Phone, NetworkEquipment, …) is a
 *  one-liner: add an entry below. Every service/component derives its
 *  behaviour from this list, so nothing else has to change.
 *
 *  Field naming follows GLPI's strict convention (verified live against 11.0.7):
 *    - v2 path            = "Assets/" + itemtype           (e.g. "Assets/Printer")
 *    - model dropdown     = itemtype + "Model"             (e.g. "PrinterModel")
 *    - model FK field     = lowercase(itemtype) + "models_id" (e.g. "printermodels_id")
 *
 *  Assets are CREATED via the v2 API (POST /Assets/{itemtype}) — not v1. The v1
 *  REST layer can't reach a few itemtypes by their plain name (e.g. `Socket` is
 *  the namespaced class `Glpi\Socket`), whereas the v2 `Assets/{itemtype}` path
 *  is uniform for every type. Dropdowns (State, Location, …, {itemtype}Model) are
 *  still resolved/created over v1, which exposes them cleanly.
 * ========================================================================== */

export interface AssetTypeConfig {
  /** GLPI itemtype — also the v1 REST endpoint and the CSV `Item_Type` value. */
  itemtype:     string;
  /** French label shown in the UI. */
  label:        string;
  /** High-level v2 API path segment. */
  v2Path:       string;
  /** Class name GLPI stores in relation tables (e.g. Document_Item.itemtype).
   *  Equals `itemtype` for global classes; namespaced for a few (e.g. `Glpi\Socket`). */
  relationType: string;
  /** Model dropdown itemtype (find-or-create at import time). null = no model in GLPI. */
  modelType:    string | null;
  /** Foreign-key field carrying the model on the asset. null = no model in GLPI. */
  modelField:   string | null;
  /** v2 property carrying the State dropdown. GLPI names it `status` for classic
   *  inventory assets but `state` for the DCIM/cable family; a few types have no
   *  state at all (null). Verified live against 11.0.7. */
  stateField:   'status' | 'state' | null;
}

function asset(
  itemtype: string,
  label: string,
  modelType?: string | null,
  relationType?: string,
  stateField: 'status' | 'state' | null = 'status',
): AssetTypeConfig {
  const mt = modelType !== undefined ? modelType : `${itemtype}Model`;
  return {
    itemtype,
    label,
    v2Path:       `Assets/${itemtype}`,
    relationType: relationType ?? itemtype,
    modelType:    mt,
    modelField:   mt ? `${itemtype.toLowerCase()}models_id` : null,
    stateField,
  };
}

export const ASSET_TYPES: AssetTypeConfig[] = [
  asset('Computer',          'Ordinateur'),
  asset('Monitor',           'Moniteur'),
  asset('Printer',           'Imprimante'),
  asset('Phone',             'Téléphone'),
  asset('Peripheral',        'Périphérique'),
  asset('NetworkEquipment',  'Équipement réseau'),
  // DCIM/cable family: GLPI's v2 schema exposes the State dropdown as `state`.
  asset('Enclosure',         'Boîtier',            undefined, undefined, 'state'),
  asset('PDU',               'PDU',                undefined, undefined, 'state'),
  asset('PassiveDCEquipment','Équipement DC passif', undefined, undefined, 'state'),
  asset('Rack',              'Rack',               undefined, undefined, 'state'),
  asset('Cable',             'Câble',              null, undefined, 'state'),
  // Socket is the namespaced class Glpi\Socket: created via Assets/Socket (v2),
  // but relation tables (Document_Item) need the fully-qualified class name.
  // Socket has no State field in GLPI.
  asset('Socket',            'Prise',              null, 'Glpi\\Socket', null),
  asset('Appliance',         'Appliance',          null),
  // Software itself has no State (status lives on SoftwareVersion).
  asset('Software',          'Logiciel',           null, undefined, null),
  asset('SoftwareLicense',   'Licence logicielle', null),
  asset('Certificate',       'Certificat',         null),
];

/** All supported GLPI itemtypes, e.g. for CSV validation. */
export const ASSET_ITEMTYPES: string[] = ASSET_TYPES.map(a => a.itemtype);

export function assetType(itemtype: string): AssetTypeConfig | undefined {
  return ASSET_TYPES.find(a => a.itemtype === itemtype);
}

export function assetLabel(itemtype: string): string {
  return assetType(itemtype)?.label ?? itemtype;
}

/** Type filter options (with a leading "all types" entry). */
export const ASSET_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Tous les types' },
  ...ASSET_TYPES.map(a => ({ value: a.itemtype, label: a.label })),
];

/* ============================================================================
 *  Item statuses — stored as GLPI `State` dropdowns (created on import).
 * ========================================================================== */

export const ITEM_STATUS_LABELS = [
  'En stock',
  'En production',
  'En panne',
  'Maintenance',
  'Hors service',
] as const;

/** Status filter options (with a leading "all statuses" entry). */
export const ITEM_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Tous les statuts' },
  ...ITEM_STATUS_LABELS.map(s => ({ value: s, label: s })),
];
