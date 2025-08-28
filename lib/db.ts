import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';
import { Tenant, User, Report, Notification, COLLECTIONS } from './models';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Database connection helper
export async function getDb() {
  const client = await clientPromise;
  return client.db('daily-report');
}

// Tenant operations
export async function findTenantBySlug(slug: string): Promise<Tenant | null> {
  const db = await getDb();
  return await db.collection(COLLECTIONS.TENANTS).findOne({ slug: slug.toLowerCase() });
}

export async function createTenant(tenant: Omit<Tenant, '_id'>): Promise<Tenant> {
  const db = await getDb();
  const now = new Date();
  const newTenant = {
    ...tenant,
    slug: tenant.slug.toLowerCase(),
    createdAt: now,
    updatedAt: now
  };
  
  const result = await db.collection(COLLECTIONS.TENANTS).insertOne(newTenant);
  return { ...newTenant, _id: result.insertedId };
}

// User operations
export async function findUserByEmailAndTenant(email: string, tenantId: ObjectId): Promise<User | null> {
  const db = await getDb();
  return await db.collection(COLLECTIONS.USERS).findOne({ 
    email: email.toLowerCase(), 
    tenantId 
  });
}

export async function createUser(user: Omit<User, '_id'>): Promise<User> {
  const db = await getDb();
  const now = new Date();
  const newUser = {
    ...user,
    email: user.email.toLowerCase(),
    createdAt: now,
    updatedAt: now
  };
  
  const result = await db.collection(COLLECTIONS.USERS).insertOne(newUser);
  return { ...newUser, _id: result.insertedId };
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getDb();
  return await db.collection(COLLECTIONS.USERS).findOne({ 
    _id: new ObjectId(id) 
  });
}

export async function findUsersByTenant(tenantId: ObjectId): Promise<User[]> {
  const db = await getDb();
  return await db.collection(COLLECTIONS.USERS)
    .find({ tenantId })
    .sort({ createdAt: -1 })
    .toArray();
}

// Report operations
export async function findReportsByTenant(tenantId: ObjectId): Promise<Report[]> {
  const db = await getDb();
  return await db.collection(COLLECTIONS.REPORTS)
    .find({ tenantId })
    .sort({ date: -1 })
    .toArray();
}

export async function findReportsByUser(userId: ObjectId, tenantId: ObjectId): Promise<Report[]> {
  const db = await getDb();
  return await db.collection(COLLECTIONS.REPORTS)
    .find({ userId, tenantId })
    .sort({ date: -1 })
    .toArray();
}

export async function createReport(report: Omit<Report, '_id'>): Promise<Report> {
  const db = await getDb();
  const now = new Date();
  const newReport = {
    ...report,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await db.collection(COLLECTIONS.REPORTS).insertOne(newReport);
  return { ...newReport, _id: result.insertedId };
}

// Authentication helpers
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function generateJWT(user: User): string {
  const payload = {
    uid: user._id?.toString(),
    email: user.email,
    isAdmin: user.isAdmin,
    tid: user.tenantId.toString(),
    role: user.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  });
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    return null;
  }
}

// Database initialization
export async function initializeDatabase() {
  const db = await getDb();
  
  // Create indexes
  await db.collection(COLLECTIONS.TENANTS).createIndex({ slug: 1 }, { unique: true });
  await db.collection(COLLECTIONS.USERS).createIndex(
    { email: 1, tenantId: 1 }, 
    { unique: true }
  );
  await db.collection(COLLECTIONS.REPORTS).createIndex({ tenantId: 1, date: -1 });
  await db.collection(COLLECTIONS.NOTIFICATIONS).createIndex({ tenantId: 1, userId: 1 });
  
  console.log('✅ Database indexes created successfully');
}

// Bootstrap default tenant and admin user
export async function bootstrapDefaultTenant() {
  const db = await getDb();
  
  // Check if default tenant exists
  const existingTenant = await findTenantBySlug('mockco');
  if (!existingTenant) {
    // Create default tenant
    const tenant = await createTenant({
      name: 'MockCo',
      slug: 'mockco'
    });
    console.log('✅ Default tenant created');
  } else {
    console.log('✅ Default tenant already exists');
  }
  
  // Check if admin user exists for the default tenant
  const existingAdmin = await findUserByEmailAndTenant('admin@mockco.com', existingTenant?._id! || (await findTenantBySlug('mockco'))!._id!);
  if (!existingAdmin) {
    // Create admin user
    const tenant = existingTenant || await findTenantBySlug('mockco');
    if (tenant) {
      const adminUser = await createUser({
        email: 'admin@mockco.com',
        password: hashPassword('admin123'),
        name: 'Admin User',
        role: 'superadmin',
        department: 'Administration',
        phone: '+1234567890',
        profileImage: '',
        isAdmin: true,
        tenantId: tenant._id!,
        isActive: true
      });
      console.log('✅ Default admin user created');
    }
  } else {
    console.log('✅ Default admin user already exists');
  }
  
  return existingTenant || await findTenantBySlug('mockco');
}
