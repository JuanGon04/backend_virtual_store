import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsStrongPassword } from 'class-validator';
import { RegisterUserDto } from './register-user.dto';

export class UpdateAuthDto extends PartialType(RegisterUserDto) {
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}
