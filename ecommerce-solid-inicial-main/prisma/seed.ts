import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'O Programador Pragmático (Livro Físico)',
      type: 'physical',
      price: 100.0,
    },
  })

  await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Clean Code (E-book)',
      type: 'digital',
      price: 50.0,
    },
  })

  console.log('Seed realizado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })