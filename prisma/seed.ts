/**
 * Seed akun CREATOR dan APPROVER.
 * Jalankan: pnpm prisma db seed  atau  pnpm run db:seed
 */
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 10,
  allowPublicKeyRetrieval: true,
});
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  {
    email: 'creator@dot-id.local',
    name: 'Creator',
    password: 'creator123',
    role: 'CREATOR' as const,
  },
  {
    email: 'approver@dot-id.local',
    name: 'Approver',
    password: 'approver123',
    role: 'APPROVER' as const,
  },
];

async function main() {
  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        name: u.name,
        password: passwordHash,
        role: u.role,
      },
      update: {
        name: u.name,
        password: passwordHash,
        role: u.role,
      },
    });
    console.log(`Seeded: ${u.role} ${u.email}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
