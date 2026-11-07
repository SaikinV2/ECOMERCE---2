# E-commerce SOLID — Projeto 2

Este é o e-commerce do Projeto 1 já refatorado (SRP, OCP e LSP). Ele é o ponto de partida deste trabalho.

## Como rodar

```bash
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

A API sobe em `http://localhost:3000`. Teste com:

```bash
curl -X POST http://localhost:3000/orders \
-H "Content-Type: application/json" \
-d '{
  "customer": "cliente@ethereal.email",
  "items": [{ "productId": 1, "quantity": 1 }],
  "paymentMethod": "credit_card",
  "paymentDetails": { "cardNumber": "1234567812345678", "cvv": "123" }
}'
```

Produto `1` é o livro físico (R$ 100 + R$ 10 de frete), produto `2` é o e-book (R$ 50, sem frete). Formas de pagamento: `credit_card`, `debit_card` e `pix`.

## Estrutura

```
src/
├── domain/        # produtos, pedido e erros de negócio
├── repositories/  # IOrderRepository, IProductRepository e as versões Prisma
├── providers/     # IMailProvider e EtherealMailProvider
├── payments/      # IPaymentMethod, uma classe por forma de pagamento e o registro
├── services/      # OrderService e NotificationService
├── controllers/   # OrderController: só HTTP
└── app.ts         # monta as dependências na mão
```

Os services recebem tudo pelo construtor, e as classes concretas só aparecem no `app.ts`.

---

## Trabalho

Hoje a montagem é feita na mão, com `new`, no `app.ts`. Troque isso por um container de IoC, o **InversifyJS**, e prove que a infraestrutura pode ser trocada sem tocar na regra de negócio.

### 1. Configure o Inversify

```bash
npm install inversify@7 reflect-metadata
```

No `tsconfig.json`, em `compilerOptions`: `"experimentalDecorators": true` e `"emitDecoratorMetadata": true`.
Na primeira linha do `src/server.ts`: `import 'reflect-metadata';`

> Use a versão 7. A 8 não compila com este `tsconfig`.

### 2. Registre as dependências

* Crie `src/container/types.ts` com um `Symbol` para cada dependência (`TYPES.MailProvider`, `TYPES.OrderRepository`...).
* Coloque `@injectable()` em toda classe que entra no container.
* Coloque `@inject(TYPES.X)` em **todo** parâmetro de construtor, inclusive os de classe concreta.

> O projeto roda com `tsx`, que não gera metadados de tipo. Sem o `@inject` em cada parâmetro, a aplicação cai com `Found unexpected missing metadata`.

* As formas de pagamento são registradas todas com o mesmo identificador e chegam ao `PaymentMethodRegistry` por `@multiInject(TYPES.PaymentMethod)`.
* Provider de e-mail e repositórios são singleton (`inSingletonScope()`).

### 3. Crie um segundo modo de execução

Instale o `dotenv`, importe `dotenv/config` no `server.ts` e copie o `.env.example` para `.env`. O container lê o `APP_ENV` e decide o que injetar:

| | `APP_ENV=dev` | `APP_ENV=test` |
|---|---|---|
| E-mail | `EtherealMailProvider` | `ConsoleMailProvider`, que imprime o e-mail no console |
| Pedidos | `PrismaOrderRepository` | `InMemoryOrderRepository`, que guarda os pedidos num array |

As duas classes do modo `test` são suas. Nesse modo, a aplicação tem de funcionar **sem internet**.
### 4. Monte tudo num lugar só

`src/container/container.ts` passa a ser o **único arquivo** que importa classes concretas e faz `new` de repositório, provider, pagamento, service ou controller. O `app.ts` só pede o `OrderController` ao container e registra a rota.

### Critérios de aceite

1. Clonar, instalar, migrar, popular e rodar funcionam sem erro.
2. Os produtos `1` e `2` dão o total certo nos dois modos.
3. Trocar de modo exige mudar só o `APP_ENV`.
4. A escolha do modo acontece só no `container.ts`: nenhum arquivo de `services/` ou `controllers/` lê o `APP_ENV` nem importa Prisma, Nodemailer ou uma implementação de repositório, provider ou pagamento.
5. Uma seção **"Como rodar"** no seu README explica os dois modos.

### Entrega

Pelo git. Informe na caixa de texto do AVA o link do repositório. Ele não pode estar privado: teste antes de entregar.
