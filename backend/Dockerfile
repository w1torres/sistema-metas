FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Todas as dependências (inclui tsx): as migrations do knex são .ts e rodam
# via tsx no startup do container.
COPY package*.json ./
RUN npm ci --include=dev

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && mkdir -p /app/uploads

EXPOSE 3001

# Aplica migrations pendentes e sobe a API. Nunca roda o seed (ele apaga dados).
CMD ["sh", "-c", "npx tsx src/db/migrate.ts && node dist/server.js"]
