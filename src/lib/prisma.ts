// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// This simplified approach ensures a single, stable instance of PrismaClient
// across the application, which is robust for serverless environments.

const prisma = new PrismaClient();

export default prisma;
