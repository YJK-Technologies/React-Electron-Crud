/**
 * Electron Preload Script
 * Acts as a secure intermediary bridge between Renderer (React) and Main Process (Node/SQLite).
 * Enforces Context Isolation and prevents full nodeIntegration.
 */
const { contextBridge, ipcRenderer } = require('electron');

/**
 * Securely expose only required CRUD API methods under window.customerAPI
 * The React application accesses these via window.customerAPI.getAllCustomers(), etc.
 */
contextBridge.exposeInMainWorld('customerAPI', {
  /**
   * Fetch all customers from SQLite
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getAllCustomers: () => {
    return ipcRenderer.invoke('customer:getAll');
  },

  /**
   * Search customers by keyword
   * @param {string} query 
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  searchCustomers: (query) => {
    return ipcRenderer.invoke('customer:search', query);
  },

  /**
   * Get single customer by ID
   * @param {number|string} id 
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getCustomerById: (id) => {
    return ipcRenderer.invoke('customer:getById', id);
  },

  /**
   * Insert new customer
   * @param {{customer_name: string, mobile_no: string, email: string}} customerData 
   * @returns {Promise<{success: boolean, data?: Object, message?: string, error?: string}>}
   */
  createCustomer: (customerData) => {
    return ipcRenderer.invoke('customer:create', customerData);
  },

  /**
   * Update existing customer
   * @param {number|string} id 
   * @param {{customer_name: string, mobile_no: string, email: string}} customerData 
   * @returns {Promise<{success: boolean, data?: Object, message?: string, error?: string}>}
   */
  updateCustomer: (id, customerData) => {
    return ipcRenderer.invoke('customer:update', id, customerData);
  },

  /**
   * Delete customer by ID
   * @param {number|string} id 
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  deleteCustomer: (id) => {
    return ipcRenderer.invoke('customer:delete', id);
  },

  /**
   * Retrieve database metadata and path
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getDbInfo: () => {
    return ipcRenderer.invoke('customer:getDbInfo');
  }
});

console.log('[Preload] Secure customerAPI bridge exposed to window.');
