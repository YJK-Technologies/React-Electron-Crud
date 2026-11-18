import React, { useState } from 'react';
import { FaEdit, FaTrash, FaUserSlash, FaExclamationTriangle } from 'react-icons/fa';

/**
 * CustomerList Component
 * Renders all customer records in a desktop table layout with confirmation modal for deletion.
 */
function CustomerList({ customers, onEdit, onDelete, isLoading, selectedId }) {
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const confirmDelete = () => {
    if (deleteCandidate) {
      onDelete(deleteCandidate.id);
      setDeleteCandidate(null);
    }
  };

  if (isLoading && customers.length === 0) {
    return (
      <div className="card card-desktop p-5 text-center text-muted">
        <div className="spinner-border text-primary mx-auto mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h6>Querying SQLite database via IPC...</h6>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="card card-desktop p-5 text-center text-muted">
        <FaUserSlash size={48} className="mx-auto mb-3 text-secondary opacity-50" />
        <h5 className="fw-semibold">No Customers Found</h5>
        <p className="mb-0">Add a new customer above or clear your search filter.</p>
      </div>
    );
  }

  return (
    <>
      <div className="card shadow-sm border-0 card-desktop overflow-hidden">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold text-secondary">
            CUSTOMER RECORDS ({customers.length})
          </h6>
          <span className="badge bg-light text-secondary border">
            Sorted: Newest First
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Email Address</th>
                <th>Created Date</th>
                <th>Updated Date</th>
                <th style={{ width: '150px' }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => {
                const isSelected = selectedId === cust.id;
                return (
                  <tr key={cust.id} className={isSelected ? 'table-warning' : ''}>
                    <td>
                      <span className="badge-id">#{cust.id}</span>
                    </td>
                    <td className="fw-semibold text-dark">
                      {cust.customer_name}
                    </td>
                    <td>
                      <span className="text-monospace text-secondary">
                        {cust.mobile_no || '—'}
                      </span>
                    </td>
                    <td>
                      {cust.email ? (
                        <a href={`mailto:${cust.email}`} className="text-decoration-none text-primary">
                          {cust.email}
                        </a>
                      ) : (
                        <span className="text-muted small">Not provided</span>
                      )}
                    </td>
                    <td className="small text-muted">
                      {cust.created_at || '—'}
                    </td>
                    <td className="small text-muted">
                      {cust.updated_at || '—'}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                          onClick={() => onEdit(cust)}
                          title="Edit Customer"
                        >
                          <FaEdit /> <span className="d-none d-lg-inline">Edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                          onClick={() => setDeleteCandidate(cust)}
                          title="Delete Customer"
                        >
                          <FaTrash /> <span className="d-none d-lg-inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {deleteCandidate && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <FaExclamationTriangle /> Confirm Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeleteCandidate(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-2">Are you sure you want to permanently delete this customer?</p>
                <div className="p-3 bg-light rounded border">
                  <strong>ID:</strong> #{deleteCandidate.id}<br />
                  <strong>Name:</strong> {deleteCandidate.customer_name}<br />
                  <strong>Mobile:</strong> {deleteCandidate.mobile_no || 'N/A'}<br />
                  <strong>Email:</strong> {deleteCandidate.email || 'N/A'}
                </div>
                <p className="text-danger small mt-2 mb-0">
                  This operation cannot be undone. The record will be removed from the SQLite database.
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteCandidate(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger d-flex align-items-center gap-1"
                  onClick={confirmDelete}
                >
                  <FaTrash /> Yes, Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CustomerList;
