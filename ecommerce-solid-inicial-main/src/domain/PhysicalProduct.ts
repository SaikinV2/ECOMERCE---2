import { IProduct } from './IProduct';

export class PhysicalProduct implements IProduct {
  constructor(public id: number, public name: string, public price: number) {}

  calculateFreight(): number {
    return 10;
  }
}
