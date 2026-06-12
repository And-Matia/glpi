export function toGlpiDate(date: string, heure: string): string {
  const cleanDate = date.trim();
  const parts = cleanDate.split(/[\/\-\.]/);

  if (parts.length !== 3) {
    throw new Error(`Format de date invalide : ${date}. Utilisez DD/MM/YYYY ou YYYY-MM-DD`);
  }

  if (parts[0].length === 2 && parts[2].length === 2) {
    throw new Error(`Année à 2 chiffres non supportée : ${date}`);
  }

  let year: number, month: number, day: number;

  if (parts[0].length === 4) {
    year = Number(parts[0]); month = Number(parts[1]); day = Number(parts[2]);
  } else if (parts[2].length === 4) {
    day = Number(parts[0]); month = Number(parts[1]); year = Number(parts[2]);
  } else {
    throw new Error(`Impossible de déterminer le format : ${date}. Utilisez DD/MM/YYYY ou YYYY-MM-DD`);
  }

  const testDate = new Date(year, month - 1, day);
  if (
    Number.isNaN(testDate.getTime()) ||
    testDate.getFullYear() !== year ||
    testDate.getMonth() !== month - 1 ||
    testDate.getDate() !== day
  ) {
    throw new Error(`Date invalide : ${date}`);
  }

  const heureRegex = /^\d{1,2}:\d{2}(:\d{2})?$/;
  const rawHeure = heure.trim() || '00:00';
  if (!heureRegex.test(rawHeure)) {
    throw new Error(`Format d'heure invalide : ${heure}`);
  }
  const cleanHeure = rawHeure.split(':').slice(0, 2).join(':');

  return `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${cleanHeure}:00`;
}
