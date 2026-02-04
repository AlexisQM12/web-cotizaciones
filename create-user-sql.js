const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new Database(dbPath);

// Create default user
const insert = db.prepare(`
  INSERT OR REPLACE INTO User (id, email, name, password, role, createdAt)
  VALUES (1, 'default@system.com', 'Usuario Sistema', 'none', 'admin', datetime('now'))
`);

insert.run();

console.log('✅ Usuario por defecto creado con ID 1');

db.close();
