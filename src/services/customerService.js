/**
 * Customer Service Layer
 * Clean abstraction layer between React Components and Electron Preload API.
 * 
 * In Electron Desktop environment:
 *   Calls window.customerAPI which communicates via IPC to Electron Main process.
 * In Standalone Web Preview / Testing:
 *   Falls back gracefully with informative mock handling or localStorage so developers
 *   can preview the React interface in standard browsers.
 */

const isElectron = Boolean(window && window.customerAPI);

export const customerService = {
  /**
   * Fetch all customer records
   */
  async getAll() {
    if (isElectron) {
      return await window.customerAPI.getAllCustomers();
    }
    // Web development fallback
    const stored = localStorage.getItem('electron_demo_customers');
    const data = stored ? JSON.parse(stored) : [];
    return { success: true, data };
  },

  /**
   * Search customers by text query
   */
  async search(query) {
    if (isElectron) {
      return await window.customerAPI.searchCustomers(query);
    }
    // Web fallback filter
    const stored = localStorage.getItem('electron_demo_customers');
    const all = stored ? JSON.parse(stored) : [];
    const q = (query || '').toLowerCase().trim();
    if (!q) return { success: true, data: all };
    const filtered = all.filter(c => 
      c.customer_name.toLowerCase().includes(q) ||
      (c.mobile_no && c.mobile_no.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      String(c.id).includes(q)
    );
    return { success: true, data: filtered };
  },

  /**
   * Get single customer by ID
   */
  async getById(id) {
    if (isElectron) {
      return await window.customerAPI.getCustomerById(id);
    }
    const stored = localStorage.getItem('electron_demo_customers');
    const all = stored ? JSON.parse(stored) : [];
    const found = all.find(c => c.id === Number(id));
    return found 
      ? { success: true, data: found }
      : { success: false, error: 'Customer not found' };
  },

  /**
   * Create new customer in SQLite
   */
  async create(customerData) {
    if (isElectron) {
      return await window.customerAPI.createCustomer(customerData);
    }
    const stored = localStorage.getItem('electron_demo_customers');
    const all = stored ? JSON.parse(stored) : [];
    const newId = all.length > 0 ? Math.max(...all.map(c => c.id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newCust = {
      id: newId,
      customer_name: customerData.customer_name,
      mobile_no: customerData.mobile_no || '',
      email: customerData.email || '',
      created_at: now,
      updated_at: null
    };
    all.unshift(newCust);
    localStorage.setItem('electron_demo_customers', JSON.stringify(all));
    return { success: true, data: newCust, message: 'Customer added successfully!' };
  },

  /**
   * Update existing customer
   */
  async update(id, customerData) {
    if (isElectron) {
      return await window.customerAPI.updateCustomer(id, customerData);
    }
    const stored = localStorage.getItem('electron_demo_customers');
    let all = stored ? JSON.parse(stored) : [];
    const index = all.findIndex(c => c.id === Number(id));
    if (index === -1) {
      return { success: false, error: 'Customer record not found.' };
    }
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    all[index] = {
      ...all[index],
      customer_name: customerData.customer_name,
      mobile_no: customerData.mobile_no || '',
      email: customerData.email || '',
      updated_at: now
    };
    localStorage.setItem('electron_demo_customers', JSON.stringify(all));
    return { success: true, data: all[index], message: 'Customer updated successfully!' };
  },

  /**
   * Delete customer by ID
   */
  async delete(id) {
    if (isElectron) {
      return await window.customerAPI.deleteCustomer(id);
    }
    const stored = localStorage.getItem('electron_demo_customers');
    let all = stored ? JSON.parse(stored) : [];
    const filtered = all.filter(c => c.id !== Number(id));
    localStorage.setItem('electron_demo_customers', JSON.stringify(filtered));
    return { success: true, message: `Customer ID #${id} deleted successfully!` };
  },

  /**
   * Get database information and location
   */
  async getDbInfo() {
    if (isElectron) {
      return await window.customerAPI.getDbInfo();
    }
    return {
      success: true,
      data: {
        path: '%APPDATA%\\react-electron-crud\\customers.db',
        totalCustomers: 0,
        platform: 'win32 (Simulated)',
        nodeVersion: '20.18.0',
        electronVersion: '33.2.1'
      }
    };
  }
};
