// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Este patrón previene la creación de múltiples instancias de PrismaClient en desarrollo (hot-reloading)
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = global.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
