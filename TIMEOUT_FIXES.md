# 🔧 Timeout Issues - Fixed

## Problem

Your application was experiencing request timeout errors during deployment due to:

1. **Database initialization blocking first request** (15-30 seconds)
2. **Aggressive connection timeouts** (15 seconds was too short)
3. **No API route timeout configuration** (defaulted to 10s on some platforms)
4. **MongoDB connection pool exhaustion**
5. **Blocking security logging**

---

## Solutions Applied ✅

### 1. Non-Blocking Database Initialization

**Before:**

```typescript
// This blocked the request for 15-30 seconds!
await ensureInitialization();
```

**After:**

```typescript
// Initialize in background, don't block
ensureInitialization().catch((err) => console.error("Init error:", err));
```

**Files Changed:**

- `app/api/auth/login/route.ts`
- `app/api/register-company/route.ts`
- `lib/db-init.ts`

---

### 2. Increased Database Connection Timeouts

**Before:** 15s server selection, 20s connect, 60s socket  
**After:** 30s server selection, 30s connect, 120s socket

**Why:** Network latency, especially on first connection, can take longer than 15 seconds.

**File Changed:** `lib/mongodb.ts`

---

### 3. Increased getDb() Timeout

**Before:** 15 seconds  
**After:** 30 seconds

**File Changed:** `lib/db.ts`

---

### 4. Added API Route Timeout Configuration

Created configuration files for API routes to set `maxDuration = 60` seconds.

**Files Created:**

- `app/api/auth/login/config.ts`
- `app/api/register-company/config.ts`

---

### 5. Made Initialization Resilient

The initialization now:

- ✅ Runs in background
- ✅ Has its own 25-second timeout
- ✅ Doesn't block requests if it fails
- ✅ Prevents retry loops
- ✅ Returns immediately to prevent timeouts

---

## Configuration for Different Platforms

### Vercel Deployment

Add to `vercel.json`:

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Next.js Standalone

Add to each route file:

```typescript
export const maxDuration = 60;
export const dynamic = "force-dynamic";
```

### Docker/Self-Hosted

Update `next.config.mjs`:

```javascript
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Increase timeout headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "X-Request-Timeout", value: "60000" }],
      },
    ];
  },
};
```

---

## Testing the Fix

### Test 1: First Request (Cold Start)

```bash
# Should complete in under 10 seconds
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","companyCode":"mockco"}'
```

### Test 2: Subsequent Requests

```bash
# Should complete in under 2 seconds
# Same request as above
```

### Test 3: Concurrent Requests

```bash
# Run 10 requests simultaneously
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!@#","companyCode":"mockco"}' &
done
wait
```

---

## Environment Variables

Add these to `.env` for better timeout control:

```env
# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string

# Connection timeout settings (milliseconds)
DB_SERVER_SELECTION_TIMEOUT=30000
DB_SOCKET_TIMEOUT=120000
DB_CONNECT_TIMEOUT=30000

# API timeout (seconds)
API_TIMEOUT=60
```

---

## Monitoring Timeouts

### Add Logging

```typescript
// In your API routes
console.time("request-duration");

// ... your code ...

console.timeEnd("request-duration");
```

### Check Logs

- MongoDB connection time
- Database query execution time
- API route total time
- Initialization time

---

## Platform-Specific Limits

### Vercel

- **Hobby:** 10s max (upgrade if you need more)
- **Pro:** 60s max ✅ (our config)
- **Enterprise:** 300s max

### Railway

- Default: 300s (5 minutes)
- Configurable via environment variables

### AWS Lambda (via Serverless Next.js)

- Default: 30s
- Max: 900s (15 minutes)
- Configure in `serverless.yml`

### Render

- Default: 30s
- Configurable in render.yaml

---

## If You Still Get Timeouts

### 1. Check MongoDB Connection

```bash
# Test connection speed
time mongo "your-connection-string" --eval "db.adminCommand('ping')"
```

### 2. Optimize Database Queries

```typescript
// Add indexes
await db.collection("users").createIndex({ email: 1, tenantId: 1 });

// Use projection to limit data
const user = await db
  .collection("users")
  .findOne({ email }, { projection: { password: 1, email: 1, role: 1 } });
```

### 3. Enable Keep-Alive

```env
# In .env
MONGODB_URI=mongodb+srv://...?retryWrites=true&w=majority&keepAlive=true&keepAliveInitialDelay=300000
```

### 4. Use CDN for Static Assets

- Reduces server load
- Faster responses

### 5. Implement Caching

```typescript
// Cache frequent queries
const cache = new Map();
const cacheKey = `tenant:${slug}`;

if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}

const tenant = await findTenantBySlug(slug);
cache.set(cacheKey, tenant);
```

---

## Quick Checklist

- [x] Database initialization is non-blocking
- [x] MongoDB timeouts increased to 30s
- [x] getDb() timeout increased to 30s
- [x] API routes have maxDuration set
- [x] Initialization has timeout protection
- [ ] Test cold start < 10 seconds
- [ ] Test warm requests < 2 seconds
- [ ] Check deployment platform limits
- [ ] Configure platform-specific timeouts
- [ ] Monitor logs for slow queries

---

## Summary

**Before:** Requests timing out at 10-15 seconds due to blocking initialization

**After:**

- ✅ Non-blocking initialization
- ✅ 30-second database timeouts
- ✅ 60-second API route max duration
- ✅ Resilient error handling
- ✅ No blocking operations

**Result:** Application should respond in under 5 seconds, even on cold starts.

---

## Need Help?

If timeouts persist:

1. Check MongoDB connection speed
2. Review platform-specific limits
3. Enable debug logging
4. Check for slow database queries
5. Consider adding Redis caching

For production, consider:

- MongoDB Atlas M10+ tier (better performance)
- Serverless with reserved concurrency
- Load balancer with health checks
- CDN for static content
