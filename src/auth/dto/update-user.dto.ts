import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsStrongPassword } from 'class-validator';
import { RegisterUserDto } from './register-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAuthDto extends PartialType(RegisterUserDto) {
  @ApiPropertyOptional({ example: 'Pepito Perez', description: 'Name user' })
  name?: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Email user',
  })
  email?: string;

  @ApiPropertyOptional({
    example: 'StrongP@ssw0rd!',
    description: 'Password user',
  })
  password?: string;

  @ApiPropertyOptional({
    example: 'StrongP@ssw0rd!',
    description: 'Confirm password user',
  })
  confirmPassword?: string;

  @ApiPropertyOptional({
    example: 'StrongP@ssw0rd!',
    description: 'Confirm new password user',
  })
  @IsString()
  @IsStrongPassword()
  newPassword?: string;
}
