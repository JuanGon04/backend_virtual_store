import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ example: 1, description: 'Number of page' })
  @IsPositive()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  @IsPositive()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
