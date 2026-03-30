import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/mydb";

try {
  console.log("Attempting new PrismaClient({ adapter: ... })");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  console.log("Success with adapter!");
} catch (e) {
  console.error("Failed with adapter:", e);
}
