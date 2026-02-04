const Database = require('better-sqlite3');
const path = require('path');

try {
    const dbPath = path.join(__dirname, 'prisma', 'dev.db');
    console.log('📂 Ruta de la base de datos:', dbPath);

    const db = new Database(dbPath);

    // List all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📋 Tablas en la base de datos:', tables.map(t => t.name).join(', '));

    if (tables.length === 0) {
        console.log('❌ No hay tablas. La base de datos está vacía.');
        console.log('💡 Ejecuta: npx prisma db push');
        db.close();
        process.exit(1);
    }

    // Check if User table exists
    const userTable = tables.find(t => t.name === 'User');
    if (!userTable) {
        console.log('❌ La tabla User no existe');
        db.close();
        process.exit(1);
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM User WHERE id = 1').get();

    if (existingUser) {
        console.log('✅ Usuario ya existe:', existingUser);
    } else {
        // Create user
        const insert = db.prepare(`
      INSERT INTO User (id, email, name, password, role, createdAt)
      VALUES (1, 'default@system.com', 'Usuario Sistema', 'none', 'admin', datetime('now'))
    `);

        insert.run();

        const newUser = db.prepare('SELECT * FROM User WHERE id = 1').get();
        console.log('✅ Usuario creado exitosamente:', newUser);
    }

    db.close();
    console.log('✅ Todo listo!');
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
}
