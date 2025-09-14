import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'app.db');

// Ensure data directory exists
import { mkdirSync } from 'fs';
const dataDir = path.join(process.cwd(), 'data');
try {
  mkdirSync(dataDir, { recursive: true });
} catch (error) {
  // Directory might already exist
}

const db = new Database(dbPath);

// Create global_settings table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS global_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create sites table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_name TEXT NOT NULL,
    site_path TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'In Progress',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create setup_logs table for tracking progress
db.exec(`
  CREATE TABLE IF NOT EXISTS setup_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    step TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites (id)
  )
`);

// Database utility functions
export const dbUtils = {
  // Get a setting value
  getSetting: (key: string): string | null => {
    const stmt = db.prepare('SELECT value FROM global_settings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result ? result.value : null;
  },

  // Set a setting value
  setSetting: (key: string, value: string): void => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO global_settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(key, value);
  },

  // Check if a setting exists
  hasSetting: (key: string): boolean => {
    const stmt = db.prepare('SELECT 1 FROM global_settings WHERE key = ?');
    const result = stmt.get(key);
    return !!result;
  },

  // Get all settings
  getAllSettings: (): Record<string, string> => {
    const stmt = db.prepare('SELECT key, value FROM global_settings');
    const results = stmt.all() as { key: string; value: string }[];
    return results.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  },

  // Sites functions
  createSite: (siteName: string, sitePath: string): number => {
    const stmt = db.prepare(`
            INSERT INTO sites (site_name, site_path, status) 
            VALUES (?, ?, 'In Progress')
        `);
    const result = stmt.run(siteName, sitePath);
    return result.lastInsertRowid as number;
  },

  updateSiteStatus: (siteId: number, status: 'In Progress' | 'Active' | 'Failed'): void => {
    const stmt = db.prepare(`
            UPDATE sites 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
    stmt.run(status, siteId);
  },

  getSite: (siteId: number) => {
    const stmt = db.prepare('SELECT * FROM sites WHERE id = ?');
    return stmt.get(siteId);
  },

  getAllSites: () => {
    const stmt = db.prepare('SELECT * FROM sites ORDER BY created_at DESC');
    return stmt.all();
  },

  // Setup logs functions
  addLog: (siteId: number, step: string, status: 'pending' | 'in_progress' | 'completed' | 'failed', message?: string): void => {
    const stmt = db.prepare(`
            INSERT INTO setup_logs (site_id, step, status, message) 
            VALUES (?, ?, ?, ?)
        `);
    stmt.run(siteId, step, status, message || null);
  },

  getLogs: (siteId: number) => {
    const stmt = db.prepare(`
            SELECT * FROM setup_logs 
            WHERE site_id = ? 
            ORDER BY created_at ASC
        `);
    return stmt.all(siteId);
  }
};

export default db;
