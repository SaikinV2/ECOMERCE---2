export interface OrderItem {
  productId: number;
  quantity: number;
}

export interface OrderLine {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  customer: string;
  items: OrderLine[];
  total: number;
  status: string;
}
