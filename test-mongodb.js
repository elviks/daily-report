const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

async function testMongoDB() {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
        console.error('❌ MONGODB_URI not found in .env file');
        return;
    }
    
    console.log('🔍 Testing MongoDB connection...');
    console.log('URI:', uri.substring(0, 50) + '...');
    
    try {
        // Ensure the URI has the database name
        let cleanUri = uri;
        if (!cleanUri.includes('/daily-report')) {
            if (cleanUri.includes('?')) {
                cleanUri = cleanUri.replace('?', '/daily-report?');
            } else {
                cleanUri = cleanUri + '/daily-report';
            }
        }
        
        console.log('🔧 Cleaned URI:', cleanUri.substring(0, 50) + '...');
        
        const client = new MongoClient(cleanUri);
        await client.connect();
        
        console.log('✅ MongoDB connection successful!');
        
        const db = client.db('daily-report');
        const collections = await db.listCollections().toArray();
        console.log('📁 Collections found:', collections.map(c => c.name));
        
        // Test inserting a document
        const testCollection = db.collection('test');
        const result = await testCollection.insertOne({
            test: true,
            timestamp: new Date()
        });
        console.log('✅ Test document inserted with ID:', result.insertedId);
        
        // Clean up test document
        await testCollection.deleteOne({ _id: result.insertedId });
        console.log('🧹 Test document cleaned up');
        
        await client.close();
        console.log('✅ MongoDB test completed successfully!');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.error('Full error:', error);
    }
}

testMongoDB();
