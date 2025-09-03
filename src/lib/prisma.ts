// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `globalThis` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const prismaClientSingleton = () => {
  return new PrismaClient({
    // La fuente de datos se define aquí para asegurar que siempre se use la URL de la variable de entorno,
    // especialmente en producción.
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Use `globalThis` which is available in both Node.js and Edge runtimes.
const prisma = (globalThis as any).prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).prisma = prisma;
}
