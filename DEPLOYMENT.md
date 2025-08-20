# Deployment Guide

This guide provides instructions for deploying the Daily Report Tool application.

## Prerequisites

- Node.js 18+ 
- pnpm package manager
- Git repository access

## Environment Variables

The application works with or without MongoDB:

### Optional Environment Variables
- `MONGODB_URI`: MongoDB connection string (optional - app works without it)

### Example Environment Variables
```env
# For MongoDB Atlas (cloud):
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dailyreport?retryWrites=true&w=majority

# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/dailyreport
```

## Deployment Methods

### Method 1: Nixpacks (Recommended for Coolify/Railway)

The application is configured to work with Nixpacks automatically. The `.nixpacks.toml` file provides the necessary configuration.

**Steps:**
1. Push your code to a Git repository
2. Connect your repository to your deployment platform
3. Set environment variables if needed
4. Deploy

### Method 2: Docker

A `Dockerfile` is provided for containerized deployment.

**Build and run locally:**
```bash
docker build -t dailyreport-tool .
docker run -p 3000:3000 dailyreport-tool
```

**Deploy to container platforms:**
- Docker Hub
- Google Cloud Run
- AWS ECS
- Azure Container Instances

### Method 3: Vercel

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Set environment variables in Vercel dashboard

### Method 4: Netlify

**Steps:**
1. Connect your Git repository to Netlify
2. Set build command: `pnpm run build`
3. Set publish directory: `.next`
4. Set environment variables if needed

## Build Commands

- **Install dependencies:** `pnpm install`
- **Build application:** `pnpm run build`
- **Start production server:** `pnpm start`
- **Development server:** `pnpm dev`

## Port Configuration

The application runs on port 3000 by default. Make sure your deployment platform is configured to use this port or set the `PORT` environment variable.

## Troubleshooting

### Common Issues

1. **"packages field missing or empty" error**
   - ✅ Fixed: Removed `pnpm-workspace.yaml` file
   - The application is now configured as a single package

2. **Build failures**
   - ✅ Fixed: Removed unused Prisma dependencies
   - ✅ Fixed: Added proper Nixpacks configuration

3. **MongoDB connection issues**
   - ✅ Fixed: Application has fallback to mock data
   - App works without MongoDB connection

### Test the Application

The application includes test users for immediate testing:

- **User:** john@company.com / password123
- **User:** jane@company.com / password123  
- **Admin:** admin@company.com / admin123

## Support

If you encounter any issues during deployment, check:
1. Build logs for specific error messages
2. Environment variable configuration
3. Port and network settings
4. Node.js version compatibility

The application is designed to be deployment-ready with minimal configuration required.
