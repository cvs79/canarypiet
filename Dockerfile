# Multi-stage build for optimized image size
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build Astro application
RUN npm run build

# Final stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Create non-root user (check if node user already exists)
RUN if ! id -u node > /dev/null 2>&1; then adduser -D node; fi

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Environment variables
ENV HOST=0.0.0.0
ENV PORT=8080
ENV NODE_ENV=production
ENV REFRESH_INTERVAL=30

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "./dist/server/entry.mjs"]
