FROM node:20-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package.json ./
# Copy package-lock.json if it exists, otherwise install will create it
COPY package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy config files
COPY svelte.config.js vite.config.ts tsconfig.json ./

# Source files will be mounted as volumes for dev
# For production build, copy everything
COPY . .

# Default command builds the project
CMD ["npm", "run", "build"]
