# Multi-stage Dockerfile for complete application
# This can be used for a single-container deployment

# Stage 1: Build frontend
FROM node:18-alpine as frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy frontend code and build
COPY frontend/ .
RUN npm run build

# Stage 2: Setup backend with built frontend
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

# Copy backend code
COPY backend/ .

# Copy built frontend from previous stage to be served statically
COPY --from=frontend-build /app/frontend/build ./public

# Create necessary directories
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

# Start the server
CMD ["node", "server.js"]
