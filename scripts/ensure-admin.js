const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log('Users already exist, skipping admin seed.');
    return;
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  await prisma.user.create({
    data: {
      id: 'admin-default',
      username,
      password: hash,
      role: 'admin',
      approved: true,
      createdAt: new Date().toISOString(),
    },
  });
  console.log(`Created default admin user: ${username}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
