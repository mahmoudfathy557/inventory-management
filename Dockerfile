# Multi-stage production Dockerfile optimized for Coolify / Docker / VPS deployment
FROM node:22-alpine AS builder

WORKDIR /app

# Set memory limit for Node build processes (prevents OOM during Vite 2300+ module bundling)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy dependency manifests and .npmrc configuration
COPY package*.json .npmrc ./

# Copy application source code
COPY . .

# Ensure all dependencies are installed and execute production build
RUN npm install --legacy-peer-deps && npm run build

# Production Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and .npmrc configuration
COPY package*.json .npmrc ./

# Install only production runtime dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled frontend static assets and server bundle from builder stage
COPY --from=builder /app/dist ./dist

# Expose production application port
EXPOSE 3000

# Launch bundled production Express server
CMD ["node", "dist/server.cjs"]


