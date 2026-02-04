import BetterSqlite3 from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../prisma/dev.db');
const db = new BetterSqlite3(dbPath);

export default db;
