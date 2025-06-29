FROM node:22-alpine

# Install bash and required tools
RUN apk add --no-cache bash netcat-openbsd
RUN npm i -g @nestjs/cli typescript ts-node

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Copy environment file if it doesn't exist
RUN if [ ! -f .env ]; then cp env-example-relational .env; fi

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:dev"]