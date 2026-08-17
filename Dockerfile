FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN apk add --no-cache python3 make g++
RUN npm run install:all

# Copy everything else
COPY . .

# Build the React frontend
RUN npm run build:client

# Tell Docker to expose port 3000
EXPOSE 3000

# Tell our Node app where to store the SQLite database so it's persistent
ENV DATA_DIR=/data
ENV PORT=3000

# Start the Express server
CMD ["npm", "run", "start"]
