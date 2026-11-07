import { injectable, multiInject } from 'inversify';
import { TYPES } from '../container/types';
import type { IPaymentMethod } from './IPaymentMethod';

import type { IPaymentMethodRegistry } from './IPaymentMethodRegistry';

@injectable()
export class PaymentMethodRegistry implements IPaymentMethodRegistry {
  constructor(@multiInject(TYPES.PaymentMethod) private methods: IPaymentMethod[]) {}

  get(name: string): IPaymentMethod | undefined {
    return this.methods.find((method) => method.name === name);
  }
}
