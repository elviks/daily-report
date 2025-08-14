const fs = require('fs');
const path = require('path');

// Correct MongoDB URI
const correctUri = 'MONGODB_URI=mongodb+srv://elviksharma111:root321##@cluster0.la8vkx1.mongodb.net/daily-report?retryWrites=true&w=majority&appName=Cluster0';

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📖 Current .env content:');
    console.log(envContent);
} catch (error) {
    console.log('📄 Creating new .env file...');
}

// Replace or add the MONGODB_URI
if (envContent.includes('MONGODB_URI=')) {
    // Replace existing MONGODB_URI
    envContent = envContent.replace(/MONGODB_URI=.*$/m, correctUri);
    console.log('🔄 Replaced existing MONGODB_URI');
} else {
    // Add new MONGODB_URI
    envContent = correctUri + '\n';
    console.log('➕ Added new MONGODB_URI');
}

// Write back to .env file
try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ .env file updated successfully!');
    console.log('📝 New content:');
    console.log(envContent);
} catch (error) {
    console.error('❌ Failed to write .env file:', error);
}
