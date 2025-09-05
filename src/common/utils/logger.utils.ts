import { Logger } from '@nestjs/common';

export const logger = (
  modulo: string,
  mensaje: string,
  error: unknown,
  tipo: 'log' | 'error' | 'warn',
): void => {
  const logger = new Logger(modulo);
  logger[tipo](mensaje);
};
