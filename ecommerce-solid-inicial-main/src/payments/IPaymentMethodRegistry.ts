import type { IPaymentMethod } from './IPaymentMethod';

export interface IPaymentMethodRegistry {
  get(name: string): IPaymentMethod | undefined;
}
