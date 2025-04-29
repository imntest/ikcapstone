# Dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install --production
RUN cd client && npm install --production
RUN cd server && npm install --production

# Copy source code
COPY . .

# Build frontend
RUN cd client && npm run build

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server/src/index.js"]