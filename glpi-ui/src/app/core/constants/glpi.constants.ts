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

export const GLPI_ITEM_STATUS: Record<number, string> = {
  1: 'En stock',
  2: 'En production',
  3: 'En panne',
  4: 'Maintenance',
  5: 'Hors service',
};

export function glpiCodeFromLabel(
  map: Record<number, string>,
  label: string | undefined | null,
): number | undefined {
  if (!label) return undefined;
  const wanted = label.trim().toLowerCase();
  const entry = Object.entries(map).find(([, value]) => value.toLowerCase() === wanted);
  return entry ? Number(entry[0]) : undefined;
}
