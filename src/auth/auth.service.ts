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
          rol:true
        },
      });

      const { password: _, rol, ...rest } = user;

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

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
