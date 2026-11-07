import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import logger from '../lib/logger';
import { ValidationError } from '../domain/errors';
import { OrderItem, OrderLine } from '../domain/Order';
import { ProductFactory } from '../domain/ProductFactory';
import { IProductRepository } from '../repositories/IProductRepository';
import { IOrderRepository } from '../repositories/IOrderRepository';
import type { IPaymentMethodRegistry } from '../payments/IPaymentMethodRegistry';
import type { PaymentDetails } from '../payments/IPaymentMethod';
import type { NotificationService } from './NotificationService';

@injectable()
export class OrderService {
  constructor(
    @inject(TYPES.ProductRepository) private products: IProductRepository,
    @inject(TYPES.OrderRepository) private orders: IOrderRepository,
    @inject(TYPES.PaymentMethodRegistry) private payments: IPaymentMethodRegistry,
    @inject(TYPES.NotificationService) private notification: NotificationService,
  ) {}

  async placeOrder(customer: string, items: OrderItem[], paymentMethod: string, paymentDetails: PaymentDetails) {
    if (!Array.isArray(items) || items.length === 0) {
      logger.error('Tentativa de pedido sem itens');
      throw new ValidationError('Carrinho vazio');
    }

    if (typeof customer !== 'string' || !customer.trim()) {
      throw new ValidationError('Cliente ausente');
    }
    for (const item of items) {
      if (!item || !Number.isInteger(item.productId) || item.productId <= 0 ||
          !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        throw new ValidationError('Produto e quantidade devem ser inteiros positivos');
      }
    }

    let total = 0;
    const lines: OrderLine[] = [];
    for (const item of items) {
      const data = await this.products.findById(item.productId);
      if (!data) throw new ValidationError(`Produto ${item.productId} não encontrado`);

      const product = ProductFactory.create(data);
      total += product.price * item.quantity + product.calculateFreight();
      lines.push({ productId: product.id, name: product.name, price: product.price, quantity: item.quantity });
    }

    const payment = this.payments.get(paymentMethod);
    if (!payment) throw new ValidationError('Método de pagamento não suportado');
    await payment.process(total, paymentDetails);

    const order = await this.orders.create(customer, lines, total);

    const emailPreview = await this.notification.orderConfirmed(order);
    logger.info(`Email enviado: ${emailPreview}`);

    return { orderId: order.id, total, emailPreview };
  }
}
