import { injectable } from 'inversify';
import type { Order, OrderLine } from '../domain/Order';
import type { IOrderRepository } from './IOrderRepository';

@injectable()
export class InMemoryOrderRepository implements IOrderRepository {
  private readonly orders: Order[] = [];

  async create(customer: string, items: OrderLine[], total: number): Promise<Order> {
    const order: Order = {
      id: this.orders.length + 1, customer, items: structuredClone(items), total, status: 'confirmed',
    };
    this.orders.push(order);
    return structuredClone(order);
  }
}
