# Use Node.js LTS version
FROM node:20-alpine

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Create data directory
RUN mkdir -p data

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port 8153
EXPOSE 8153

# Start the application on port 8153
CMD ["npm", "start", "--", "-p", "8153"]
