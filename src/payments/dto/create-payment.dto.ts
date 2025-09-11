import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'Order ID' })
  @IsNumber()
  @IsPositive()
  orderId: number;

  @ApiProperty({ example: 'USD', description: 'Currency' })
  @IsString()
  @IsIn([
    'AUD',
    'BRL',
    'CAD',
    'CNY',
    'CZK',
    'DKK',
    'EUR',
    'HKD',
    'HUF',
    'ILS',
    'JPY',
    'MYR',
    'MXN',
    'TWD',
    'NZD',
    'NOK',
    'PHP',
    'PLN',
    'GBP',
    'SGD',
    'SEK',
    'CHF',
    'THB',
    'USD',
  ])
  currency: string;
}
