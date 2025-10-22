# ========================================
# Stage 1: Base
# ========================================
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ========================================
# Stage 2: Development
# ========================================
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
# Устанавливаем права доступа для исполняемых файлов
RUN chmod +x node_modules/.bin/*
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# ========================================
# Stage 3: Build
# ========================================
FROM base AS build
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN npm prune --production

# ========================================
# Stage 4: Production
# ========================================
FROM node:20-alpine AS production
WORKDIR /app

# Создаём non-root пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Копируем dependencies
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package.json ./

USER nestjs

EXPOSE 3001

CMD ["node", "dist/main.js"]
