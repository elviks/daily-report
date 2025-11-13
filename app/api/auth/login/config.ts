// API Route Configuration for deployment platforms (Vercel, etc.)
// This sets maximum execution time for API routes

// Maximum execution time in seconds
// Vercel Hobby: 10s, Pro: 60s, Enterprise: 300s
// Adjust based on your plan
export const maxDuration = 60; // 60 seconds
export const dynamic = "force-dynamic";
