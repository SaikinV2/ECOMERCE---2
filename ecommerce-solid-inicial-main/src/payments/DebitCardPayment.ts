import { injectable } from 'inversify';
import logger from '../lib/logger';
import { ValidationError } from '../domain/errors';
import { IPaymentMethod, PaymentDetails } from './IPaymentMethod';

@injectable()
export class DebitCardPayment implements IPaymentMethod {
  readonly name = 'debit_card';

  async process(total: number, details: PaymentDetails): Promise<void> {
    if (typeof details?.cardNumber !== 'string' || !details.cardNumber.trim()) throw new ValidationError('Dados do cartão ausentes');

    logger.info(`Débito de R$ ${total} no cartão final ${details.cardNumber.slice(-4)}`);
  }
}
