# Stage 1: Build the React app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package*.json yarn.lock ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy build output to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Use a non-root user for Nginx
RUN addgroup -g 1001 -S nginx && \
	adduser -u 1001 -S nginx -G nginx

# Change ownership of Nginx directories
RUN chown -R nginx:nginx /usr/share/nginx /var/cache/nginx /var/log/nginx

# Switch to non-root user
USER nginx

# Expose port 8080 internally (do not expose to host)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
