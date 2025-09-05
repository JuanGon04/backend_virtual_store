import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token =  request.cookies?.jwt;
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const {user, token:newToken} = await this.authService.verifyToken(token);
      
      request['user'] = user
      request['token'] = newToken;
      
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
