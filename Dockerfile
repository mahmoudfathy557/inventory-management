# Multi-stage production Dockerfile optimized for Coolify / VPS deployment
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Vite frontend and bundled Express server
RUN npm run build

# Production Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and server from builder
COPY --from=builder /app/dist ./dist

# Expose container port
EXPOSE 3000

# Run the bundled Express server
CMD ["node", "dist/server.cjs"]
