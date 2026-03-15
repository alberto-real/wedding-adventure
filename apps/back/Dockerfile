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

# Copy the built application and generated package.json from the build stage
COPY --from=build /app/apps/back/dist ./

# Copy root lockfile so npm ci can resolve exact versions
COPY --from=build /app/package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Expose the port NestJS listens on (internal only in production)
EXPOSE 3000

CMD ["node", "main.js"]
