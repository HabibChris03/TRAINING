FROM node:20-slim

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY src/ ./src/

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Run as non-root user for container security
USER node

EXPOSE 3000

# Healthcheck checking /health endpoint using built-in fetch in Node 20
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
