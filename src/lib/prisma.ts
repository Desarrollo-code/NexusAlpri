
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Este patrón previene la creación de múltiples instancias de PrismaClient
// en el entorno de desarrollo debido al hot-reloading de Next.js.
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// En desarrollo, el `global.prisma` preservará la instancia entre recargas.
// En producción, siempre se creará una nueva instancia.
const prisma = global.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

    