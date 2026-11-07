import 'reflect-metadata';
import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { TYPES } from './types';
import type { IProductRepository } from '../repositories/IProductRepository';
import type { IOrderRepository } from '../repositories/IOrderRepository';
import type { IMailProvider } from '../providers/IMailProvider';
import type { IPaymentMethod } from '../payments/IPaymentMethod';
import { PrismaProductRepository } from '../repositories/PrismaProductRepository';
import { PrismaOrderRepository } from '../repositories/PrismaOrderRepository';
import { InMemoryProductRepository } from '../repositories/InMemoryProductRepository';
import { InMemoryOrderRepository } from '../repositories/InMemoryOrderRepository';
import { EtherealMailProvider } from '../providers/EtherealMailProvider';
import { ConsoleMailProvider } from '../providers/ConsoleMailProvider';
import { CreditCardPayment } from '../payments/CreditCardPayment';
import { DebitCardPayment } from '../payments/DebitCardPayment';
import { PixPayment } from '../payments/PixPayment';
import { PaymentMethodRegistry } from '../payments/PaymentMethodRegistry';
import { NotificationService } from '../services/NotificationService';
import { OrderService } from '../services/OrderService';
import { OrderController } from '../controllers/OrderController';

export function createContainer(): Container {
  const mode = process.env.APP_ENV ?? 'dev';
  if (mode !== 'dev' && mode !== 'test') {
    throw new Error('APP_ENV deve ser dev ou test');
  }
  const container = new Container();
  if (mode === 'test') {
    container.bind<IProductRepository>(TYPES.ProductRepository).to(InMemoryProductRepository).inSingletonScope();
    container.bind<IOrderRepository>(TYPES.OrderRepository).to(InMemoryOrderRepository).inSingletonScope();
    container.bind<IMailProvider>(TYPES.MailProvider).to(ConsoleMailProvider).inSingletonScope();
  } else {
    container.bind<PrismaClient>(TYPES.PrismaClient).toDynamicValue(() => new PrismaClient()).inSingletonScope();
    container.bind<IProductRepository>(TYPES.ProductRepository).to(PrismaProductRepository).inSingletonScope();
    container.bind<IOrderRepository>(TYPES.OrderRepository).to(PrismaOrderRepository).inSingletonScope();
    container.bind<IMailProvider>(TYPES.MailProvider).to(EtherealMailProvider).inSingletonScope();
  }
  container.bind<IPaymentMethod>(TYPES.PaymentMethod).to(CreditCardPayment);
  container.bind<IPaymentMethod>(TYPES.PaymentMethod).to(DebitCardPayment);
  container.bind<IPaymentMethod>(TYPES.PaymentMethod).to(PixPayment);
  container.bind<PaymentMethodRegistry>(TYPES.PaymentMethodRegistry).to(PaymentMethodRegistry);
  container.bind<NotificationService>(TYPES.NotificationService).to(NotificationService);
  container.bind<OrderService>(TYPES.OrderService).to(OrderService);
  container.bind<OrderController>(TYPES.OrderController).to(OrderController);
  return container;
}

export const container = createContainer();
