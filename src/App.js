import React, { useState, useEffect, useCallback } from 'react';
import CustomerForm from './components/CustomerForm';
import CustomerList from './components/CustomerList';
import SearchBar from './components/SearchBar';
import { customerService } from './services/customerService';
import { FaUsers, FaDatabase, FaDesktop, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

function App() {
  const [customers, setCustomers] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  /**
   * Load customers from SQLite via IPC
   */
  const loadCustomers = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      const response = query.trim()
        ? await customerService.search(query)
        : await customerService.getAll();

      if (response.success) {
        setCustomers(response.data || []);
      } else {
        showToast(response.error || 'Failed to fetch customer records', 'danger');
      }
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCustomers();
    customerService.getDbInfo().then(res => {
      if (res.success) setDbInfo(res.data);
    });
  }, [loadCustomers]);

  // Handle Search input change with debounce
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    loadCustomers(val);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadCustomers('');
  };

  // Add Customer (INSERT)
  const handleSave = async (formData) => {
    setIsLoading(true);
    try {
      const response = await customerService.create(formData);
      if (response.success) {
        showToast(response.message || 'Customer saved successfully!', 'success');
        loadCustomers(searchQuery);
      } else {
        showToast(response.error || 'Failed to add customer', 'danger');
      }
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Update Customer (UPDATE)
  const handleUpdate = async (id, formData) => {
    setIsLoading(true);
    try {
      const response = await customerService.update(id, formData);
      if (response.success) {
        showToast(response.message || 'Customer updated successfully!', 'success');
        setCurrentCustomer(null);
        loadCustomers(searchQuery);
      } else {
        showToast(response.error || 'Failed to update customer', 'danger');
      }
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Customer (DELETE)
  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      const response = await customerService.delete(id);
      if (response.success) {
        showToast(response.message || 'Customer deleted successfully!', 'success');
        if (currentCustomer && currentCustomer.id === id) {
          setCurrentCustomer(null);
        }
        loadCustomers(searchQuery);
      } else {
        showToast(response.error || 'Failed to delete customer', 'danger');
      }
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex flex-column bg-light">
      {/* Windows Application Header */}
      <header className="desktop-header px-4 py-3 shadow-sm">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 bg-primary rounded text-white d-flex align-items-center justify-content-center">
              <FaUsers size={24} />
            </div>
            <div>
              <h4 className="mb-0 fw-bold">Customer Management System</h4>
              <small className="text-secondary opacity-75">
                Windows Desktop Application • React + Electron + SQLite (better-sqlite3)
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-dark border border-secondary text-light px-3 py-2 d-flex align-items-center gap-2">
              <FaDesktop /> Electron v33
            </span>
            <span className="badge bg-primary px-3 py-2 d-flex align-items-center gap-2">
              <FaDatabase /> SQLite (WAL Mode)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container-fluid px-4 py-4 flex-grow-1">
        {/* Notification Toast Alert */}
        {notification && (
          <div className={`alert alert-${notification.type} alert-dismissible fade show shadow-sm d-flex align-items-center gap-2 mb-4`}>
            {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            <div>{notification.message}</div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setNotification(null)}
            ></button>
          </div>
        )}

        {/* Customer Form (Add / Edit) */}
        <CustomerForm
          currentCustomer={currentCustomer}
          onSave={handleSave}
          onUpdate={handleUpdate}
          onCancelEdit={() => setCurrentCustomer(null)}
          isLoading={isLoading}
        />

        {/* Search Bar */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClear={handleClearSearch}
          totalResults={customers.length}
        />

        {/* Customer Records Table */}
        <CustomerList
          customers={customers}
          onEdit={(cust) => setCurrentCustomer(cust)}
          onDelete={handleDelete}
          isLoading={isLoading}
          selectedId={currentCustomer?.id}
        />
      </main>

      {/* Desktop Application Footer / Status Bar */}
      <footer className="bg-white border-top px-4 py-2 text-muted small d-flex justify-content-between align-items-center">
        <div>
          <span>Database: </span>
          <code className="text-primary">{dbInfo ? dbInfo.path : '%APPDATA%\\react-electron-crud\\customers.db'}</code>
        </div>
        <div>
          <span>Records: <strong>{customers.length}</strong> | Architecture: <strong>Secure IPC + ContextBridge</strong></span>
        </div>
      </footer>
    </div>
  );
}

export default App;
