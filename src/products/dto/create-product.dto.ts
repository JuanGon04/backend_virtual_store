import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Type(() => String)
  name: string;

  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  inputs: number;

  @IsString()
  @Type(() => String)
  brand?: string = 'Generic';

  @IsOptional()
  @IsString()
  @Type(() => String)
  description?: string;
}
