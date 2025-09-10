import { HttpException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export async function validateIds(ids: number[], prisma: PrismaClient) {
  ids = Array.from(new Set(ids));

  const productsIds = await prisma.product.findMany({
    where: {
      id: {
        in: ids,
      },
      isActive: true
    },
    select: {
      id: true,
      price: true,
    },
  });

  if (productsIds.length !== ids.length) {
    throw new HttpException('Some products were not found', 400);
  }

  return productsIds;
}
