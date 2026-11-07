import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { Request, Response } from 'express';
import logger from '../lib/logger';
import { PaymentError, ValidationError } from '../domain/errors';
import type { OrderService } from '../services/OrderService';

@injectable()
export class OrderController {
  constructor(@inject(TYPES.OrderService) private orderService: OrderService) {}

  processOrder = async (req: Request, res: Response) => {
    try {
      const { customer, items, paymentMethod, paymentDetails } = req.body ?? {};
      const result = await this.orderService.placeOrder(customer, items, paymentMethod, paymentDetails);
      return res.json({ message: 'Pedido processado com sucesso', ...result });
    } catch (error: unknown) {
      if (error instanceof ValidationError || error instanceof PaymentError) {
        return res.status(400).json({ error: error.message });
      }
      logger.error(`Erro ao processar pedido: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({ error: 'Erro interno' });
    }
  };
}
