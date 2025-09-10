import { limpiarEspacios } from '@common/utils';

export function formatQuery(query: string) {
  const palabras = Array.from(new Set(limpiarEspacios(query).split(' ')));

  const palabrasFiltradas = palabras.filter((word) => word.length > 3);

  const sinonimos: Record<string, string> = {
    generica: 'generico',
  };

  const palabrasNormalizadas = palabrasFiltradas.map((palabra) => {
    const lower = palabra.toLowerCase();
    return sinonimos[lower] || palabra;
  });

  return palabrasNormalizadas;
}
