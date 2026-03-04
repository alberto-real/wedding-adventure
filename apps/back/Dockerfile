# Stage 1: Build NestJS application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the NestJS application
COPY . .

# Build the NestJS application (assuming Nx build command)
RUN npx nx build back --prod

# Stage 2: Run NestJS application
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package.json and install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy the built application from the build stage
COPY --from=build /app/dist/apps/back ./apps/back
COPY --from=build /app/node_modules ./node_modules

# Expose the port your NestJS app listens on (default is 3000)
EXPOSE 3000

# Command to run the NestJS application
CMD ["node", "apps/back/main.js"]
