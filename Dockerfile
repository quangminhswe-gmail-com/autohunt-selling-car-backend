FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

FROM base AS development
COPY . .
EXPOSE 8080
CMD ["npm", "run", "start:dev"]

FROM base AS builder
COPY . .

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

USER node

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

RUN npm prune --production

EXPOSE 8080

CMD [ "node", "dist/main" ]