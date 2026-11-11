FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/bot/package*.json ./packages/bot/
COPY packages/frontend/package*.json ./packages/frontend/

RUN npm install

COPY . .

RUN cp packages/backend/prisma/schema.postgresql.prisma packages/backend/prisma/schema.prisma
RUN npx prisma generate --schema=packages/backend/prisma/schema.prisma
RUN npm run build --workspace=packages/backend
RUN npm run build --workspace=packages/bot

EXPOSE 3000

CMD npx prisma db push --schema=packages/backend/prisma/schema.prisma --accept-data-loss && node packages/backend/dist/index.js & node packages/bot/dist/index.js
