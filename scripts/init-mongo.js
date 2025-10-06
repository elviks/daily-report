// MongoDB initialization script for secure setup
print('🔐 Starting MongoDB initialization...');

// Switch to admin database
db = db.getSiblingDB('admin');

// Create admin user for the application with full access to dailyreport database
db.createUser({
  user: 'admin',
  pwd: process.env.MONGO_INITDB_ROOT_PASSWORD || 'SecurePassword123',
  roles: [
    {
      role: 'userAdminAnyDatabase',
      db: 'admin'
    },
    {
      role: 'readWriteAnyDatabase',
      db: 'admin'
    },
    {
      role: 'dbAdminAnyDatabase',
      db: 'admin'
    }
  ]
});

// Switch to application database
db = db.getSiblingDB('dailyreport');

// Create application database user with limited permissions
db.createUser({
  user: 'app_user',
  pwd: process.env.MONGO_PASSWORD || 'change_this_password_immediately',
  roles: [
    {
      role: 'readWrite',
      db: 'dailyreport'
    }
  ]
});

// Create collections with proper indexes
db.createCollection('tenants');
db.createCollection('users');
db.createCollection('reports');
db.createCollection('audit_logs');
db.createCollection('failed_logins');
db.createCollection('security_events');

// Create indexes for better performance and security
db.tenants.createIndex({ "slug": 1 }, { unique: true });
db.users.createIndex({ "email": 1, "tenantId": 1 }, { unique: true });
db.reports.createIndex({ "tenantId": 1, "date": -1 });
db.audit_logs.createIndex({ "timestamp": -1 });
db.audit_logs.createIndex({ "userId": 1, "timestamp": -1 });
db.failed_logins.createIndex({ "ip": 1, "timestamp": -1 });
db.failed_logins.createIndex({ "email": 1, "timestamp": -1 });
db.security_events.createIndex({ "timestamp": -1, "severity": 1 });

// Create capped collection for audit logs (prevents log flooding)
db.createCollection('audit_logs', { 
  capped: true, 
  size: 10000000,  // 10MB
  max: 10000       // Max 10k documents
});

// Create capped collection for security events
db.createCollection('security_events', { 
  capped: true, 
  size: 5000000,   // 5MB
  max: 5000        // Max 5k documents
});

// Insert initial security configuration
db.security_config.insertOne({
  _id: "security_settings",
  maxFailedLogins: 5,
  lockoutDuration: 30, // minutes
  sessionTimeout: 480, // minutes
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 // days
  },
  ipWhitelist: [],
  createdAt: new Date(),
  updatedAt: new Date()
});

// Insert initial audit log entry
db.audit_logs.insertOne({
  timestamp: new Date(),
  event: "database_initialization",
  userId: "system",
  ip: "127.0.0.1",
  details: "Database initialized with security measures",
  severity: "info"
});

print('✅ MongoDB initialization completed successfully');
print('🔐 Database secured with authentication');
print('👤 Application user created with limited permissions');
print('📊 Collections and indexes created');
print('🔍 Audit logging enabled');
print('🛡️ Security monitoring configured');
