import { injectable } from 'inversify';
import logger from '../lib/logger';
import { PaymentError, ValidationError } from '../domain/errors';
import { IPaymentMethod, PaymentDetails } from './IPaymentMethod';

@injectable()
export class CreditCardPayment implements IPaymentMethod {
  readonly name = 'credit_card';

  async process(total: number, details: PaymentDetails): Promise<void> {
    if (typeof details?.cardNumber !== 'string' || !details.cardNumber.trim() || typeof details?.cvv !== 'string' || !details.cvv.trim()) throw new ValidationError('Dados do cartão ausentes');

    logger.info(`Crédito de R$ ${total} no cartão final ${details.cardNumber.slice(-4)}`);
    if (details.cvv === '000') throw new PaymentError('Cartão recusado');
  }
}
