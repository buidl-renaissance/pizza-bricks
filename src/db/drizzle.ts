import path from 'path';
import { existsSync } from 'fs';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import * as schema from './schema';

// Load environment variables from .env.local or .env
config({ path: '.env.local' });
config({ path: '.env' });

// Resolve local DB path so it matches where drizzle-kit push writes (same dir as package.json)
function getLocalDbPath(): string {
  const cwd = process.cwd();
  const inMonorepo = path.join(cwd, 'app-blocks', 'pizza-bricks', 'package.json');
  const dbDir = existsSync(inMonorepo) ? path.join(cwd, 'app-blocks', 'pizza-bricks') : cwd;
  return path.join(dbDir, 'dev.sqlite3');
}

// Create Turso client with singleton pattern for Next.js hot reloading
let tursoClient: ReturnType<typeof createClient> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getTursoClient() {
  if (tursoClient) {
    return tursoClient;
  }

  const useLocal = process.env.USE_LOCAL === 'true';
  const url = process.env.TURSO_DATABASE_URL || 'file:./dev.sqlite3';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // Use local file-based SQLite if USE_LOCAL is set or no auth token
  if (useLocal || !authToken) {
    const localPath = getLocalDbPath();
    const localUrl = `file:${localPath}`;
    console.log('📁 Using local SQLite database:', localUrl);
    tursoClient = createClient({ url: localUrl });
  } else {
    console.log('☁️ Using remote Turso database');
    tursoClient = createClient({ url, authToken });
  }

  return tursoClient;
}

// Create drizzle instance with singleton pattern
export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const client = getTursoClient();
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

// Export db for backwards compatibility
export const db = getDb();

export type Database = typeof db;
