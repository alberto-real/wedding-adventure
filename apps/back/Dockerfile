# ─── Stage 1: Build NestJS application ───
FROM node:20-alpine AS build

WORKDIR /app

# Copy root package files for monorepo install
COPY package.json package-lock.json ./

# Copy workspace package.json files
COPY apps/front/package.json ./apps/front/
COPY apps/back/package.json ./apps/back/

# Install all dependencies
RUN npm ci

# Copy all source code (needed for NX build)
COPY . .

# Build the NestJS application
RUN npx nx build back --configuration=production

# ─── Stage 2: Run NestJS application (minimal image) ───
FROM node:20-alpine AS production

WORKDIR /app

# Copy the built application from the build stage
COPY --from=build /app/dist/apps/back ./

# Install only production dependencies from the built output
RUN if [ -f package.json ]; then npm ci --only=production 2>/dev/null || true; fi

# Expose the port NestJS listens on (internal only in production)
EXPOSE 3000

CMD ["node", "main.js"]
