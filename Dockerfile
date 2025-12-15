# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build argument for API URL
ARG REACT_APP_API_URL=http://localhost:8080
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY public ./public
COPY src ./src
COPY tsconfig.json ./

# Build the React app with environment variable
RUN REACT_APP_API_URL=${REACT_APP_API_URL} npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the static build
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
