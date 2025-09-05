import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './dto';
import { manejarError } from '@common/utils';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  onModuleInit() {
    this.$connect();
  }

  async create(createProductDto: CreateProductDto, user_id: string) {
    const { inputs, ...restoDatos } = createProductDto;
    const user = await this.user.findUnique({
      where: { id: user_id },
      select: { rol: true },
    });
    if (!user?.rol || user.rol !== 'admin') {
      const userNotFound = !user;
      throw new HttpException(
        userNotFound ? 'User not found' : 'Unauthorized',
        userNotFound ? HttpStatus.NOT_FOUND : HttpStatus.UNAUTHORIZED,
      );
    }
    try {
      await this.product.create({
        data: {
          inputs: inputs,
          stock: inputs,
          ...restoDatos,
        },
      });

      return {
        message: 'Product created successfully',
        status: HttpStatus.CREATED,
      };
    } catch (error) {
      manejarError(
        error,
        'Error creating product',
        'ProductsService-create',
      );
    }
  }

  findAllProducts() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
