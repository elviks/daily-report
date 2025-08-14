# Fix MongoDB URI

## Current Issue
The MongoDB URI in your `.env` file has formatting issues that prevent connection.

## Current URI (Problematic)
```
MONGODB_URI= mongodb+srv://elviksharma111:root321##@cluster0.la8vkx1.mongodb.net/?retryWrites=true&w=majo
rity&appName=Cluster0%
```

## Issues Found:
1. Extra space after `MONGODB_URI=`
2. Line break in the middle of the URI
3. Extra `%` at the end
4. Missing database name

## Corrected URI
Please update your `.env` file with this corrected URI:

```
MONGODB_URI=mongodb+srv://elviksharma111:root321##@cluster0.la8vkx1.mongodb.net/daily-report?retryWrites=true&w=majority&appName=Cluster0
```

## Steps to Fix:
1. Open `.env` file
2. Replace the entire MONGODB_URI line with the corrected version above
3. Save the file
4. Restart the development server: `pnpm dev`

## Test the Fix:
After updating, run: `node test-mongodb.js`

You should see: "✅ MongoDB connection successful!"
