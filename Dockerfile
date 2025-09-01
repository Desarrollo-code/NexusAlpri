# Dockerfile para una aplicación Next.js con Prisma

# --- Etapa 1: Imagen Base ---
# Usamos una imagen delgada de Node.js y le añadimos las dependencias que Prisma necesita.
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Prisma necesita OpenSSL
RUN apt-get update && apt-get install -y openssl

# --- Etapa 2: Instalación de Dependencias ---
# Esta etapa solo instala las dependencias. Se cachea para acelerar futuras construcciones.
FROM base AS deps
WORKDIR /app
COPY package.json ./
# Usamos 'npm install' en lugar de 'npm ci' porque los archivos lock pueden no estar sincronizados.
RUN npm install

# --- Etapa 3: Construcción de la Aplicación ---
# Aquí generamos el cliente de Prisma y construimos la app de Next.js.
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generamos el cliente de Prisma basado en el esquema
RUN npx prisma generate
# Construimos la aplicación optimizada para producción
RUN npm run build

# --- Etapa 4: Imagen Final de Producción ---
# Empezamos desde una imagen limpia y copiamos solo lo estrictamente necesario.
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiamos la carpeta 'public' que contiene archivos estáticos (imágenes, fuentes, etc.)
COPY --from=builder /app/public ./public
# Copiamos la carpeta de construcción de Next.js optimizada
COPY --from=builder /app/.next ./.next
# Copiamos las dependencias de producción
COPY --from=builder /app/node_modules ./node_modules
# Copiamos el package.json por si Next.js lo necesita para alguna configuración
COPY --from=builder /app/package.json ./package.json

# Exponemos el puerto en el que Next.js se ejecutará por defecto
EXPOSE 9002

# El comando para iniciar la aplicación en modo producción
CMD ["npm", "start"]
