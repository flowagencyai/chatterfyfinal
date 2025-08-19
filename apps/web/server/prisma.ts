import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __web_prisma: PrismaClient | undefined;
}

if (!global.__web_prisma) {
  global.__web_prisma = new PrismaClient();
}

prisma = global.__web_prisma;

export default prisma;
