# -----------------------------
# 1. Build stage
# -----------------------------
FROM node:23-alpine3.20 AS builder

WORKDIR /app

# Copiar package.json y lock primero (para aprovechar caché)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

# Compilar el proyecto NestJS
RUN npm run build


# -----------------------------
# 2. Runtime stage
# -----------------------------
FROM node:23-alpine3.20 AS runtime

WORKDIR /app

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Usuario no root
USER node

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main.js"]
