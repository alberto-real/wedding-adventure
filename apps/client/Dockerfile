# Stage 1: Build Angular application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the Angular application and other project files
COPY . .

# Build the Angular application (assuming Nx build command)
# The output path is usually dist/apps/client
RUN npx nx build client --prod

# Stage 2: Serve Angular application with Nginx
FROM nginx:alpine AS production

# Copy Nginx configuration (create a default one)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built Angular application from the build stage
COPY --from=build /app/dist/apps/client /usr/share/nginx/html

# Expose port 80 for web traffic
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
