# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the port your app uses (optional, useful for documentation and some tools)
EXPOSE 8000

# Start the app using npm script
CMD ["npm", "start"]
