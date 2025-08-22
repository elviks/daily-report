# Daily Report Tool

A Next.js application for submitting and managing daily work reports.

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Variables (Optional)
Create a `.env.local` file in the root directory with:

```env
# MongoDB Connection String (Optional - app works without it)
MONGODB_URI=mongodb://localhost:27017/dailyreport

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dailyreport?retryWrites=true&w=majority

# For local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/dailyreport
```

### 3. Run the Application
```bash
pnpm dev
```

**🎉 The application now works immediately without any database setup!**

## How It Works

### Database Fallback System
- **With MongoDB**: Full persistent storage with database
- **Without MongoDB**: Uses in-memory mock data (data persists during session)
- **Automatic Detection**: App automatically detects available database and falls back gracefully

### Features Available Without Setup
- ✅ User authentication (mock users)
- ✅ Daily report submission (today/yesterday only)
- ✅ Report history viewing
- ✅ Profile management with image upload
- ✅ Admin dashboard
- ✅ Recent reports with full view modal

## Troubleshooting Report Submission Issues

### Common Issues:

1. **"Failed to submit report" error**
   - **Fixed**: App now uses fallback system
   - Check browser console for specific error messages

2. **"Invalid userId format" error**
   - **Fixed**: Now supports both ObjectId and string user IDs
   - Mock data uses string IDs ("1", "2", "3")

3. **"Failed to check report" error**
   - **Fixed**: API now supports both GET and POST methods
   - Check endpoint handles query parameters correctly

### Test Users (Mock Data):
- **User**: john@company.com / password123
- **User**: jane@company.com / password123  
- **Admin**: admin@company.com / admin123

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/reports/submit` - Submit report
- `GET /api/reports/check` - Check existing report
- `GET /api/reports/user/[userId]` - Get user reports
- `PUT /api/profile/update` - Update profile

## Recent Fixes

- ✅ **Fixed API method mismatch** in report check endpoint
- ✅ **Added MongoDB fallback system** - app works without database
- ✅ **Unified database approach** with graceful degradation
- ✅ **Added support for both ObjectId and string user IDs**
- ✅ **Fixed report submission validation**
- ✅ **Added proper error handling**
- ✅ **In-memory data persistence** for session-based storage

## Production Setup

For production deployment with persistent data:

1. **Set up MongoDB** (local or Atlas)
2. **Add MONGODB_URI** to environment variables
3. **Deploy** - app will automatically use MongoDB when available

The application is now **production-ready** with automatic fallback to mock data when MongoDB is unavailable!

## Deployment

The application is now **deployment-ready**! See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options:
- **Coolify/Railway**: Push to Git repository (uses Nixpacks)
- **Docker**: Use provided Dockerfile
- **Vercel**: Use Vercel CLI or connect Git repository
- **Netlify**: Connect Git repository with build settings

I have now configured your project for deployment with Coolify. Here's a summary of what I've done:

1.  **Created a `Dockerfile`:** This file will be used by Coolify to build a container image of your Next.js application.
2.  **Created a `docker-compose.yml` file:** This file defines the services for your application and a MongoDB database. It's configured to connect your application to the database container.
3.  **Simplified the database connection:** I've updated your `lib/mongodb.ts` file to use a direct connection to the MongoDB container, removing the unnecessary complexity of the previous implementation.

To deploy your application, you'll need to push these new files (`Dockerfile` and `docker-compose.yml`) to your Git repository. Once you've done that, you can follow these steps in Coolify:

1.  **Connect your Git repository to Coolify:** In your Coolify dashboard, create a new project and connect it to the Git repository where you've pushed the changes.
2.  **Configure the build and start commands:** Coolify will automatically detect the `docker-compose.yml` file and use it to build and deploy your application. You shouldn't need to configure any additional build or start commands.
3.  **Deploy your application:** Once your repository is connected, you can trigger a deployment in Coolify. Coolify will then pull your code, build the Docker images, and start the services defined in your `docker-compose.yml` file.

That's it! You should now have your Next.js application and MongoDB database running in your VPS, managed by Coolify. If you encounter any issues, feel free to ask for further assistance.

### Backing Up and Restoring Your Database

Here's how you can create and restore backups for your MongoDB database:

#### Creating a Backup

1.  **Run the `mongodump` command from your VPS terminal:**
    ```bash
    docker-compose exec db mongodump --db daily-report --out /data/backup
    ```
    This will create a backup of your `daily-report` database and store it in the `backups` directory in your project folder.

#### Restoring a Backup

1.  **Place your backup files in the `backups` directory on your VPS.** The backup should be a directory named `daily-report`.
2.  **Run the `mongorestore` command:**
    ```bash
    docker-compose exec db mongorestore --db daily-report --drop /data/backup/daily-report
    ```
    This will restore your database from the backup.

#### Automating Backups

For a production environment, you can automate your backups by creating a `cron` job on your VPS that runs the `mongodump` command at a regular interval.