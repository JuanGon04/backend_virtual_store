import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './dto';
import { limpiarEspacios, manejarError } from '@common/utils';
import { PaginationDto } from '@common/dto';

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
      manejarError(error, 'Error creating product', 'ProductsService-create');
    }
  }

  async findAllProducts(paginationDto: PaginationDto) {
    try {
      const page = paginationDto.page ?? 1;
      const limit = paginationDto.limit ?? 10;
      const totalPages = await this.product.count();
      const lastPage = Math.ceil(totalPages / limit);

      const productos = await this.product.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          brand: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: productos,
        meta: {
          total_page: Math.ceil(totalPages / limit),
          page: page,
          lastPage: lastPage,
        },
      };
    } catch (error) {
      manejarError(error, 'Error getting products', 'ProductsService-findAll');
    }
  }

  async findAllProductsQuery(query: string) {
    try {
      const palabras = limpiarEspacios(query).split(' ');
      // Filtro para nombre
      const filterName = palabras.map((palabra) => ({
        name: {
          contains: palabra,
        },
      }));

      // Filtro para marca
      const filterBrand = palabras.map((palabra) => ({
        brand: {
          contains: palabra,
        },
      }));

      const productos = await this.product.findMany({
        where: {
          AND: [{ OR: filterName }, { OR: filterBrand }],
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          brand: true,
        },
        take: 10,
      });

      return productos;
    } catch (error) {
      manejarError(
        error,
        'Error al obtener los productos',
        'ProductsService-findAllProductsQuery',
      );
    }
  }

  async findOne(id: number) {
    const producto = await this.product.findFirst({
      where: { id },
    });

    if (!producto) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return producto;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { inputs } = updateProductDto;
    const producto = await this.findOne(id);
    let stock: number = producto.stock;

    // Validar si se están actualizando los inputs y ajustar el stock en consecuencia
    if (inputs && inputs !== producto.inputs) {
      stock = stock + (inputs - producto.inputs);
    }

    try {
      await this.product.update({
        where: { id },
        data: { ...updateProductDto, stock },
      });
    } catch (error) {
      manejarError(error, 'Error updating product', 'ProductsService-update');
    }

    return {
      message: 'Product updated successfully',
      status: HttpStatus.NO_CONTENT,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.product.delete({
        where: { id },
      });
      return {
        message: 'Product deleted successfully',
        status: HttpStatus.NO_CONTENT,
      };
    } catch (error) {
      manejarError(error, 'Error deleting product', 'ProductsService-remove');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
