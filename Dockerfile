# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

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
