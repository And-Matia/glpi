export function splitName(nom: string): { lastname: string; firstname: string } {
  const parts     = nom.trim().split(/\s+/);
  const firstname = parts.length > 1 ? parts.pop()! : nom;
  const lastname  = parts.length > 0 ? parts.join(' ') : nom;
  return { lastname, firstname };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
