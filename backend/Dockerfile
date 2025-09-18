# Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files (handle both with and without lock file)
COPY package*.json ./

# Install dependencies
# If package-lock.json exists, npm install will use it
# If not, it will generate one
RUN npm install --omit=dev

# Copy application code
COPY . .

# Create uploads directory if needed
RUN mkdir -p uploads

# Expose port
EXPOSE 5010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5010/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

# Start the server
CMD ["node", "server.js"]
