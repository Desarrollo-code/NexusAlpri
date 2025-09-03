# ---- Base ----
# Utiliza una imagen oficial de Node.js como base.
# La versión Alpine es ligera, lo que ayuda a mantener el tamaño de la imagen final pequeño.
FROM node:20-alpine AS base
# Establece el directorio de trabajo dentro del contenedor.
WORKDIR /app

# ---- Dependencias ----
# Copia solo los archivos necesarios para instalar las dependencias.
# Esto aprovecha el almacenamiento en caché de capas de Docker. Si estos archivos no cambian,
# Docker reutilizará la capa de dependencias en lugar de reinstalar todo.
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instala las dependencias de producción
RUN npm install --omit=dev

# ---- Builder ----
# En esta etapa se construye la aplicación de Next.js.
FROM base AS builder
WORKDIR /app

# Copia las dependencias instaladas de la etapa anterior.
COPY --from=deps /app/node_modules ./node_modules
# Copia el resto del código de la aplicación.
COPY . .

# Construye la aplicación de Next.js para producción
RUN npm run build

# ---- Runner ----
# Esta es la etapa final que creará la imagen que se ejecutará.
FROM base AS runner
WORKDIR /app

# Establece la variable de entorno para producción.
ENV NODE_ENV=production

# Copia los archivos de configuración y el directorio 'public'.
COPY --from=builder /app/public ./public
# Copia la carpeta '.next' con la construcción optimizada.
COPY --from=builder --chown=node:node /app/.next ./.next
# Copia la carpeta de dependencias.
COPY --from=builder /app/node_modules ./node_modules
# Copia el archivo 'package.json'.
COPY --from=builder /app/package.json ./package.json

# Expone el puerto que la aplicación utilizará.
# Next.js se ejecuta en el puerto 3000 por defecto.
EXPOSE 3000

# Define el comando que se ejecutará cuando el contenedor inicie.
# 'next start' inicia el servidor de producción de Next.js.
CMD ["npm", "run", "start"]
