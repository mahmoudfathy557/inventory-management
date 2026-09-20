# Multi-stage production Dockerfile optimized for Coolify / Docker / VPS deployment
FROM node:22-slim AS builder

WORKDIR /app

# Ensure devDependencies (vite, esbuild, tailwindcss) are installed in builder stage
ENV NODE_ENV=development
# Set memory limit for Node build processes (prevents OOM during Vite 2300+ module bundling)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy dependency manifests and optional .npmrc configuration
COPY package*.json .npmrc* ./

# Install all build dependencies
RUN npm install --legacy-peer-deps

# Copy application source code (excluding node_modules/dist via .dockerignore)
COPY . .

# Execute Vite frontend build
RUN npx vite build

# Bundle production Express server
RUN npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

# Production Runner stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and optional .npmrc configuration
COPY package*.json .npmrc* ./

# Install only production runtime dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled frontend static assets and server bundle from builder stage
COPY --from=builder /app/dist ./dist

# Expose production application port
EXPOSE 3000

# Launch bundled production Express server
CMD ["node", "dist/server.cjs"]


