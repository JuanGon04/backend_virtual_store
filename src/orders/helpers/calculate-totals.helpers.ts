import { CreateOrderDto } from '../dto';

export function calculateAmount(
  createOrderDto: CreateOrderDto,
  products: { id: number; price: number }[],
) {
  const amount = createOrderDto.items.reduce((acc, orderItem) => {
    const price = products.find(
      (product) => product.id === orderItem.productId,
    )?.price;

    return acc + (price ?? 0) * orderItem.quantity;
  }, 0);

  return amount;
}

export function calculateTotalItems(createOrderDto: CreateOrderDto) {
  const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
    return acc + orderItem.quantity;
  }, 0);

  return totalItems;
}
