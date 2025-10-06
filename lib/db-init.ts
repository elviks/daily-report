import { initializeDatabase, bootstrapDefaultTenant } from './db';

// Global flag to track initialization
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export async function ensureInitialization() {
  if (isInitialized) return;
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      await initializeDatabase();
      await bootstrapDefaultTenant();
      isInitialized = true;
      console.log('✅ Database initialization completed');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      initializationPromise = null; // Allow retry
      throw error;
    }
  })();
  
  return initializationPromise;
}

// Reset initialization (useful for testing)
export function resetInitialization() {
  isInitialized = false;
  initializationPromise = null;
}
