import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class LoginUserDto {

  @ApiProperty({ example: 'user@example.com', description: 'Email user' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd!', description: 'Password user' })
  @IsString()
  @IsStrongPassword()
  password: string;

  @IsBoolean()
  @Type(() => Boolean)
  public rememberme: boolean = false;
}
