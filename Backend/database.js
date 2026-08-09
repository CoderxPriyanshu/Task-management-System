const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT
    )`, () => {
        db.run(`ALTER TABLE users ADD COLUMN full_name TEXT`, () => {});
    });

    // Create Tasks Table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT 0,
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'To Do',
        due_date TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, () => {
        // Add columns if they don't exist (for existing tables)
        db.run(`ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'Medium'`, () => {});
        db.run(`ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'To Do'`, () => {});
        db.run(`ALTER TABLE tasks ADD COLUMN due_date TEXT`, () => {});
    });
  }
});

module.exports = db;
