export function rgbStringToHex(rgb: string): string {
  const [r, g, b] = rgb.match(/\d+/g)!.map(Number);

  return '#' + [r, g, b]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace('#', '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(c => c + c)
      .join('');
  }

  const value = parseInt(hex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}
