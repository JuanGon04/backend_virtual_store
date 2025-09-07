import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ example: 'Nuevo nombre del producto' })
  name?: string;

  @ApiPropertyOptional({ example: 3000 })
  price?: number;

  @ApiPropertyOptional({ example: 150 })
  inputs?: number;

  @ApiPropertyOptional({ example: 'Lenovo' })
  brand?: string;

  @ApiPropertyOptional({ example: 'Actualización de descripción' })
  description?: string;
}
