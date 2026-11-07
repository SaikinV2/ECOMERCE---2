import { IProduct } from './IProduct';

export class DigitalProduct implements IProduct {
  constructor(public id: number, public name: string, public price: number) {}

  calculateFreight(): number {
    return 0;
  }
}
