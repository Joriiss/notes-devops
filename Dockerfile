# Stage 1: build React frontend
FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: API + serve built frontend
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3000

CMD ["node", "src/index.js"]
