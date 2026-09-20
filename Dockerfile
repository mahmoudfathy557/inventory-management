# Multi-stage production Dockerfile optimized for Coolify / Docker / VPS deployment
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests and .npmrc configuration
COPY package*.json .npmrc ./

# Install all build dependencies (including devDependencies needed for Vite & esbuild)
RUN npm install

# Copy application source code
COPY . .

# Build Vite React frontend (dist/) and bundle Express server (dist/server.cjs)
RUN npm run build

# Production Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install only production runtime dependencies
COPY package*.json .npmrc ./
RUN npm install --omit=dev

# Copy compiled frontend static assets and server bundle from builder stage
COPY --from=builder /app/dist ./dist

# Expose production application port
EXPOSE 3000

# Launch bundled production Express server
CMD ["node", "dist/server.cjs"]

