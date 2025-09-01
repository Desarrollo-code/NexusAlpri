
# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# The start command will be run by Render based on render.yaml
# We just need to expose the port.
EXPOSE 9002

CMD ["npm", "start"]
