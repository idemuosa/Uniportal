# Use Node.js 20 LTS for Tailwind v4 / @tailwindcss/oxide compatibility
FROM node:20-slim

# Install build tools for native C/C++ addons (e.g., sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ gcc && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --build-from-source=sqlite3

# Bundle app source
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Expose ports for Express/Socket.io
EXPOSE 5000

# Start the productive server
CMD ["npm", "run", "server"]
