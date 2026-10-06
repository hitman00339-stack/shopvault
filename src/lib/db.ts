// ─── Prisma Client Singleton ───
// Prevents multiple Prisma instances in development (hot reload safe)

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Always cache singleton to reuse connection in serverless lambdas
globalForPrisma.prisma = prisma;

// ─── Helper: Safe database connection test ───
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

export default prisma;