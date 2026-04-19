# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies required for building)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the NestJS application
RUN pnpm run build

# Stage 2: Production environment
FROM node:20-alpine AS production

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set node environment to production
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install ONLY production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy the built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
