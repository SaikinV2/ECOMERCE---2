import { injectable } from 'inversify';
import logger from '../lib/logger';
import { IPaymentMethod } from './IPaymentMethod';

@injectable()
export class PixPayment implements IPaymentMethod {
  readonly name = 'pix';

  async process(total: number): Promise<void> {
    logger.info(`Cobrança Pix de R$ ${total} gerada`);
  }
}
