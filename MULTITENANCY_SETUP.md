# Multitenancy Setup Guide

This guide explains how to set up and use the multitenancy system in the Daily Report application.

## 🚀 Quick Start

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/daily-report

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Next.js
NODE_ENV=development

# Optional: For production deployments
PORT=3016
```

### 2. Initialize Database

Run the database initialization script to create the required collections and indexes:

```bash
npm run init-db
```

This will:
- Create the required collections (tenants, users, reports, notifications)
- Set up proper indexes for multitenancy
- Create a default tenant "MockCo" with admin user

### 3. Default Credentials

After running the initialization script, you can log in with:

- **Company Code**: `mockco`
- **Email**: `admin@mockco.com`
- **Password**: `admin123`

## 🏢 How Multitenancy Works

### Data Model

The system uses a single database with tenant isolation:

- **Tenants**: Each company is a tenant with a unique slug
- **Users**: Users belong to a specific tenant (email + tenantId unique constraint)
- **Reports**: All reports are scoped to a tenant
- **Notifications**: All notifications are scoped to a tenant

### Authentication Flow

1. User enters company code, email, and password
2. System validates company code and finds tenant
3. System authenticates user within that tenant
4. JWT token includes tenant information
5. All subsequent requests include tenant context

### Security Features

- **Tenant Isolation**: All data queries include tenantId
- **JWT Tokens**: Include tenant information for authorization
- **Unique Constraints**: Email + tenantId combination ensures uniqueness per tenant
- **Password Hashing**: All passwords are hashed using bcrypt

## 📝 API Endpoints

### Authentication

- `POST /api/auth/login` - Login with company code, email, and password
- `POST /api/register-company` - Register a new company

### Reports

- `POST /api/reports` - Create a new report (requires authentication)
- `GET /api/reports` - Get all reports for the tenant (requires authentication)

## 🎯 Usage Examples

### Register a New Company

```javascript
const response = await fetch('/api/register-company', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyName: 'Acme Corp',
    adminEmail: 'admin@acme.com',
    adminPassword: 'securepassword123'
  })
});

const data = await response.json();
// Returns: { slug: 'acme-corp', loginUrl: '/login?company=acme-corp' }
```

### Login

```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyCode: 'acme-corp',
    email: 'admin@acme.com',
    password: 'securepassword123'
  })
});

const data = await response.json();
// Returns: { token, user, tenant }
```

### Create a Report

```javascript
const response = await fetch('/api/reports', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    date: '2024-01-15',
    content: 'Today I worked on...'
  })
});
```

## 🔧 Development

### Adding New API Endpoints

When creating new API endpoints that need tenant isolation:

1. Use the `authMiddleware` to authenticate requests
2. Extract tenant ID from request headers
3. Include tenantId in all database queries

Example:

```typescript
import { authMiddleware, getTenantIdFromRequest } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { request: authenticatedRequest } = authResult;
  const tenantId = getTenantIdFromRequest(authenticatedRequest);
  
  // Use tenantId in your database queries
  const data = await findDataByTenant(new ObjectId(tenantId));
  
  return NextResponse.json({ data });
}
```

### Database Operations

All database operations should include tenant context:

```typescript
// ✅ Correct - includes tenantId
const reports = await findReportsByTenant(tenantId);

// ❌ Wrong - no tenant isolation
const reports = await db.collection('reports').find({}).toArray();
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set proper JWT_SECRET and MONGODB_URI
2. **Database Indexes**: Ensure all indexes are created
3. **SSL/TLS**: Use secure MongoDB connections
4. **Rate Limiting**: Consider adding rate limiting for registration/login
5. **Monitoring**: Monitor tenant usage and performance

### Scaling

The current implementation uses a single database with tenant isolation. For larger scale:

- Consider separate databases per tenant
- Implement tenant-specific caching
- Add tenant usage analytics
- Consider microservices architecture

## 🔍 Troubleshooting

### Common Issues

1. **"Company not found"**: Check if the company slug exists in the database
2. **"Invalid credentials"**: Verify email and password for the specific tenant
3. **"Tenant information not found"**: Ensure JWT token includes tenant information
4. **Database connection issues**: Check MONGODB_URI and network connectivity

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
DEBUG=true
```

## 📚 Additional Resources

- [MongoDB Multitenancy Best Practices](https://docs.mongodb.com/manual/data-modeling/)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
