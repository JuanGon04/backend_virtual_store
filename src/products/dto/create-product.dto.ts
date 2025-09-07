import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop Gamer', description: 'Nombre del producto' })
  @IsString()
  @Type(() => String)
  name: string;

  @ApiProperty({ example: 2500, description: 'Precio en USD' })
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 100, description: 'Cantidad de entradas disponibles' })
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  inputs: number;

  @ApiProperty({ example: 'Asus', description: 'Marca del producto', default: 'Generica' })
  @IsString()
  @Type(() => String)
  brand?: string = 'Generica';

  @ApiProperty({ example: 'Laptop de alto rendimiento', required: false })
  @IsOptional()
  @IsString()
  @Type(() => String)
  description?: string;
}
