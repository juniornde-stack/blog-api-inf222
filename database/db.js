const Database = require('better-sqlite3');

const db = new Database('./database/blog.db');

// Créer la table avec tous les champs
db.prepare(`
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        date TEXT NOT NULL
    )
`).run();

module.exports = db;
