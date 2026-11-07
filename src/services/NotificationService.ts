import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { Order } from '../domain/Order';
import { IMailProvider } from '../providers/IMailProvider';

@injectable()
export class NotificationService {
  constructor(@inject(TYPES.MailProvider) private mailProvider: IMailProvider) {}

  orderConfirmed(order: Order): Promise<string | null> {
    return this.mailProvider.sendMail({
      to: order.customer,
      subject: `Confirmação do Pedido #${order.id}`,
      text: `Olá, seu pedido #${order.id} no valor de R$ ${order.total} foi confirmado.`,
      html: `
        <h1>Pedido Confirmado!</h1>
        <p>Olá, seu pedido <b>#${order.id}</b> foi processado com sucesso.</p>
        <p>Total: <strong>R$ ${order.total}</strong></p>
        <ul>
          ${order.items.map((item) => `<li>${item.name}</li>`).join('')}
        </ul>
      `,
    });
  }
}
