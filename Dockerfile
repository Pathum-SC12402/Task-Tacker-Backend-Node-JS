# Use official Node.js image
FROM node:alpine

# Set working directory
WORKDIR /app

# Copy dependencies and install
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Start app
CMD ["npm", "server.js"]
