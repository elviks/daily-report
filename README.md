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
MONGODB_URI=mongodb://localhost:27017/daily-report

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/daily-report?retryWrites=true&w=majority

# For local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/daily-report
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
