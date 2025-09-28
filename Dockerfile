# Use Node.js 18 LTS (requirement from Hedera package.json: >=18.16.0)
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    bash

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY Hedera-OP/my-lz-oapp/package*.json ./Hedera-OP/my-lz-oapp/

# Install root dependencies
RUN npm install

# Install Hedera-OP dependencies
WORKDIR /app/Hedera-OP/my-lz-oapp
RUN npm install

# Go back to app root
WORKDIR /app

# Copy all source code
COPY . .

# Make shell scripts executable
RUN chmod +x /app/Hedera-OP/my-lz-oapp/*.sh

# Build stage for Next.js
FROM base AS builder

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Install system dependencies for runtime
RUN apk add --no-cache \
    bash \
    git

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/pages ./pages
COPY --from=builder /app/components ./components
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/hooks ./hooks
COPY --from=builder /app/styles ./styles
COPY --from=builder /app/hardhat ./hardhat
COPY --from=builder /app/Hedera-OP ./Hedera-OP
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/jsconfig.json ./
COPY --from=builder /app/components.json ./
COPY --from=builder /app/eslint.config.mjs ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port Next.js runs on
EXPOSE 3000

# Set environment variable for Next.js
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
