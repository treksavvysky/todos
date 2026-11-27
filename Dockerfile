# Use Node.js LTS version
FROM node:20-alpine

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /opt/lifeops/todos

# Create data directory
RUN mkdir -p data

# Copy package files and the vendored @plugins/* tarballs (vendor/plugins/SOURCE
# names the my_plugins commit). The image builds from a todos commit alone: no
# ~/plugins checkout and no additional build context.
COPY package*.json ./
COPY vendor ./vendor

# npm 10 (bundled with node:20) crashes on file: deps in the lockfile; npm 11
# handles them. Pinned so a new npm release can't change how the image builds.
RUN npm install -g npm@11.21.3 && npm ci

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Run as the unprivileged node user (uid 1000, matching the owner of the
# bind-mounted data/ on the host). The app ran as root before, which let an
# RCE install a rootkit in the container (SEC-2026-10-20-TODOS).
RUN chown -R node:node /opt/lifeops/todos
USER node

# Expose port 8153
EXPOSE 8153

# Start the application on port 8153
CMD ["npm", "start", "--", "-p", "8153"]
