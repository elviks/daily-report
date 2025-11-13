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
    cleanUri = cleanUri.replace(/[%]$/, "");

    // Remove any line breaks or extra spaces
    cleanUri = cleanUri.replace(/\s+/g, "");

    // Ensure the URI has the database name if needed
    if (
      !cleanUri.includes("/dailyreport") &&
      !cleanUri.includes("/daily-report")
    ) {
      // Parse the URI to properly add database name
      const url = new URL(cleanUri);
      if (!url.pathname || url.pathname === "/") {
        url.pathname = "/dailyreport";
      }
      cleanUri = url.toString();
    }

    console.log("🔧 Cleaned MongoDB URI:", cleanUri.substring(0, 50) + "...");

    // Check if this is MongoDB Atlas (cloud) or local MongoDB
    const isAtlas =
      cleanUri.includes("mongodb.net") || cleanUri.includes("mongodb+srv");
    const isLocal =
      cleanUri.includes("localhost") ||
      cleanUri.includes("127.0.0.1") ||
      cleanUri.includes("db:27017");

    // Configure connection options based on MongoDB type
    let connectionOptions: any = {};

    if (isAtlas) {
      // MongoDB Atlas configuration - optimized for production
      connectionOptions = {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        retryWrites: true,
        w: "majority",
        directConnection: false,
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 120000,
        serverSelectionTimeoutMS: 30000, // Increased from 15s to 30s
        socketTimeoutMS: 120000, // Increased from 60s to 120s
        connectTimeoutMS: 30000, // Increased from 20s to 30s
        heartbeatFrequencyMS: 10000,
        retryReads: true,
        maxStalenessSeconds: 120,
      };
      console.log("🌐 Detected MongoDB Atlas connection");
    } else if (isLocal) {
      // Local MongoDB configuration with security - optimized for production
      connectionOptions = {
        ssl: false,
        tls: false,
        retryWrites: true,
        w: "majority",
        directConnection: false,
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 120000,
        serverSelectionTimeoutMS: 30000, // Increased from 15s to 30s
        socketTimeoutMS: 120000, // Increased from 60s to 120s
        connectTimeoutMS: 30000, // Increased from 20s to 30s
        heartbeatFrequencyMS: 10000,
        retryReads: true,
        maxStalenessSeconds: 120,
        // Security options for local MongoDB
        authSource: "admin",
        authMechanism: "SCRAM-SHA-256",
      };
      console.log("🏠 Detected local MongoDB connection with authentication");
    } else {
      // Default configuration for other cases - optimized for production
      connectionOptions = {
        retryWrites: true,
        w: "majority",
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 120000,
        serverSelectionTimeoutMS: 30000, // Increased from 15s to 30s
        socketTimeoutMS: 120000, // Increased from 60s to 120s
        connectTimeoutMS: 30000, // Increased from 20s to 30s
        heartbeatFrequencyMS: 10000,
        retryReads: true,
        maxStalenessSeconds: 120,
      };
      console.log("🔧 Using default MongoDB connection options");
    }

    // Security validation
    if (!cleanUri.includes("@") && !isAtlas) {
      console.warn(
        "⚠️  WARNING: MongoDB connection string does not include authentication credentials!"
      );
      console.warn(
        "⚠️  This could expose your database to unauthorized access!"
      );
    }

    if (process.env.NODE_ENV === "development") {
      if (!global._mongoClientPromise) {
        client = new MongoClient(cleanUri, connectionOptions);
        global._mongoClientPromise = client.connect();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      client = new MongoClient(cleanUri, connectionOptions);
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
