import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto, UpdateAuthDto } from './dto';
import { Response } from 'express';
import { manejarError } from '@common/utils';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController{
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  create(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async loginUser(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    try {
      const authResponse = await this.authService.loginUser(loginUserDto);

      if (!authResponse.token) {
        throw new HttpException(
          'Authentication failed',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const { token, user_id } = authResponse;

      const maxAge = !loginUserDto.rememberme
        ? 24 * 60 * 60 * 1000
        : 60 * 24 * 60 * 60 * 1000; // 24 horas o 60 días

      // Configurar la cookie con el token
      res.cookie('jwt', token, {
        httpOnly: true, // No accesible por JavaScript en el frontend
        secure: true, // Solo se envía en HTTPS
        sameSite: 'strict', // Protege contra CSRF
        maxAge: maxAge, // 24 horas o 60 días
      });

      return res.json({ message: 'Login successful', id_user: user_id });
    } catch (error) {
      manejarError(error, 'Error during login', 'AuthController-loginUser');
    }
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return res.send({ message: 'Logout successfully' });
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
