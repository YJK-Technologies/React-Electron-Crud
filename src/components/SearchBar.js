import React from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

/**
 * SearchBar Component
 * Provides real-time search input for customers by Name, Phone, Email, or ID.
 */
function SearchBar({ searchQuery, onSearchChange, onClear, totalResults }) {
  return (
    <div className="row mb-3 align-items-center">
      <div className="col-md-6 col-lg-5">
        <div className="input-group shadow-sm">
          <span className="input-group-text bg-white border-end-0 text-muted">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control border-start-0 border-end-0 ps-0"
            placeholder="Search by Name, Mobile, Email or ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="btn btn-outline-secondary border-start-0 bg-white text-muted"
              type="button"
              onClick={onClear}
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
      <div className="col-md-6 col-lg-7 text-md-end text-muted mt-2 mt-md-0">
        <span className="small">
          {searchQuery ? (
            <>
              Found <strong className="text-primary">{totalResults}</strong> matching records
            </>
          ) : (
            <>
              Showing all <strong className="text-dark">{totalResults}</strong> customers in database
            </>
          )}
        </span>
      </div>
    </div>
  );
}

export default SearchBar;
