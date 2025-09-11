import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './dto';
import { manejarError } from '@common/utils';
import { PaginationDto } from '@common/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisCacheService } from 'src/cache-redis/cache-redis.service';
import { formatQuery } from './helpers';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheServer: RedisCacheService,
  ) {}

  async create(createProductDto: CreateProductDto, user_id: string) {
    const { inputs, ...restoDatos } = createProductDto;
    const user = await this.prisma.user.findUnique({
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
      await this.prisma.product.create({
        data: {
          inputs: inputs,
          stock: inputs,
          ...restoDatos,
        },
      });

      //Invalidar caché
      await this.cacheServer.delByPattern('products:*');

      return {
        message: 'Product created successfully',
        status: HttpStatus.CREATED,
      };
    } catch (error) {
      manejarError(
        error,
        `Error creating product ${error}`,
        'ProductsService-create',
      );
    }
  }

  async findAllProducts(paginationDto: PaginationDto) {
    try {
      const page = paginationDto.page ?? 1;
      const limit = paginationDto.limit ?? 10;
      const totalPages = await this.prisma.product.count({
        where: { isActive: true },
      });
      const lastPage = Math.ceil(totalPages / limit);

      const cacheKey = `products:page:${page}:limit:${limit}`;

      //Consumir el caché si hay datos
      const cached = await this.cacheServer.get(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      const productos = await this.prisma.product.findMany({
        where: { isActive: true },
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

      const response = {
        data: productos,
        meta: {
          total_page: Math.ceil(totalPages / limit),
          page: page,
          lastPage: lastPage,
        },
      };

      //Guardar datos en  caché
      await this.cacheServer.set(cacheKey, response);

      return response;
    } catch (error) {
      manejarError(error, 'Error getting products', 'ProductsService-findAll');
    }
  }

  async findAllProductsQuery(query: string) {
    try {
      const palabrasFiltradas = formatQuery(query);

      // Filtro para nombre
      const filterName = palabrasFiltradas.map((palabra) => ({
        name: {
          contains: palabra,
        },
      }));

      // Filtro para marca
      const filterBrand = palabrasFiltradas.map((palabra) => ({
        OR: [{ brand: { contains: palabra } }],
      }));

      //await this.cacheServer.del('products:query:[limon,marca,generica]')

      const cacheKey = `products:query:[${palabrasFiltradas.filter((word) => word.length > 3)}]`;
      //Consumir el caché si hay datos
      const cached = await this.cacheServer.get(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      const productos = await this.prisma.product.findMany({
        where: {
          AND: [{ OR: filterName }, { OR: filterBrand }],
          isActive: true,
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

      const response = {
        data: productos,
      };

      //Guardar datos en  caché
      await this.cacheServer.set(cacheKey, response);

      return response;
    } catch (error) {
      manejarError(
        error,
        'Error al obtener los productos',
        'ProductsService-findAllProductsQuery',
      );
    }
  }

  async findOne(id: number) {
    const producto = await this.prisma.product.findFirst({
      where: { id, isActive: true },
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
      await this.prisma.product.update({
        where: { id },
        data: { ...updateProductDto, stock },
      });
    } catch (error) {
      manejarError(error, 'Error updating product', 'ProductsService-update');
    }

    //Invalidar caché
    await this.cacheServer.delByPattern('products:*');

    return {
      message: 'Product updated successfully',
      status: HttpStatus.NO_CONTENT,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.prisma.product.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      //Invalidar caché
      await this.cacheServer.delByPattern('products:*');

      return {
        message: 'Product deleted successfully',
        status: HttpStatus.NO_CONTENT,
      };
    } catch (error) {
      manejarError(error, 'Error deleting product', 'ProductsService-remove');
    }
  }
}
