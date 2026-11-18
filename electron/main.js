/**
 * Electron Main Process (Backend / Node.js Runtime)
 * Handles window creation, SQLite database operations, and IPC communication.
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const isDev = !app.isPackaged;

let mainWindow = null;
let db = null;

/**
 * Initialize SQLite Database inside user's AppData directory:
 * e.g., %APPDATA%\react-electron-crud\customers.db
 * Keeping it in userData prevents application updates from wiping customer data.
 */
function initDatabase() {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'customers.db');
    console.log('[SQLite] Database Path:', dbPath);

    // Initialize better-sqlite3 with WAL mode for speed and reliability
    db = new Database(dbPath, { verbose: isDev ? console.log : null });
    db.pragma('journal_mode = WAL');

    // Automatically create customers table if it does not exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        mobile_no TEXT,
        email TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT
      );
    `;
    db.exec(createTableQuery);

    // Seed sample data on first run if table is empty
    const count = db.prepare('SELECT COUNT(*) as total FROM customers').get().total;
    if (count === 0) {
      console.log('[SQLite] Seeding initial customer records...');
      const insertSeed = db.prepare(`
        INSERT INTO customers (customer_name, mobile_no, email, created_at)
        VALUES (@customer_name, @mobile_no, @email, datetime('now', 'localtime'))
      `);

      const seedData = [
        { customer_name: 'Rajesh Kumar', mobile_no: '9840123456', email: 'rajesh.kumar@example.com' },
        { customer_name: 'Priya Sundaram', mobile_no: '9789012345', email: 'priya.s@example.com' },
        { customer_name: 'Murugan Selvam', mobile_no: '9443219876', email: 'murugan.selvam@example.com' }
      ];

      const insertMany = db.transaction((customers) => {
        for (const cust of customers) insertSeed.run(cust);
      });
      insertMany(seedData);
    }

    console.log('[SQLite] Customer database initialized successfully.');
  } catch (error) {
    console.error('[SQLite] Failed to initialize database:', error);
  }
}

/**
 * Create the main browser window with secure configuration
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 650,
    title: 'Customer Management System - Windows Desktop',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // Security: Isolates preload scripts from renderer
      nodeIntegration: false,   // Security: Prevents renderer from directly accessing Node.js
      sandbox: false            // Allows preload to require electron modules safely
    }
  });

  // Load React CRA dev server in development or built index.html in production
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Setup IPC Handlers for Secure CRUD Communication with Renderer Process
 */
function setupIpcHandlers() {
  // 1. SELECT ALL CUSTOMERS
  ipcMain.handle('customer:getAll', async () => {
    try {
      const stmt = db.prepare('SELECT * FROM customers ORDER BY id DESC');
      const customers = stmt.all();
      return { success: true, data: customers };
    } catch (err) {
      console.error('[IPC customer:getAll Error]:', err.message);
      return { success: false, error: err.message };
    }
  });

  // 2. SEARCH CUSTOMERS
  ipcMain.handle('customer:search', async (event, query) => {
    try {
      const sanitizedQuery = (query || '').trim();
      if (!sanitizedQuery) {
        const stmt = db.prepare('SELECT * FROM customers ORDER BY id DESC');
        return { success: true, data: stmt.all() };
      }

      // Parameterized search across Name, Mobile, Email, and ID
      const stmt = db.prepare(`
        SELECT * FROM customers
        WHERE customer_name LIKE ?
           OR mobile_no LIKE ?
           OR email LIKE ?
           OR CAST(id AS TEXT) LIKE ?
        ORDER BY id DESC
      `);
      const searchPattern = `%${sanitizedQuery}%`;
      const results = stmt.all(searchPattern, searchPattern, searchPattern, searchPattern);
      return { success: true, data: results };
    } catch (err) {
      console.error('[IPC customer:search Error]:', err.message);
      return { success: false, error: err.message };
    }
  });

  // 3. GET CUSTOMER BY ID
  ipcMain.handle('customer:getById', async (event, id) => {
    try {
      const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
      const customer = stmt.get(id);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }
      return { success: true, data: customer };
    } catch (err) {
      console.error('[IPC customer:getById Error]:', err.message);
      return { success: false, error: err.message };
    }
  });

  // 4. INSERT (ADD) CUSTOMER
  ipcMain.handle('customer:create', async (event, customerData) => {
    try {
      const { customer_name, mobile_no, email } = customerData || {};

      // Server-side validation in Main Process
      if (!customer_name || customer_name.trim().length < 2) {
        return { success: false, error: 'Customer Name must be at least 2 characters.' };
      }

      // Parameterized query prevents SQL Injection
      const stmt = db.prepare(`
        INSERT INTO customers (customer_name, mobile_no, email, created_at)
        VALUES (?, ?, ?, datetime('now', 'localtime'))
      `);

      const result = stmt.run(
        customer_name.trim(),
        (mobile_no || '').trim(),
        (email || '').trim().toLowerCase()
      );

      const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
      return { success: true, data: newCustomer, message: 'Customer added successfully!' };
    } catch (err) {
      console.error('[IPC customer:create Error]:', err.message);
      return { success: false, error: err.message };
    }
  });

  // 5. UPDATE CUSTOMER
  ipcMain.handle('customer:update', async (event, id, customerData) => {
    try {
      const { customer_name, mobile_no, email } = customerData || {};

      if (!id) {
        return { success: false, error: 'Customer ID is required for update.' };
      }
      if (!customer_name || customer_name.trim().length < 2) {
        return { success: false, error: 'Customer Name must be at least 2 characters.' };
      }

      const stmt = db.prepare(`
        UPDATE customers
        SET customer_name = ?,
            mobile_no = ?,
            email = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      const result = stmt.run(
        customer_name.trim(),
        (mobile_no || '').trim(),
        (email || '').trim().toLowerCase(),
        id
      );

      if (result.changes === 0) {
        return { success: false, error: 'Customer not found or no changes made.' };
      }

      const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      return { success: true, data: updatedCustomer, message: 'Customer updated successfully!' };
    } catch (err) {
      console.error('[IPC customer:update Error]:', err.message);
      return { success: false, error: err.message };
    }
  });

  // 6. DELETE CUSTOMER
  ipcMain.handle('customer:delete', async (event, id) => {
    try {
      if (!id) {
        return { success: false, error: 'Valid Customer ID required.' };
      }

      const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        return { success: false, error: 'Customer record not found.' };
      }

      return { success: true, message: `Customer ID #${id} deleted successfully!` };
    } catch (err) {
      console.error('[IPC customer:delete Error]:', err.message);
      return { success: false, error: err.message };
    }
  });

  // 7. GET DATABASE FILE PATH & STATS
  ipcMain.handle('customer:getDbInfo', async () => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'customers.db');
      const count = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
      return {
        success: true,
        data: {
          path: dbPath,
          totalCustomers: count,
          platform: process.platform,
          nodeVersion: process.versions.node,
          electronVersion: process.versions.electron
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

// App Lifecycle
app.whenReady().then(() => {
  initDatabase();
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (db) {
    try {
      db.close();
      console.log('[SQLite] Database connection closed.');
    } catch (e) {
      console.error('[SQLite] Error closing database:', e);
    }
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
