# Windows Desktop Application with React, Electron, Node.js and SQLite

A production-ready Windows Desktop Customer Management application built with **React.js (Create React App)**, **Electron.js**, **Node.js Main Process**, **Secure IPC Communication (ContextBridge)**, and an embedded **SQLite Database (better-sqlite3)**. Packaged into a standalone Windows installer (`.exe`) with **electron-builder**.

---

## 📑 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Why React + Electron? Comparison with Web Stack](#2-why-react--electron-comparison-with-web-stack)
3. [Simple Explanation in Tamil / Tanglish (தமிழ் விளக்கம்)](#3-simple-explanation-in-tamil--tanglish-தமிழ்-விளக்கம்)
4. [Electron Core Concepts: Main vs Renderer vs Preload](#4-electron-core-concepts-main-vs-renderer-vs-preload)
5. [Complete CRUD IPC Workflow (Sequence Diagrams)](#5-complete-crud-ipc-workflow)
6. [Electron Security Best Practices](#6-electron-security-best-practices)
7. [Database Storage & Backup / Restore Guide](#7-database-storage--backup--restore-guide)
8. [Step-by-Step Installation & Local Execution](#8-step-by-step-installation--local-execution)
9. [Windows Installer Build (.exe) & Native Rebuild Guide](#9-windows-installer-build-exe--native-rebuild-guide)
10. [Troubleshooting Common Issues](#10-troubleshooting-common-issues)

---

## 1. Overview & Architecture

### High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                           WINDOWS OPERATING SYSTEM                                |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                  ELECTRON DESKTOP RUNTIME (Single .exe)                     |  |
|  |                                                                             |  |
|  |   [ RENDERER PROCESS ]                     [ PRELOAD SCRIPT ]               |  |
|  |   (Chromium Engine)                        (Secure Context Isolation)       |  |
|  |                                                                             |  |
|  |   +-----------------------+                +-------------------------+      |  |
|  |   | React.js Application  |                | contextBridge           |      |  |
|  |   | - CustomerForm.js     |                | exposeInMainWorld()     |      |  |
|  |   | - CustomerList.js     | -------------> | window.customerAPI:     |      |  |
|  |   | - SearchBar.js        |  method calls  | - getAllCustomers()     |      |  |
|  |   | - customerService.js  |                | - createCustomer()      |      |  |
|  |   +-----------------------+                | - updateCustomer()      |      |  |
|  |                                            | - deleteCustomer()      |      |  |
|  |                                            +-------------------------+      |  |
|  |                                                         |                   |  |
|  |                                           ipcRenderer.invoke()              |  |
|  |                                                         v                   |  |
|  |   ==================== IPC BRIDGE (Channel: customer:*) =================   |  |
|  |                                                         |                   |  |
|  |                                           ipcMain.handle()                  |  |
|  |                                                         v                   |  |
|  |   [ MAIN PROCESS ]                                                          |  |
|  |   (Node.js Runtime)                                                         |  |
|  |   +---------------------------------------------------------------------+   |  |
|  |   | electron/main.js                                                    |   |  |
|  |   | - Window Lifecycle Management                                       |   |  |
|  |   | - Parameterized SQL Query Validation                                |   |  |
|  |   | - better-sqlite3 Driver                                             |   |  |
|  |   +---------------------------------------------------------------------+   |  |
|  |                                                         |                   |  |
|  |                                        Direct synchronous C++ binding      |  |
|  |                                                         v                   |  |
|  |   [ EMBEDDED SQLITE DATABASE ]                                              |  |
|  |   File: %APPDATA%/react-electron-crud/customers.db                          |  |
|  |   - Table: customers (id, customer_name, mobile_no, email, dates)          |  |
|  |   - Journal Mode: WAL (Write-Ahead Logging) for high concurrency           |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Why React + Electron? Comparison with Web Stack

If you already know **React + Node.js + Express.js + SQL Server**, this comparison will make Electron instantly clear:

| Aspect | Traditional Web Application | Electron Desktop Application |
| :--- | :--- | :--- |
| **Frontend** | React running in user's browser (Chrome, Edge, etc.) | React running in embedded Chromium window |
| **Backend** | Express.js server hosted on AWS/Heroku/VPS | Electron `main.js` running locally on Node.js |
| **Network Protocol** | HTTP / REST API (`fetch('http://api.com/customers')`) | Inter-Process Communication (IPC: `ipcRenderer.invoke()`) |
| **Database** | SQL Server / MySQL on a remote server | SQLite embedded file (`customers.db`) on client's PC |
| **Latency** | 50ms - 300ms over internet | Sub-millisecond (0.1ms - 2ms) local IPC & C++ binding |
| **Offline Support** | Requires Service Workers / Cache | 100% Offline by default. Works with no internet. |
| **Distribution** | Hosted URL (e.g. `https://myapp.com`) | Windows Installer (`.exe` NSIS package) |
| **Hardware Access** | Strictly sandboxed by browser | Full access to OS filesystem, printers, USB, tray |

---

## 3. Simple Explanation in Tamil / Tanglish (தமிழ் விளக்கம்)

### நீங்கள் ஏற்கனவே React + Express.js + SQL Server படித்து இருந்தால்:

1. **Web App-ல் என்ன நடக்கும்?**
   - React UI-ல் ஒரு Form Submit பண்ணும்போது `fetch()` மூலமாக Express.js API-க்கு HTTP Request (`POST /api/customers`) அனுப்புவீர்கள்.
   - Express backend Server-ல் உள்ள SQL Server-க்கு Query அனுப்பி data save பண்ணும்.

2. **Electron Desktop App-ல் என்ன வித்தியாசம்?**
   - இங்கே நமக்கு External Server தேவையில்லை!
   - உங்களின் கம்ப்யூட்டரிலேயே (Client Machine) இரண்டு processes இயங்கும்:
     - **Renderer Process:** இது வெறும் Browser window மாதிரி. React components (HTML, CSS, Bootstrap) இங்கே load ஆகும்.
     - **Main Process:** இது உங்க கம்ப்யூட்டருக்குள்ளேயே ஓடும் Node.js backend.
   - React-ல் இருந்து Node.js-க்கு பேச **HTTP தேவையில்லை**. அதற்கு பதிலாக **IPC (Inter-Process Communication)** என்ற அதிவேக channel பயன்படும்.
   - SQL Server-க்கு பதிலாக **SQLite** என்ற single-file database உங்கள் கம்ப்யூட்டரின் `AppData` ஃபோல்டருக்குள் உருவாகும்.

3. **Preload.js ஏன் முக்கியம்?**
   - React-க்குள் நேரடியாக `require('fs')` அல்லது `require('better-sqlite3')` போட்டால் Security issue வரும் (XSS attack).
   - அதனால் **Preload.js** ஒரு பாதுகாப்பு சுவராக (Security Guard) இருந்து, React-க்கு தேவையான 5 methods மட்டும் (`createCustomer`, `getAllCustomers`, etc.) `contextBridge` மூலமாக கொடுக்கும்.

4. **better-sqlite3 ஏன் best?**
   - இது C++ native addon ஆக இயங்குவதால், மற்ற node-sqlite library-களை விட 10x மடங்கு வேகம் (sub-millisecond latency).

---

## 4. Electron Core Concepts: Main vs Renderer vs Preload

### 1. Main Process (`electron/main.js`)
- The entry point specified in `package.json` (`"main": "electron/main.js"`).
- Has full Node.js runtime permissions: filesystem, OS APIs, native modules.
- Creates and controls the `BrowserWindow`.
- Initializes SQLite database using `better-sqlite3`.
- Listens for IPC events using `ipcMain.handle('channel', callback)`.

### 2. Renderer Process (`src/App.js`, `src/components/*`)
- Responsible for rendering the UI using React, Bootstrap, and CSS.
- Runs inside Chromium with **`contextIsolation: true`** and **`nodeIntegration: false`**.
- Cannot directly access SQLite or the filesystem.
- Invokes methods exposed via `window.customerAPI`.

### 3. Preload Script (`electron/preload.js`)
- Executes before the web page is loaded into the browser window.
- Has access to both Node.js APIs and the DOM.
- Uses `contextBridge.exposeInMainWorld('customerAPI', { ... })` to selectively expose safe methods.
- Protects the application by never exposing the raw `ipcRenderer` instance.

---

## 5. Complete CRUD IPC Workflow

### Sequence Flow: Insert Customer

```
[React: CustomerForm.js]
       |
       | 1. User fills Name, Mobile, Email and clicks "Save Customer"
       | 2. Client-side validation succeeds
       v
[src/services/customerService.js]
       |
       | 3. Calls window.customerAPI.createCustomer(formData)
       v
[electron/preload.js]
       |
       | 4. ipcRenderer.invoke('customer:create', customerData)
       v
======================= IPC CHANNEL 'customer:create' =======================
       v
[electron/main.js]
       |
       | 5. ipcMain.handle('customer:create') intercepts payload
       | 6. Server-side validation of inputs
       | 7. Parameterized SQL execution:
       |    db.prepare('INSERT INTO customers (...) VALUES (?, ?, ?)')
       |    stmt.run(...)
       | 8. SQLite writes record to %APPDATA%/react-electron-crud/customers.db
       | 9. Returns { success: true, data: newRecord }
       v
======================= IPC RESPONSE =========================================
       v
[src/services/customerService.js]
       |
       | 10. Resolves Promise with response data
       v
[React: App.js]
       |
       | 11. Displays green Success Toast
       | 12. Triggers loadCustomers() to refresh CustomerList.js table
```

---

## 6. Electron Security Best Practices

This project implements all official Electron security recommendations:

1. **`contextIsolation: true`**: Isolates the preload context from the React website window context so website scripts cannot inspect or modify preload prototypes.
2. **`nodeIntegration: false`**: Renderer cannot call `require()` or execute Node.js shell commands.
3. **Parameterized SQL Queries**: All SQLite queries use `?` placeholders or named parameters (`@name`), completely neutralizing SQL Injection attacks.
4. **No Raw IPC Exposure**: Preload exposes only specific functions (`createCustomer`), never exposing `ipcRenderer.send()` directly to React.
5. **Data Validation on Both Sides**: Frontend validates for instant user feedback; Main process validates before database execution.

---

## 7. Database Storage & Backup / Restore Guide

### 1. Where is the database stored?
The database file is stored in Electron's **`userData`** directory:
```
Windows: C:\Users\<YourUsername>\AppData\Roaming\react-electron-crud\customers.db
```

### 2. Why NOT inside the installation folder (Program Files)?
- **Update Safety**: When you update your app to a new version via `electron-builder`, the installation folder in `Program Files` is deleted and replaced. If the database were inside it, **all customer data would be lost**.
- **Windows Permission Restrictions**: `C:\Program Files` requires Administrator permissions to write. Standard users would crash the app with `EACCES: permission denied`.
- `userData` is the standard Windows location designed for persistent user documents.

### 3. How to Backup the Database
Simply copy the SQLite file:
```bat
copy "%APPDATA%\react-electron-crud\customers.db" "D:\Backups\customers_backup.db"
```

### 4. How to Restore the Database
1. Close the application.
2. Replace `%APPDATA%\react-electron-crud\customers.db` with your backup file.
3. Relaunch the application. All records will be restored!

---

## 8. Step-by-Step Installation & Local Execution

### Prerequisites
- **Node.js** (v18, v20 or v22 LTS recommended)
- **npm** (comes with Node.js)
- **Windows 10 / 11**

### Step 1: Install Dependencies
```bash
npm install
```
*(Note: `npm install` automatically triggers `postinstall` which prepares `better-sqlite3` for Electron).*

### Step 2: Run in Development Mode
```bash
npm run dev
```
This concurrently starts:
1. Create React App development server on `http://localhost:3000`.
2. Waits until the server responds.
3. Launches the Electron desktop window loading the live React app!

---

## 9. Windows Installer Build (.exe) & Native Rebuild Guide

### 1. Build the Windows Installer
Run the packaging command:
```bash
npm run dist:win
```

### What Happens During Build:
1. `npm run build` executes React's production build into `/build`.
2. `electron-builder` packages the React build, `electron/main.js`, `electron/preload.js`, and the native `better-sqlite3` module into an **NSIS Windows Installer**:
```
release/
    ├── Customer Management System-Setup-1.0.0.exe  <-- Windows Installer
    └── win-unpacked/                               <-- Portable unpacked folder
```

### 2. Installing and Running on Windows:
1. Double-click `Customer Management System-Setup-1.0.0.exe`.
2. Choose installation folder (or accept default).
3. The installer creates a desktop shortcut and a Start Menu icon.
4. Launch the application!

### 3. Native Rebuild Guide (better-sqlite3)
Since `better-sqlite3` contains compiled C++ code, its Node ABI version must match Electron's internal Node ABI.
If you ever upgrade your Electron version or see the error `The module was compiled against a different Node.js version`, run:

```bash
npm run rebuild
```
or manually:
```bash
npx @electron/rebuild -f -w better-sqlite3
```

---

## 10. Troubleshooting Common Issues

### Issue 1: "The module 'better_sqlite3.node' was compiled against a different Node.js version"
- **Cause**: Node.js ABI mismatch between your machine's global Node and Electron's internal Node.
- **Solution**: Run `npm run rebuild`.

### Issue 2: "TypeError: window.customerAPI is undefined"
- **Cause**: Preload script path was incorrect or `contextIsolation` was disabled.
- **Solution**: Ensure `webPreferences.preload` uses `path.join(__dirname, 'preload.js')`.

### Issue 3: "White screen in production build"
- **Cause**: Relative asset paths missing in React.
- **Solution**: Ensure `"homepage": "./"` is present in `package.json`.

---

© 2026 Windows Desktop Architecture Solutions. All Rights Reserved.
