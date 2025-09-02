# ---- Base ----
# Usa una imagen base de Node.js ligera y optimizada
FROM node:20-alpine AS base

# ---- Dependencias ----
FROM base AS deps
WORKDIR /app

# Copia solo los archivos de manifiesto para aprovechar el cache de Docker
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instala las dependencias de producción
RUN npm install --omit=dev

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Genera el cliente de Prisma
RUN npm run prisma:generate

# Construye la aplicación de Next.js para producción
RUN npm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

# Define el entorno como producción
ENV NODE_ENV=production
# El servidor de Next.js se ejecutará en el puerto 9002
ENV PORT=9002

# Copia los artefactos de la construcción y las dependencias
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expone el puerto
EXPOSE 9002

# Comando para iniciar la aplicación
CMD ["npm", "start"]
