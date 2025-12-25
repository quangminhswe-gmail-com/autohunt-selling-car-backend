FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

FROM base AS development
COPY . .
CMD ["npm", "run", "dev"]

RUN npm run build
FROM base AS builder
COPY . .
RUN npm run build

RUN npm prune --production

FROM node:20-alpine AS production
WORKDIR /app

USER node

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD [ "node", "dist/main" ]