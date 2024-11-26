FROM node:22-alpine

# Create app directory and set ownership
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --chown=appuser:appgroup package*.json yarn.lock ./

# Install dependencies
USER appuser
RUN npm ci --only=production

# Copy application source code
COPY --chown=appuser:appgroup . .

# Expose port 3000 internally (do not expose to host)
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
