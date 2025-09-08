import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  calculateAmount,
  calculateTotalItems,
  formatDate,
  validateIds,
} from './helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import { manejarError } from '@common/utils';
import { PaginationDto } from '@common/dto';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, user_id: string) {
    try {
      const productsIds = createOrderDto.items.map((item) => item.productId);

      const products: any[] = await validateIds(productsIds, this.prisma);

      //Calculate total amout
      const amount = calculateAmount(createOrderDto, products);

      //calculate total items
      const totalItems = calculateTotalItems(createOrderDto);

      //Crear la orden
      await this.prisma.$transaction(async (tx) => {
        const order = await tx.orders.create({
          data: {
            user_id,
            totalAmount: amount,
            totalItems: totalItems,
          },
        });

        await tx.ordersItems.createMany({
          data: createOrderDto.items.map((ordenItem) => ({
            price: products.find(
              (product) => product.id === ordenItem.productId,
            ).price,
            productId: ordenItem.productId,
            quantity: ordenItem.quantity,
            orderId: order.id,
          })),
        });

        return order;
      });

      return {
        mesagge: 'Order created successfully',
        status: HttpStatus.CREATED,
      };
    } catch (error) {
      manejarError(error, 'Error creating order', 'OrdersService-create');
    }
  }

  async findAllOrders(paginationDto: PaginationDto, user_id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
      });

      if (!user) {
        throw new HttpException('User not found', 400);
      }

      const page = paginationDto.page ?? 1;
      const limit = paginationDto.limit ?? 10;
      const totalPages = await this.prisma.orders.count({
        where: { user_id },
      });
      const lastPage = Math.ceil(totalPages / limit);

      const orders = await this.prisma.orders.findMany({
        where: { user_id },
        select: {
          id: true,
          totalAmount: true,
          totalItems: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      const ordersWithDate = orders.map(({ createdAt, ...orders }) => ({
        ...orders,
        fechaCreacion: formatDate(createdAt),
      }));

      return {
        data: ordersWithDate,
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

  async findOneOrder(order_id: number, user_id: string) {
    try {
      const products = await this.prisma.orders.findUnique({
        select: {
          id: true,
          status: true,
          totalAmount: true,
          totalItems: true,
          items: {
            select: {
              id: true,
              product: {
                select: {
                  name: true,
                  brand: true,
                },
              },
              price: true,
              quantity: true,
            },
          },
        },
        where: { id: order_id, user_id },
      });

      const itemsWithNames = products?.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        brand: item.product.brand,
        price: item.price,
        quantity: item.quantity,
      }));

      return {
        ...products,
        items: itemsWithNames, // reemplazamos los items originales por los formateados
      };
    } catch (error) {
      manejarError(
        error,
        'Error al obtener los alimentos',
        'AlimentosService-findAllAlimentos',
      );
    }
  }
}
