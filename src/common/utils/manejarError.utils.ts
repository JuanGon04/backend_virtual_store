import { HttpException, HttpStatus } from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError
} from '@prisma/client/runtime/library';
import { logger } from './logger.utils';

export function manejarError(
  error: unknown,
  mensajePersonalizado: string | null,
  modulo: string,
): never {
  const prefijo = mensajePersonalizado ? `${mensajePersonalizado}. ` : '';

  // HttpException
  if (error instanceof HttpException) {
    throw error;
  }

  // Errores conocidos de Prisma (códigos de error)
  if (error instanceof PrismaClientKnownRequestError) {
    const erroresPrisma: Record<
      string,
      { mensaje: string; status: HttpStatus; log?: boolean }
    > = {
      P2000: {
        mensaje: 'Uno de los campos contiene demasiados caracteres.',
        status: HttpStatus.BAD_REQUEST,
      },
      P2001: {
        mensaje: 'No se encontró el dato solicitado.',
        status: HttpStatus.NOT_FOUND,
      },
      P2002: {
        mensaje: 'Este dato ya está registrado.',
        status: HttpStatus.CONFLICT,
      },
      P2004: {
        mensaje: 'No se pudo guardar la información por una restricción.',
        status: HttpStatus.BAD_REQUEST,
        log: true,
      },
      P2005: {
        mensaje: 'Se envió un dato inválido.',
        status: HttpStatus.BAD_REQUEST,
      },
      P2010: {
        mensaje: 'No se pudo completar la operación. Revisa los datos.',
        status: HttpStatus.BAD_REQUEST,
      },
      P2025: {
        mensaje: 'El recurso solicitado no existe o ya fue eliminado.',
        status: HttpStatus.NOT_FOUND,
      },
    };

    const errorInfo = erroresPrisma[error.code];
    if (errorInfo) {
      if (errorInfo.log) {
        logger(modulo, `${prefijo}${errorInfo.mensaje}`, error.message, 'error');
      }

      throw new HttpException(
        prefijo + errorInfo.mensaje,
        errorInfo.status,
      );
    }

    // Prisma error no mapeado
    logger(modulo, `Prisma error desconocido [${error.code}]` ,  error.message, 'error');
    throw new HttpException(
      prefijo + 'Ocurrió un error al procesar la solicitud.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  // Errores de validación de datos
  if (error instanceof PrismaClientValidationError) {
    logger(modulo, `Error de validación Prisma`,  error.message, 'warn');
    throw new HttpException(
      prefijo + 'Error en los datos enviados.',
      HttpStatus.BAD_REQUEST,
    );
  }

  // Errores internos graves de Prisma
  if (
    error instanceof PrismaClientUnknownRequestError ||
    error instanceof PrismaClientRustPanicError ||
    error instanceof PrismaClientInitializationError
  ) {
    logger(modulo, `Error grave de Prisma`, error.message, 'error');
    throw new HttpException(
      'Error interno del sistema. Intenta más tarde.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  // Cualquier otro error inesperado
  logger(modulo, `Error inesperado: ${prefijo.toLowerCase()}`, JSON.stringify(error), 'error');
  throw new HttpException(
    prefijo.trim() == '' ? 'Error interno del servidor.' : prefijo.trim() ,
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}

