import sqlite3 from 'sqlite3';
import path from 'path';
import { DirectoryManager } from './database';

const dbPath = path.join(process.cwd(), 'course-directories.db');

export async function runMigrations(): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('Running database migrations...');
      
      db.serialize(() => {
        // Check if migrations table exists
        db.run(`
          CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Migration 1: Add category support
        db.get(
          "SELECT name FROM migrations WHERE name = 'add_category_support'",
          (err, row) => {
            if (err) {
              reject(err);
              return;
            }

            if (!row) {
              console.log('Running migration: add_category_support');
              
              // Create tables first if they don't exist
              db.run(`
                CREATE TABLE IF NOT EXISTS selected_directories (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  original_path TEXT NOT NULL UNIQUE,
                  display_name TEXT NOT NULL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `);

              // Create categories table
              db.run(`
                CREATE TABLE IF NOT EXISTS course_categories (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL UNIQUE,
                  description TEXT,
                  color TEXT DEFAULT '#3b82f6',
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `);

              // Check if category_id column exists before adding it
              db.get(
                "PRAGMA table_info(selected_directories)",
                (err, info: any) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  // Check if category_id column exists
                  db.all(
                    "PRAGMA table_info(selected_directories)",
                    (err, columns: any[]) => {
                      if (err) {
                        reject(err);
                        return;
                      }

                      const hasCategoryId = columns.some(col => col.name === 'category_id');
                      
                      if (!hasCategoryId) {
                        // Add category_id column to selected_directories
                        db.run(`
                          ALTER TABLE selected_directories 
                          ADD COLUMN category_id INTEGER REFERENCES course_categories(id)
                        `);
                      }

                      // Create folder_hierarchy table
                      db.run(`
                        CREATE TABLE IF NOT EXISTS folder_hierarchy (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          directory_id INTEGER,
                          parent_id INTEGER,
                          folder_name TEXT NOT NULL,
                          display_name TEXT,
                          folder_path TEXT NOT NULL,
                          level INTEGER DEFAULT 0,
                          sort_order INTEGER DEFAULT 0,
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          FOREIGN KEY (directory_id) REFERENCES selected_directories (id) ON DELETE CASCADE,
                          FOREIGN KEY (parent_id) REFERENCES folder_hierarchy (id) ON DELETE CASCADE
                        )
                      `);

                      // Create chapters table
                      db.run(`
                        CREATE TABLE IF NOT EXISTS chapters (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          directory_id INTEGER,
                          folder_id INTEGER,
                          name TEXT NOT NULL,
                          filename TEXT NOT NULL,
                          path TEXT NOT NULL,
                          original_path TEXT,
                          type TEXT DEFAULT 'html',
                          sort_order INTEGER DEFAULT 0,
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          FOREIGN KEY (directory_id) REFERENCES selected_directories (id) ON DELETE CASCADE,
                          FOREIGN KEY (folder_id) REFERENCES folder_hierarchy (id) ON DELETE SET NULL
                        )
                      `);

                      // Mark migration as completed
                      db.run(
                        "INSERT INTO migrations (name) VALUES ('add_category_support')",
                        (err) => {
                          if (err) {
                            reject(err);
                          } else {
                            console.log('Migration completed: add_category_support');
                            db.close((closeErr) => {
                              if (closeErr) {
                                reject(closeErr);
                              } else {
                                resolve();
                              }
                            });
                          }
                        }
                      );
                    }
                  );
                }
              );
            } else {
              console.log('Migration already applied: add_category_support');
              db.close((closeErr) => {
                if (closeErr) {
                  reject(closeErr);
                } else {
                  resolve();
                }
              });
            }
          }
        );
      });
    });
  });
}