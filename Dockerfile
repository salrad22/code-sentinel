FROM node:20-slim

WORKDIR /app

# Copy package files (root and workspaces)
COPY package*.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/server-stdio/package.json ./packages/server-stdio/

# Install all dependencies
RUN npm ci

# Copy source files
COPY packages/core/ ./packages/core/
COPY packages/server-stdio/ ./packages/server-stdio/

# Build all packages
RUN npm run build:all

# Run the MCP server
CMD ["node", "./packages/server-stdio/build/index.js"]
