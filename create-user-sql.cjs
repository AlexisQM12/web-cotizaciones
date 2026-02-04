const Database = require('better-sqlite3');
const path = require('path');

try {
    const dbPath = path.join(__dirname, 'prisma', 'dev.db');
    console.log('Conectando a:', dbPath);

    const db = new Database(dbPath);

    // Check if table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='User'").all();
    console.log('Tablas encontradas:', tables);

    if (tables.length === 0) {
        console.log('❌ La tabla User no existe. Ejecuta: npx prisma db push');
        process.exit(1);
    }

    // Create default user
    const insert = db.prepare(`
    INSERT OR REPLACE INTO User (id, email, name, password, role, createdAt)
    VALUES (1, 'default@system.com', 'Usuario Sistema', 'none', 'admin', datetime('now'))
  `);

    insert.run();

    // Verify
    const user = db.prepare('SELECT * FROM User WHERE id = 1').get();
    console.log('✅ Usuario creado:', user);

    db.close();
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
