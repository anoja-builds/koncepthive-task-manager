import "dotenv/config";
import { hash } from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from backend/.env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@test.com",
    },
    update: {
      name: "Admin User",
      password: hashedPassword,
    },
    create: {
      name: "Admin User",
      email: "admin@test.com",
      password: hashedPassword,
    },
  });

  console.log(`Admin user ready: ${admin.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error("Database seed failed:", error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });