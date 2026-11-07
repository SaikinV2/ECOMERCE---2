import { injectable } from 'inversify';
import type { ProductData } from '../domain/IProduct';
import type { IProductRepository } from './IProductRepository';

@injectable()
export class InMemoryProductRepository implements IProductRepository {
  private readonly products: ProductData[] = [
    { id: 1, name: 'O Programador Pragmático (Livro Físico)', type: 'physical', price: 100 },
    { id: 2, name: 'Clean Code (E-book)', type: 'digital', price: 50 },
  ];

  async findById(id: number): Promise<ProductData | null> {
    const product = this.products.find((item) => item.id === id);
    return product ? { ...product } : null;
  }
}
