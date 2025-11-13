import { initializeDatabase, bootstrapDefaultTenant } from "./db";

// Global flag to track initialization
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export async function ensureInitialization() {
  // Skip initialization if already done
  if (isInitialized) return;

  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Run initialization in background, don't block the request
  initializationPromise = (async () => {
    try {
      console.log("🔄 Starting database initialization...");

      // Set timeout for initialization to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Initialization timeout")), 25000)
      );

      await Promise.race([
        (async () => {
          await initializeDatabase();
          await bootstrapDefaultTenant();
        })(),
        timeoutPromise,
      ]);

      isInitialized = true;
      console.log("✅ Database initialization completed");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      // Don't throw - allow app to continue even if init fails
      // The database will still work, just without indexes/default data
      isInitialized = true; // Mark as done to prevent retry loops
      initializationPromise = null;
    }
  })();

  // Don't wait for initialization - return immediately
  // This prevents timeout on first request
  return Promise.resolve();
}

// Reset initialization (useful for testing)
export function resetInitialization() {
  isInitialized = false;
  initializationPromise = null;
}
