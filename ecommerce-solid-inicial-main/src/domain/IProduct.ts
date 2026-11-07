export interface IProduct {
  id: number;
  name: string;
  price: number;
  calculateFreight(): number;
}

export interface ProductData {
  id: number;
  name: string;
  type: string;
  price: number;
}
