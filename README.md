# E-commerce SOLID — Projeto 2

API de pedidos em **TypeScript**, com InversifyJS **7**, Express, Prisma/SQLite e injeção de dependências. A infraestrutura pode ser trocada alterando apenas o APP_ENV, sem mudar a regra de negócio.

## Como rodar

Requisitos: Node.js 20.19+ ou 22.12+ e npm. Execute os comandos na pasta que contém este README e o package.json. A instalação inicial precisa de internet.

### Preparação

```bash
npm install
```

Copie .env.example para .env:

```bash
# Linux/macOS
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Se o PowerShell bloquear o npm.ps1 pela política de scripts, use npm.cmd no lugar de npm nos comandos abaixo.

### Modo dev: SQLite e Ethereal

Defina no .env:

```dotenv
APP_ENV=dev
```

```bash
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

A API fica em **http://localhost:3000**. Os pedidos são persistidos no SQLite (prisma/dev.db). O Ethereal cria uma conta de teste e retorna o endereço de visualização do e-mail em emailPreview. É necessário acesso à internet e ao SMTP do Ethereal. Os pagamentos são simulações didáticas, como no projeto original.

### Modo test: totalmente em memória

Altere somente o .env e reinicie o servidor:

```dotenv
APP_ENV=test
```

```bash
npm run dev
```

Após a instalação das dependências, esse modo funciona **sem internet, migração ou seed**. Produtos e pedidos ficam em memória; o e-mail completo é impresso no console, e emailPreview é null. Os pedidos são perdidos ao reiniciar o processo. Nenhum PrismaClient é instanciado nesse modo.

APP_ENV ausente usa dev; valores diferentes de dev e test interrompem a inicialização com uma mensagem clara. Se APP_ENV estiver definido no terminal, ele prevalece sobre o .env por padrão do dotenv.

## Testar a API

Exemplo em PowerShell, utilizável nos dois modos:

```powershell
$pedido = @{
  customer = 'cliente@example.com'
  items = @(@{ productId = 1; quantity = 1 })
  paymentMethod = 'credit_card'
  paymentDetails = @{ cardNumber = '1234567812345678'; cvv = '123' }
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Uri http://localhost:3000/orders -Method Post -ContentType 'application/json' -Body $pedido
```

Exemplo com curl no Linux/macOS:

```bash
curl -X POST http://localhost:3000/orders \
  -H 'Content-Type: application/json' \
  -d '{"customer":"cliente@example.com","items":[{"productId":1,"quantity":1}],"paymentMethod":"pix","paymentDetails":{}}'
```

Resposta esperada em test para ambos os exemplos, em uma execução nova:

```json
{
  "message": "Pedido processado com sucesso",
  "orderId": 1,
  "total": 110,
  "emailPreview": null
}
```

| Produto | Preço unitário | Frete por linha do pedido | Total com quantidade 1 |
| --- | ---: | ---: | ---: |
| 1 — O Programador Pragmático (livro físico) | R$ 100 | R$ 10 | R$ 110 |
| 2 — Clean Code (e-book) | R$ 50 | R$ 0 | R$ 50 |

Um de cada custa R$ 160. Duas unidades do livro e três do e-book custam R$ 360. O cálculo preserva a regra original: preço multiplicado pela quantidade, mais um frete por linha.

Formas de pagamento: credit_card (cardNumber e cvv), debit_card (cardNumber) e pix (sem dados adicionais). O CVV 000 simula cartão de crédito recusado. Carrinho vazio, produto inexistente, quantidade inválida, cliente ausente e pagamento inválido retornam HTTP 400.

## Arquitetura e requisitos atendidos

| Dependência | APP_ENV=dev | APP_ENV=test |
| --- | --- | --- |
| E-mail | EtherealMailProvider | ConsoleMailProvider |
| Pedidos | PrismaOrderRepository | InMemoryOrderRepository |
| Produtos | PrismaProductRepository | InMemoryProductRepository |

- src/container/types.ts define os identificadores Symbol.
- src/container/container.ts é o ponto único de composição: seleciona o modo, importa as implementações e registra todas as dependências.
- Todas as classes resolvidas pelo container têm @injectable(). Todos os parâmetros de seus construtores têm @inject(TYPES.X), inclusive dependências de classes concretas. O registro de pagamentos usa @multiInject(TYPES.PaymentMethod).
- Os três pagamentos usam o mesmo identificador. Providers e repositórios são singleton; o PrismaClient também é singleton e só é criado sob demanda em dev.
- app.ts resolve o OrderController e registra a rota. Services e controllers não consultam APP_ENV nem importam Prisma, Nodemailer ou implementações de repositórios/providers/pagamentos em tempo de execução.
- server.ts começa com reflect-metadata e carrega dotenv/config antes da aplicação. Os decorators e os metadados estão habilitados no tsconfig.json. allowJs está desativado.
- O domínio preserva a separação entre produtos físicos e digitais, a fábrica de produtos e as regras SOLID existentes.

## Verificações automatizadas

Prepare o banco de desenvolvimento uma vez para os testes de integração:

```bash
npm run prisma:migrate
npm run prisma:seed
npm run typecheck
npm test
npm run build
```

A suíte em tests/orders.test.ts cobre os totais dos dois produtos nos dois modos, os três pagamentos, pedido misto, singletons, escolha de implementações, persistência no SQLite, validações, cartão recusado, modo inválido e a rota HTTP em test. Os pedidos criados pelos testes de dev são removidos ao final.

No teste automatizado de dev, apenas o provider de e-mail é substituído por um objeto em memória para evitar dependência de SMTP. O Ethereal real é usado normalmente ao executar a aplicação com APP_ENV=dev. O teste HTTP em test usa apenas a conexão local e não faz chamadas externas.

Para executar a versão compilada após o build:

```bash
npm start
```

## Entrega pelo Git

O enunciado original está em [docs/ENUNCIADO.md](docs/ENUNCIADO.md). Publique este projeto em um repositório **público** e informe o link no AVA, conforme solicitado. Confira o acesso ao link em uma janela anônima antes de entregar. Não versione .env, node_modules, dist, logs ou o banco local; o .gitignore já exclui esses arquivos.
