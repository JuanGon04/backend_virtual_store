export function limpiarEspacios(texto: string): string {
  return String(texto ?? '')
      .replace(/\s+/g, ' ')
      .trim();
}
