# Dockerfile para una aplicación Next.js

# ---- 1. Etapa de Dependencias ----
# Instala solo las dependencias para una construcción más rápida en caché.
FROM node:18-alpine AS deps
WORKDIR /app

# Copia package.json y lockfiles
COPY package.json package-lock.json* ./
# Instala dependencias de producción
RUN npm install --production

# ---- 2. Etapa de Construcción (Builder) ----
# Construye la aplicación Next.js
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Genera el cliente de Prisma (necesario para el build)
RUN npx prisma generate

# Setea las variables de entorno para el build (pueden ser placeholders)
ENV NEXT_PUBLIC_BASE_URL="http://localhost:9002"
ENV DATABASE_URL="mysql://user:pass@host:port/db"
ENV JWT_SECRET="secret"
ENV RESEND_API_KEY="re_12345"

# Construye la aplicación
RUN npm run build

# ---- 3. Etapa de Ejecución (Runner) ----
# La imagen final, optimizada para producción.
FROM node:18-alpine AS runner
WORKDIR /app

# Establece el entorno a producción
ENV NODE_ENV=production
# Deshabilita la telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Crea un usuario no-root para más seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copia los archivos construidos
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambia al usuario no-root
USER nextjs

# Expone el puerto que la app usará
EXPOSE 9002

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
