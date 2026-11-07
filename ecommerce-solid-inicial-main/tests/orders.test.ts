import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import type { PrismaClient } from '@prisma/client';
import { TYPES } from '../src/container/types';
import type { OrderService } from '../src/services/OrderService';
import type { IOrderRepository } from '../src/repositories/IOrderRepository';
import type { IProductRepository } from '../src/repositories/IProductRepository';
import type { IMailProvider, Mail } from '../src/providers/IMailProvider';
import type { IPaymentMethod } from '../src/payments/IPaymentMethod';

const customer = 'aluno@example.com';
const details = { cardNumber: '1234567812345678', cvv: '123' };

test('container, pedidos e HTTP nos dois modos', async (t) => {
  const originalMode = process.env.APP_ENV;
  process.env.APP_ENV = 'test';
  const { createContainer }: typeof import('../src/container/container') = require('../src/container/container');
  try {
    for (const mode of ['test', 'dev']) {
      await t.test(mode, async (t) => {
        process.env.APP_ENV = mode;
        const container = createContainer();
        const mail = container.get<IMailProvider>(TYPES.MailProvider);
        const orders = container.get<IOrderRepository>(TYPES.OrderRepository);
        const products = container.get<IProductRepository>(TYPES.ProductRepository);
        assert.equal(container.get(TYPES.MailProvider), mail);
        assert.equal(container.get(TYPES.OrderRepository), orders);
        assert.equal(container.get(TYPES.ProductRepository), products);
        assert.deepEqual(container.getAll<IPaymentMethod>(TYPES.PaymentMethod).map(p => p.name),
          ['credit_card', 'debit_card', 'pix']);
        assert.equal(mail.constructor.name, mode === 'test' ? 'ConsoleMailProvider' : 'EtherealMailProvider');
        assert.equal(orders.constructor.name, mode === 'test' ? 'InMemoryOrderRepository' : 'PrismaOrderRepository');
        assert.equal(container.isBound(TYPES.PrismaClient), mode === 'dev');

        // A integração com SMTP é substituída somente neste teste de dev.
        // O serviço, os pagamentos e os repositórios reais continuam intactos.
        const sent: Mail[] = [];
        if (mode === 'dev') {
          container.rebindSync<IMailProvider>(TYPES.MailProvider).toConstantValue({
            async sendMail(message) { sent.push(message); return 'https://example.com/preview'; },
          });
        }
        const service = container.get<OrderService>(TYPES.OrderService);
        const createdIds: number[] = [];
        const prisma = mode === 'dev' ? container.get<PrismaClient>(TYPES.PrismaClient) : undefined;
        try {
          await t.test('totais e todos os pagamentos', async () => {
            for (const payment of ['credit_card', 'debit_card', 'pix']) {
              for (const [productId, total] of [[1, 110], [2, 50]]) {
                const result = await service.placeOrder(customer, [{ productId, quantity: 1 }], payment, details);
                createdIds.push(result.orderId);
                assert.equal(result.total, total);
                assert.equal(result.emailPreview, mode === 'test' ? null : 'https://example.com/preview');
              }
            }
            const mixed = await service.placeOrder(customer,
              [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 3 }], 'pix', {});
            createdIds.push(mixed.orderId);
            assert.equal(mixed.total, 360);
            assert.equal(new Set(createdIds).size, 7);
            if (prisma) {
              const saved = await prisma.order.findUniqueOrThrow({ where: { id: mixed.orderId } });
              assert.equal(saved.total, 360);
              assert.equal(saved.status, 'confirmed');
              assert.equal(JSON.parse(saved.items).length, 2);
              assert.equal(sent.length, 7);
            }
          });
          await t.test('dados inválidos e cartão recusado', async () => {
            await assert.rejects(service.placeOrder(customer, [], 'pix', {}), /Carrinho vazio/);
            await assert.rejects(service.placeOrder('', [{ productId: 1, quantity: 1 }], 'pix', {}), /Cliente ausente/);
            await assert.rejects(service.placeOrder(customer, [{ productId: 999, quantity: 1 }], 'pix', {}), /não encontrado/);
            for (const quantity of [0, -1, 1.5]) {
              await assert.rejects(service.placeOrder(customer, [{ productId: 1, quantity }], 'pix', {}), /inteiros positivos/);
            }
            await assert.rejects(service.placeOrder(customer, [{ productId: 1, quantity: 1 }], 'boleto', {}), /não suportado/);
            await assert.rejects(service.placeOrder(customer, [{ productId: 1, quantity: 1 }], 'credit_card', {}), /ausentes/);
            await assert.rejects(service.placeOrder(customer, [{ productId: 1, quantity: 1 }], 'credit_card', { ...details, cvv: '000' }), /recusado/);
          });
        } finally {
          if (prisma) {
            await prisma.order.deleteMany({ where: { id: { in: createdIds } } });
            await prisma.$disconnect();
          }
        }
      });
    }
    await t.test('API HTTP em test sem banco nem SMTP', async () => {
      process.env.APP_ENV = 'test';
      const { default: app }: typeof import('../src/app') = require('../src/app');
      const server = app.listen(0, '127.0.0.1');
      try {
        await once(server, 'listening');
        const address = server.address();
        assert.ok(address && typeof address !== 'string');
        const url = 'http://127.0.0.1:' + address.port + '/orders';
        const post = (body: unknown) => fetch(url, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        const response = await post({ customer, items: [{ productId: 1, quantity: 1 }], paymentMethod: 'pix' });
        assert.equal(response.status, 200);
        const result = await response.json() as { total: number; emailPreview: null };
        assert.equal(result.total, 110);
        assert.equal(result.emailPreview, null);
        assert.equal((await post({ customer, items: [] })).status, 400);
        assert.equal((await post({ customer, items: [{ productId: 1, quantity: 1 }],
          paymentMethod: 'credit_card', paymentDetails: { ...details, cvv: '000' } })).status, 400);
      } finally {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      }
    });
    await t.test('modo inválido falha com mensagem clara', () => {
      process.env.APP_ENV = 'invalid';
      assert.throws(() => createContainer(), /APP_ENV deve ser dev ou test/);
    });
  } finally {
    if (originalMode === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = originalMode;
  }
});
