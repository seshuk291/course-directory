import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'course-directories.db');

// Initialize database
export function initDatabase(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create tables
      db.serialize(() => {
        // Table for selected directories
        db.run(`
          CREATE TABLE IF NOT EXISTS selected_directories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_path TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Table for custom file/folder names
        db.run(`
          CREATE TABLE IF NOT EXISTS custom_names (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            directory_id INTEGER,
            file_path TEXT NOT NULL,
            original_name TEXT NOT NULL,
            custom_name TEXT NOT NULL,
            is_directory BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (directory_id) REFERENCES selected_directories (id) ON DELETE CASCADE
          )
        `);
        
        resolve(db);
      });
    });
  });
}

export interface SelectedDirectory {
  id: number;
  original_path: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface CustomName {
  id: number;
  directory_id: number;
  file_path: string;
  original_name: string;
  custom_name: string;
  is_directory: boolean;
  created_at: string;
  updated_at: string;
}

export class DirectoryManager {
  private db: sqlite3.Database | null = null;

  async init() {
    this.db = await initDatabase();
  }

  async addDirectory(originalPath: string, displayName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO selected_directories (original_path, display_name, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([originalPath, displayName], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  async getSelectedDirectories(): Promise<SelectedDirectory[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(
        'SELECT * FROM selected_directories ORDER BY display_name',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as SelectedDirectory[]);
          }
        }
      );
    });
  }

  async removeDirectory(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run('DELETE FROM selected_directories WHERE id = ?', [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async setCustomName(directoryId: number, filePath: string, originalName: string, customName: string, isDirectory: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO custom_names 
        (directory_id, file_path, original_name, custom_name, is_directory, updated_at) 
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([directoryId, filePath, originalName, customName, isDirectory], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
      
      stmt.finalize();
    });
  }

  async getCustomNames(directoryId: number): Promise<CustomName[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(
        'SELECT * FROM custom_names WHERE directory_id = ?',
        [directoryId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as CustomName[]);
          }
        }
      );
    });
  }

  async close() {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}