import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard, AuthGuard } from '@common/guards';
import { User } from '@common/decorators';
import { PaginationDto } from '@common/dto';
import { CreateProductDto, UpdateProductDto } from './dto';
import { CurrentUser } from '@common/interfaces';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(AuthGuard, AdminGuard)
  @ApiCookieAuth('jwt')
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 401, description: 'Expired or invalid token' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  create(
    @Body() createProductDto: CreateProductDto,
    @User() user: CurrentUser,
  ) {
    return this.productsService.create(createProductDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List all products' })
  findAllProducts(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAllProducts(paginationDto);
  }

  @Get('query')
  @ApiOperation({ summary: 'Get products with pagination and filtering' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiResponse({ status: 200, description: 'List all products matching the query' })
  findAllProductsQuery(@Query('query') query: string) {
    return this.productsService.findAllProductsQuery(query);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @ApiCookieAuth('jwt')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product for ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product no found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 401, description: 'Expired or invalid token' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @ApiCookieAuth('jwt')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product for ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product no found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 401, description: 'Expired or invalid token' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
