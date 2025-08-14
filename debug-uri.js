require('dotenv').config();

const uri = process.env.MONGODB_URI;

console.log('Raw URI length:', uri?.length);
console.log('Raw URI (first 100 chars):', uri?.substring(0, 100));
console.log('Raw URI (last 100 chars):', uri?.substring(uri.length - 100));

// Check for port numbers
const portMatch = uri?.match(/:(\d+)/);
if (portMatch) {
    console.log('Found port number:', portMatch[1]);
    console.log('Port location:', uri.indexOf(portMatch[0]));
}

// Check for special characters
console.log('Contains ##:', uri?.includes('##'));
console.log('Contains @:', uri?.includes('@'));
console.log('Contains ?:', uri?.includes('?'));

// Show each character with its position
console.log('\nCharacter analysis:');
for (let i = 0; i < Math.min(uri?.length || 0, 200); i++) {
    const char = uri[i];
    if (char === ':' || char === '@' || char === '?' || char === '#' || char === '%') {
        console.log(`Position ${i}: '${char}' (code: ${char.charCodeAt(0)})`);
    }
}
