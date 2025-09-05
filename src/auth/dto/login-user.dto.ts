import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class LoginUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsBoolean()
  @Type(() => Boolean)
  public rememberme: boolean = false;
}
