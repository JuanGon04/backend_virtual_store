import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { manejarError } from 'src/common/utils';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interface/jwt-payload.interface';
import { envs } from 'src/common/config';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto, RegisterUserDto, UpdateAuthDto } from './dto';
import { PaginationDto } from '@common/dto';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  onModuleInit() {
    this.$connect();
  }

  async signJWT(payload: JwtPayload, remenberMe = false): Promise<string> {
    const token = this.jwtService.sign(payload, {
      secret: envs.jwt_secret, // Asegúrate de que este sea el secreto correcto
      expiresIn: !remenberMe ? '24h' : '60d', // Expira en 24 horas o en 60 díasS
    });
    return token;
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password, confirmPassword } = registerUserDto;

    const userEmail = await this.user.findFirst({
      where: { email },
    });

    if (userEmail) {
      throw new HttpException(
        'Registration could not be completed. Please verify your information.',
        HttpStatus.CONFLICT,
      );
    }

    if (password != confirmPassword) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.user.create({
        data: {
          email,
          password: bcrypt.hashSync(password, 10),
          name,
        },
      });

      return {
        message: 'User registered successfully',
        status: HttpStatus.CREATED,
      };
    } catch (error) {
      manejarError(error, 'Error registering user', 'AuthService-registerUser');
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const user = await this.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          password: true,
        },
      });

      if (!user) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const { password: _, ...rest } = user;

      return {
        user_id: rest.id,
        token: await this.signJWT(rest, loginUserDto.rememberme),
      };
    } catch (error) {
      manejarError(error, null, 'AuthService-loginUser');
    }
  }

  async verifyToken(token: string) {
    try {
      const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
        secret: envs.jwt_secret,
      });

      const userConsult = await this.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          password: true,
          rol: true,
        },
      });

      if (!userConsult) {
        throw new HttpException(
          'Expired or invalid token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const { password, rol, ...rest } = userConsult;
      return {
        user: userConsult,
        role: rol,
        token: await this.signJWT(rest),
      };
    } catch (error) {
      manejarError(
        error,
        'Invalid or expired token',
        'AuthService-verifyToken',
      );
    }
  }

  async findAllUser(paginationDto: PaginationDto) {
    try {
      const page = paginationDto.page ?? 1;
      const limit = paginationDto.limit ?? 10;
      const totalPages = await this.user.count();
      const lastPage = Math.ceil(totalPages / limit);

      const users = await this.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          rol: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: users,
        meta: {
          total_page: Math.ceil(totalPages / limit),
          page: page,
          lastPage: lastPage,
        },
      };
    } catch (error) {
      manejarError(error, 'Error getting users', 'AuthService-findAllUser');
    }
  }

  async findOne(id: string) {
    const user = await this.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async update(id_user: string, updateAuthDto: UpdateAuthDto) {
    const { name, password, confirmPassword, newPassword } = updateAuthDto;

    try {
      if (password === newPassword) {
        throw new HttpException(
          'The current password is equal to the new password',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (newPassword != confirmPassword) {
        throw new HttpException(
          'Passwords do not match',
          HttpStatus.BAD_REQUEST,
        );
      }

      const userConsult = await this.findOne(id_user);

      const isPasswordValid = bcrypt.compareSync(
        password ?? '',
        userConsult.password,
      );

      if (!isPasswordValid) {
        throw new HttpException(
          'Current password is incorrect',
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.user.update({
        where: { id: id_user },
        data: {
          password: bcrypt.hashSync(newPassword ?? '', 10),
          name: name,
        },
      });

      return {
        message: 'User updated successfully',
        status: HttpStatus.NO_CONTENT,
      };
    } catch (error) {
      manejarError(error, 'Error updating user', 'AuthService-updateUser');
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.user.delete({
        where: { id },
      });
      return {
        message: 'User deleted successfully',
        status: HttpStatus.NO_CONTENT,
      };
    } catch (error) {
      manejarError(error, 'Error deleting user', "AuthService-remove");
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
