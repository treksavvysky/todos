# Use Node.js LTS version
FROM node:20-alpine

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# The @plugins/* deps are file:../../plugins/... and the lockfile records
# them relative to the app dir, so the image must mirror the host layout:
# app two levels below the directory that holds plugins/.
WORKDIR /opt/lifeops/todos

# Create data directory
RUN mkdir -p data

# Stage the plugin packages (built dist/ included) from the `plugins`
# additional build context (see docker-compose.yml).
COPY --from=plugins agent-gate /opt/plugins/packages/agent-gate
COPY --from=plugins agent-gate-next /opt/plugins/packages/agent-gate-next

# Recreate the monorepo wiring the packages rely on at resolve time:
# agent-gate's own runtime deps (zod), and the workspace symlink that lets
# agent-gate-next find its sibling.
RUN cd /opt/plugins/packages/agent-gate && npm install --omit=dev --no-package-lock \
 && mkdir -p /opt/plugins/node_modules/@plugins \
 && ln -s ../../packages/agent-gate /opt/plugins/node_modules/@plugins/agent-gate

# Copy package files
COPY package*.json ./

# Install dependencies. npm 10 (bundled with node:20) crashes on file: deps
# in the lockfile ("Cannot read properties of undefined (reading 'extraneous')");
# npm 11 handles them.
RUN npm install -g npm@11 && npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port 8153
EXPOSE 8153

# Start the application on port 8153
CMD ["npm", "start", "--", "-p", "8153"]
