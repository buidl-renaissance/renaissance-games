import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

// Load .env.local first (takes precedence), then .env
config({ path: '.env.local' });
config({ path: '.env' });

const useLocal = !process.env.TURSO_AUTH_TOKEN || process.env.USE_LOCAL === 'true';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: useLocal ? 'sqlite' : 'turso',
  dbCredentials: useLocal
    ? { url: 'file:./dev.sqlite3' }
    : {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      },
} satisfies Config;
