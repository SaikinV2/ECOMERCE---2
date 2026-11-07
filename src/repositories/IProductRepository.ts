import { ProductData } from '../domain/IProduct';

export interface IProductRepository {
  findById(id: number): Promise<ProductData | null>;
}
