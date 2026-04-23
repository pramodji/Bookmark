import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const now = new Date().toISOString()
  
  await prisma.bookmark.createMany({
    data: [
      {
        id: '1',
        title: 'Google',
        url: 'https://google.com',
        description: 'Search engine',
        group: 'Search',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2', 
        title: 'GitHub',
        url: 'https://github.com',
        description: 'Code repository',
        group: 'Development',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '3',
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        description: 'Programming Q&A',
        group: 'Development',
        createdAt: now,
        updatedAt: now
      }
    ]
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })