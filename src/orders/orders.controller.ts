import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto';
import { User } from '@common/decorators';
import { CurrentUser } from '@common/interfaces';
import { AuthGuard } from '@common/guards';
import { PaginationDto } from '@common/dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @User() user: CurrentUser) {
    return this.ordersService.create(createOrderDto, user.id);
  }

  @UseGuards(AuthGuard)
  @Get()
  @ApiCookieAuth('jwt')
  @ApiOperation({ summary: 'Get all orders with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List all orders' })
  findAllOrders(
    @Query() paginationDto: PaginationDto,
    @User() user: CurrentUser,
  ) {
    return this.ordersService.findAllOrders(paginationDto, user.id);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOneOrder(@Param('id', ParseIntPipe) id: number, @User() user: CurrentUser) {
    return this.ordersService.findOneOrder(id, user.id);
  }

}
