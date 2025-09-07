import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto, UpdateAuthDto } from './dto';
import { Response } from 'express';
import { manejarError } from '@common/utils';
import { Throttle } from '@nestjs/throttler';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthGuard } from '@common/guards';
import { PaginationDto } from '@common/dto';
import { CurrentUser } from '@common/interfaces';
import { User } from '@common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Passwords do not match' })
  @ApiResponse({
    status: 409,
    description:
      'Registration could not be completed. Please verify your information.',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  create(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login an existing user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
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
  @ApiOperation({ summary: 'Logout the current user' })
  @ApiResponse({ status: 200, description: 'Logout successfully' })
  logout(@Res() res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return res.send({ message: 'Logout successfully' });
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get()
  @ApiCookieAuth('jwt')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 401, description: 'Expired or invalid token' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  findAllUser(@Query() paginationDto: PaginationDto) {
    return this.authService.findAllUser(paginationDto);
  }

  @UseGuards(AuthGuard)
  @Patch()
  @ApiCookieAuth('jwt')
  @ApiOperation({ summary: 'Update a user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 409,
    description: 'The current password is equal to the new password',
  })
  @ApiResponse({ status: 404, description: 'Current password is incorrect' })
  @ApiResponse({ status: 404, description: 'Passwords do not match' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  update(@Body() updateAuthDto: UpdateAuthDto, @User() user: CurrentUser) {
    return this.authService.update(user.id, updateAuthDto);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @ApiCookieAuth('jwt')
  @ApiQuery({ name: 'id', required: true, type: String })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Expired or invalid token' })
  @ApiOperation({ summary: 'Delete a user for ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(id);
  }
}
