import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
     // Allow global var reuse in dev mode
     // eslint-disable-next-line no-var
     var _mongoClientPromise: Promise<MongoClient> | null;
}

if (uri) {
     try {
          // Clean up the URI - remove extra spaces, line breaks, and trailing characters
          let cleanUri = uri.trim();

          // Remove any trailing % or other invalid characters
          cleanUri = cleanUri.replace(/[%]$/, '');

          // Remove any line breaks or extra spaces
          cleanUri = cleanUri.replace(/\s+/g, '');

          // Ensure the URI has the database name
          if (!cleanUri.includes('/daily-report')) {
               // Parse the URI to properly add database name
               const url = new URL(cleanUri);
               if (!url.pathname || url.pathname === '/') {
                    url.pathname = '/daily-report';
               }

               // Add SSL configuration for Coolify MongoDB
               if (url.hostname.includes('wccwwc0swkw4k00880kw84w8')) {
                    // Coolify MongoDB - disable SSL and add other options
                    url.searchParams.set('ssl', 'false');
                    url.searchParams.set('tls', 'false');
                    url.searchParams.set('tlsAllowInvalidCertificates', 'true');
                    url.searchParams.set('tlsAllowInvalidHostnames', 'true');
                    url.searchParams.set('directConnection', 'true');
               }

               cleanUri = url.toString();
          }

          console.log("🔧 Cleaned MongoDB URI:", cleanUri.substring(0, 50) + '...');

          if (process.env.NODE_ENV === "development") {
               if (!global._mongoClientPromise) {
                    client = new MongoClient(cleanUri);
                    global._mongoClientPromise = client.connect();
               }
               clientPromise = global._mongoClientPromise;
          } else {
               client = new MongoClient(cleanUri);
               clientPromise = client.connect();
          }

          console.log("✅ MongoDB connection initialized successfully");
     } catch (error) {
          console.error("❌ Failed to initialize MongoDB connection:", error);
          clientPromise = null;
     }
} else {
     console.warn("⚠️ MONGODB_URI not found. Using mock data fallback.");
}

export default clientPromise;
