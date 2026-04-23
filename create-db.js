const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating database...');
  await prisma.$connect();
  console.log('Database created successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());