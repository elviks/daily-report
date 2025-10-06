const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.log('Please set MONGODB_URI in your .env.local file');
  process.exit(1);
}

async function initializeDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('daily-report');
    
    // Create collections if they don't exist
    const collections = ['tenants', 'users', 'reports'];
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) { // Collection already exists
          console.log(`ℹ️ Collection already exists: ${collectionName}`);
        } else {
          console.error(`❌ Error creating collection ${collectionName}:`, error);
        }
      }
    }
    
    // Create indexes
    console.log('📊 Creating indexes...');
    
    // Tenant indexes
    await db.collection('tenants').createIndex({ slug: 1 }, { unique: true });
    console.log('✅ Created tenant slug index');
    
    // User indexes
    await db.collection('users').createIndex(
      { email: 1, tenantId: 1 }, 
      { unique: true }
    );
    console.log('✅ Created user email+tenant index');
    
    // Report indexes
    await db.collection('reports').createIndex({ tenantId: 1, date: -1 });
    console.log('✅ Created report tenant+date index');
    
    
    // Check if default tenant exists
    const existingTenant = await db.collection('tenants').findOne({ slug: 'mockco' });
    
    if (!existingTenant) {
      console.log('🏢 Creating default tenant...');
      
      // Create default tenant
      const tenantResult = await db.collection('tenants').insertOne({
        name: 'MockCo',
        slug: 'mockco',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Created default tenant: MockCo');
      
      // Create admin user
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      const adminUser = await db.collection('users').insertOne({
        email: 'admin@mockco.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'superadmin',
        department: 'Administration',
        phone: '+1234567890',
        profileImage: '',
        isAdmin: true,
        tenantId: tenantResult.insertedId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Created admin user: admin@mockco.com');
      console.log('🔑 Default password: admin123');
    } else {
      console.log('ℹ️ Default tenant already exists');
    }
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Default credentials:');
    console.log('   Company Code: mockco');
    console.log('   Email: admin@mockco.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    await client.close();
  }
}

// Run the initialization
initializeDatabase();
