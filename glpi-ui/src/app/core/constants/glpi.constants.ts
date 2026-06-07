import { SelectOption } from '@app/shared/ui/select/select.component';


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

export interface AssetTypeConfig {
  /** GLPI itemtype — app identity and the CSV `Item_Type` value (e.g. "Socket"). */
  itemtype:   string;
  /**
   * GLPI v1 REST endpoint name. Equals `itemtype` for plain classes, but is the
   * fully-namespaced class for the few that GLPI 11 moved (e.g. "Glpi\\Socket").
   * Using the bare name for those 400s with ERROR_RESOURCE_NOT_FOUND_NOR_COMMONDBTM.
   */
  apiType:    string;
  /** French label shown in the UI. */
  label:      string;
  /** High-level v2 API path segment. */
  v2Path:     string;
  /**
   * Dropdown itemtype the CSV "Model" column is resolved against (find-or-create
   * at import time). Usually `{itemtype}Model`, but some itemtypes carry the
   * concept on a *type* dropdown instead (Cable→CableType, …) or a namespaced
   * class (Socket→Glpi\\SocketModel). `undefined` when the itemtype has no such
   * field at all (Software, SoftwareLicense) — the "Model" column is then dropped.
   */
  modelType?:  string;
  /** Foreign-key field carrying the model/type on the asset. `undefined` when none. */
  modelField?: string;
}

interface AssetOptions {
  /** Default true: auto-derive `{itemtype}Model` / `{itemtype.toLowerCase()}models_id`. Ignored when `model` is set. */
  hasModel?: boolean;
  /** Override the v1 REST endpoint for namespaced classes (e.g. "Glpi\\Socket"). */
  apiType?:  string;
  /** Explicit dropdown for the "Model" column when it isn't the standard `{itemtype}Model`. */
  model?:    { type: string; field: string };
}

function asset(itemtype: string, label: string, opts: AssetOptions = {}): AssetTypeConfig {
  const { hasModel = true, apiType = itemtype, model } = opts;
  const cfg: AssetTypeConfig = {
    itemtype,
    apiType,
    label,
    v2Path: `Assets/${itemtype}`,
  };
  if (model) {
    cfg.modelType  = model.type;
    cfg.modelField = model.field;
  } else if (hasModel) {
    cfg.modelType  = `${itemtype}Model`;
    cfg.modelField = `${itemtype.toLowerCase()}models_id`;
  }
  return cfg;
}

export const ASSET_TYPES: AssetTypeConfig[] = [
  asset('Computer',          'Ordinateur'),
  asset('Monitor',           'Moniteur'),
  asset('Printer',           'Imprimante'),
  asset('Phone',             'Téléphone'),
  asset('Peripheral',        'Périphérique'),
  asset('NetworkEquipment',  'Équipement réseau'),
  asset('Enclosure',         'Enclosure'),
  asset('PDU',               'PDU'),
  asset('PassiveDCEquipment','PassiveDCEquipment'),
  asset('Rack',              'Rack'),
  // ── "Model" column mapped to the type/model dropdown each itemtype actually has ──
  asset('Cable',             'Cable',           { model: { type: 'CableType',       field: 'cabletypes_id' } }),
  asset('Appliance',         'Appliance',       { model: { type: 'ApplianceType',   field: 'appliancetypes_id' } }),
  asset('Certificate',       'Certificate',     { model: { type: 'CertificateType', field: 'certificatetypes_id' } }),
  asset('Socket',            'Socket',          { apiType: 'Glpi\\Socket', model: { type: 'Glpi\\SocketModel', field: 'socketmodels_id' } }),
  // ── No model/type dropdown for these → the "Model" column is dropped ──
  asset('Software',          'Logiciel',        { hasModel: false }),
  asset('SoftwareLicense',   'SoftwareLicense', { hasModel: false }),
];

/** All supported GLPI itemtypes (CSV `Item_Type` values), e.g. for CSV validation. */
export const ASSET_ITEMTYPES: string[] = ASSET_TYPES.map(a => a.itemtype);

/** GLPI v1 REST endpoint names for every supported asset (namespaced where needed). */
export const ASSET_API_TYPES: string[] = ASSET_TYPES.map(a => a.apiType);

export function assetType(itemtype: string): AssetTypeConfig | undefined {
  return ASSET_TYPES.find(a => a.itemtype === itemtype);
}

export function assetLabel(itemtype: string): string {
  return assetType(itemtype)?.label ?? itemtype;
}

/**
 * GLPI REST endpoint / relation `itemtype` value for a CSV itemtype.
 * Returns the namespaced class where GLPI requires it (e.g. "Socket" → "Glpi\\Socket"),
 * otherwise the itemtype unchanged.
 */
export function apiTypeOf(itemtype: string): string {
  return assetType(itemtype)?.apiType ?? itemtype;
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
