import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsPositive } from "class-validator";

export class OrderItemDto {

    @ApiProperty({ example: 1, description: 'Product ID' })
    @IsNumber()
    @IsPositive()
    productId: number;

    @ApiProperty({ example: 2, description: 'Product quantity' })
    @IsNumber()
    @IsPositive()
    quantity: number;

}
