import { DateTime } from 'luxon';

export const formatDate = (date: Date): string => {
  const fecha = DateTime.fromJSDate(date).toUTC(); // se mantiene en UTC

  if (!fecha.isValid) {
    console.error('Fecha inválida:', fecha.invalidExplanation);
    return 'Fecha inválida';
  }

  return fecha.toFormat('yyyy-MM-dd');
};
