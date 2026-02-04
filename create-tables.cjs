const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
console.log('📂 Creando tablas en:', dbPath);

const db = new Database(dbPath);

// Create tables manually
db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Template (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Quotation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    clientName TEXT,
    clientAddress TEXT,
    clientEmail TEXT,
    total REAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    authorId INTEGER NOT NULL,
    templateId INTEGER,
    FOREIGN KEY (authorId) REFERENCES User(id),
    FOREIGN KEY (templateId) REFERENCES Template(id)
  );

  CREATE TABLE IF NOT EXISTS QuotationItem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    quotationId INTEGER NOT NULL,
    FOREIGN KEY (quotationId) REFERENCES Quotation(id) ON DELETE CASCADE
  );
`);

console.log('✅ Tablas creadas');

// Create default user
const insert = db.prepare(`
  INSERT OR REPLACE INTO User (id, email, name, password, role, createdAt)
  VALUES (1, 'default@system.com', 'Usuario Sistema', 'none', 'admin', datetime('now'))
`);

insert.run();

const user = db.prepare('SELECT * FROM User WHERE id = 1').get();
console.log('✅ Usuario creado:', user);

db.close();
console.log('✅ Base de datos lista!');
