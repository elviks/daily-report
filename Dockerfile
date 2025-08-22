# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Accept MONGODB_URI as a build argument
ARG MONGODB_URI

# Set the MONGODB_URI environment variable
ENV MONGODB_URI=$MONGODB_URI

# Install pnpm
RUN npm install -g pnpm

# Copy package management files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN pnpm build

# Expose the port the app runs on
EXPOSE 3016

# Define the command to run the app
CMD ["pnpm", "start"]
