# ─── Stage 1: Build Angular application ───
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

# Build the Angular application
RUN npx nx build front --configuration=production

# ─── Stage 2: Serve with Nginx + Reverse Proxy ───
FROM nginx:alpine AS production

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config (includes reverse proxy for API + WebSocket)
COPY apps/front/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built Angular application
COPY --from=build /app/dist/apps/front/browser /usr/share/nginx/html

# Install curl for healthcheck
RUN apk add --no-cache curl

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
