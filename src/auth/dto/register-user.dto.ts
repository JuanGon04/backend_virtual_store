import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'Pepito Perez', description: 'Name user' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email user' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd!', description: 'Password user' })
  @IsString()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
    description: 'Confirm password user',
  })
  @IsString()
  @IsStrongPassword()
  confirmPassword: string;
}
