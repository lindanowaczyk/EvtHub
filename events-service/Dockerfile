# auth-service/Dockerfile (e events-service/Dockerfile — mesmo conteúdo)
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]