import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrations';

const dbPath = path.join(process.cwd(), 'course-directories.db');

// Initialize database
export function initDatabase(): Promise<sqlite3.Database> {
  return new Promise(async (resolve, reject) => {
    try {
      // Run migrations first
      await runMigrations();
    } catch (migrationError) {
      console.error('Migration failed:', migrationError);
      // Continue with database initialization even if migrations fail
    }

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create tables (will be skipped if they already exist)
      db.serialize(() => {
        // Table for course categories
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
        
        // Table for selected directories
        db.run(`
          CREATE TABLE IF NOT EXISTS selected_directories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_path TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            category_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES course_categories (id) ON DELETE SET NULL
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
        
        // Table for folder hierarchy (for organizing course content)
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
        
        resolve(db);
      });
    });
  });
}

export interface SelectedDirectory {
  id: number;
  original_path: string;
  display_name: string;
  category_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CourseCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface FolderHierarchy {
  id: number;
  directory_id: number;
  parent_id?: number;
  folder_name: string;
  display_name?: string;
  folder_path: string;
  level: number;
  sort_order: number;
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

  async addDirectory(originalPath: string, displayName: string, categoryId?: number): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO selected_directories (original_path, display_name, category_id, updated_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([originalPath, displayName, categoryId || null], function(err) {
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

  async updateDirectory(id: number, displayName: string, categoryId?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const stmt = this.db.prepare(`
        UPDATE selected_directories 
        SET display_name = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run([displayName, categoryId || null, id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
      
      stmt.finalize();
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

  // Category management methods
  async createCategory(name: string, description?: string, color: string = '#3b82f6'): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const stmt = this.db.prepare(`
        INSERT INTO course_categories (name, description, color) 
        VALUES (?, ?, ?)
      `);
      
      stmt.run([name, description || null, color], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  async getCategories(): Promise<CourseCategory[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(
        'SELECT * FROM course_categories ORDER BY name',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as CourseCategory[]);
          }
        }
      );
    });
  }

  async updateCategory(id: number, name: string, description?: string, color?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const stmt = this.db.prepare(`
        UPDATE course_categories 
        SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run([name, description || null, color || '#3b82f6', id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
      
      stmt.finalize();
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run('DELETE FROM course_categories WHERE id = ?', [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Folder hierarchy methods
  async createFolderHierarchy(directoryId: number, folderName: string, folderPath: string, parentId?: number, displayName?: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Calculate level based on parent
      let level = 0;
      if (parentId) {
        this.db.get(
          'SELECT level FROM folder_hierarchy WHERE id = ?',
          [parentId],
          (err, row: any) => {
            if (err) {
              reject(err);
              return;
            }
            if (row) {
              level = row.level + 1;
            }
            
            const stmt = this.db!.prepare(`
              INSERT INTO folder_hierarchy (directory_id, parent_id, folder_name, display_name, folder_path, level) 
              VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([directoryId, parentId || null, folderName, displayName || null, folderPath, level], function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(this.lastID);
              }
            });
            
            stmt.finalize();
          }
        );
      } else {
        const stmt = this.db.prepare(`
          INSERT INTO folder_hierarchy (directory_id, parent_id, folder_name, display_name, folder_path, level) 
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([directoryId, null, folderName, displayName || null, folderPath, level], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
        
        stmt.finalize();
      }
    });
  }

  async getFolderHierarchy(directoryId: number): Promise<FolderHierarchy[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(
        'SELECT * FROM folder_hierarchy WHERE directory_id = ? ORDER BY level, sort_order, folder_name',
        [directoryId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as FolderHierarchy[]);
          }
        }
      );
    });
  }

  async getDirectoriesWithCategories(): Promise<(SelectedDirectory & { category?: CourseCategory })[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const query = `
        SELECT d.*, c.name as category_name, c.description as category_description, c.color as category_color
        FROM selected_directories d
        LEFT JOIN course_categories c ON d.category_id = c.id
        ORDER BY c.name, d.display_name
      `;

      this.db.all(query, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const result = rows.map(row => ({
            id: row.id,
            original_path: row.original_path,
            display_name: row.display_name,
            category_id: row.category_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            category: row.category_name ? {
              id: row.category_id,
              name: row.category_name,
              description: row.category_description,
              color: row.category_color,
              created_at: '',
              updated_at: ''
            } : undefined
          }));
          resolve(result);
        }
      });
    });
  }
}