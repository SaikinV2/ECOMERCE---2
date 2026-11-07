import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { PrismaClient } from '@prisma/client';
import { Order, OrderLine } from '../domain/Order';
import { IOrderRepository } from './IOrderRepository';

@injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  async create(customer: string, items: OrderLine[], total: number): Promise<Order> {
    const row = await this.prisma.order.create({
      data: { customer, items: JSON.stringify(items), total, status: 'confirmed' },
    });
    return { id: row.id, customer: row.customer, items, total: row.total, status: row.status };
  }
}
