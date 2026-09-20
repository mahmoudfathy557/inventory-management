FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package*.json .npmrc ./

RUN npm install --legacy-peer-deps

COPY . .

RUN echo "===== NODE =====" \
    && node --version \
    && echo "===== NPM =====" \
    && npm --version \
    && echo "===== BUILD =====" \
    && npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json .npmrc ./

RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
