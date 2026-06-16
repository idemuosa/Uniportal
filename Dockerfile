# Use Node.js LTS
FROM node:18-slim

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Expose ports for Express/Socket.io
EXPOSE 5000

# Start the productive server
CMD ["npm", "run", "server"]
