export interface PaymentDetails {
  cardNumber?: string;
  cvv?: string;
}

export interface IPaymentMethod {
  readonly name: string;
  process(total: number, details: PaymentDetails): Promise<void>;
}
