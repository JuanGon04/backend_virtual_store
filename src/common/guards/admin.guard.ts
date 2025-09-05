import { logger } from '@common/utils';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.jwt;

    if (!token) {
      logger('AdminGuard', 'Acceso denegado: Token no presente', null, 'warn');
      throw new HttpException('Token required', HttpStatus.BAD_REQUEST);
    }

    const { role } = await this.authService.verifyToken(token);

    if (role !== 'admin') {
      logger(
        'AdminGuard',
        `Acceso denegado: Usuario con rol "${role}" intentó acceder a ruta de administrador`,
        null,
        'warn',
      );
      throw new HttpException(
        'Access denied: Admins only',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }
}
