import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUserEdit, FaUndo, FaCheck, FaTimes } from 'react-icons/fa';

/**
 * CustomerForm Component
 * Handles customer creation and editing with complete form validation.
 */
function CustomerForm({ currentCustomer, onSave, onUpdate, onCancelEdit, isLoading }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    mobile_no: '',
    email: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // When currentCustomer prop changes, populate form in Edit mode
  useEffect(() => {
    if (currentCustomer) {
      setFormData({
        customer_name: currentCustomer.customer_name || '',
        mobile_no: currentCustomer.mobile_no || '',
        email: currentCustomer.email || ''
      });
      setErrors({});
      setTouched({});
    } else {
      resetForm();
    }
  }, [currentCustomer]);

  const resetForm = () => {
    setFormData({
      customer_name: '',
      mobile_no: '',
      email: ''
    });
    setErrors({});
    setTouched({});
  };

  /**
   * Validate all form fields
   */
  const validateField = (name, value) => {
    let error = '';
    if (name === 'customer_name') {
      if (!value.trim()) {
        error = 'Customer name is required.';
      } else if (value.trim().length < 2) {
        error = 'Name must be at least 2 characters long.';
      }
    }

    if (name === 'mobile_no') {
      if (!value.trim()) {
        error = 'Mobile number is required.';
      } else if (!/^[0-9+()\s-]{10,15}$/.test(value.trim())) {
        error = 'Enter a valid 10-digit mobile number.';
      }
    }

    if (name === 'email') {
      if (value.trim() && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim())) {
        error = 'Enter a valid email address.';
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all as touched and validate
    const nameErr = validateField('customer_name', formData.customer_name);
    const mobErr = validateField('mobile_no', formData.mobile_no);
    const emailErr = validateField('email', formData.email);

    const formErrors = {};
    if (nameErr) formErrors.customer_name = nameErr;
    if (mobErr) formErrors.mobile_no = mobErr;
    if (emailErr) formErrors.email = emailErr;

    setErrors(formErrors);
    setTouched({ customer_name: true, mobile_no: true, email: true });

    if (Object.keys(formErrors).length > 0) {
      return; // Validation failed
    }

    if (currentCustomer) {
      onUpdate(currentCustomer.id, formData);
    } else {
      onSave(formData);
      resetForm();
    }
  };

  const isEditing = Boolean(currentCustomer);

  return (
    <div className="card shadow-sm border-0 mb-4 card-desktop">
      <div className={`card-header py-3 ${isEditing ? 'bg-warning-subtle text-warning-emphasis' : 'bg-primary text-white'}`}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
            {isEditing ? (
              <>
                <FaUserEdit /> Edit Customer (ID: #{currentCustomer.id})
              </>
            ) : (
              <>
                <FaUserPlus /> Add New Customer
              </>
            )}
          </h5>
          {isEditing && (
            <span className="badge bg-warning text-dark">Updating Record</span>
          )}
        </div>
      </div>

      <div className="card-body p-4">
        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            {/* Customer Name */}
            <div className="col-md-4">
              <label htmlFor="customer_name" className="form-label fw-semibold">
                Customer Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.customer_name ? 'is-invalid' : touched.customer_name ? 'is-valid' : ''}`}
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Rajesh Kumar"
                disabled={isLoading}
              />
              {errors.customer_name && (
                <div className="invalid-feedback">{errors.customer_name}</div>
              )}
            </div>

            {/* Mobile Number */}
            <div className="col-md-4">
              <label htmlFor="mobile_no" className="form-label fw-semibold">
                Mobile Number <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                className={`form-control ${errors.mobile_no ? 'is-invalid' : touched.mobile_no ? 'is-valid' : ''}`}
                id="mobile_no"
                name="mobile_no"
                value={formData.mobile_no}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 9840123456"
                disabled={isLoading}
              />
              {errors.mobile_no && (
                <div className="invalid-feedback">{errors.mobile_no}</div>
              )}
            </div>

            {/* Email Address */}
            <div className="col-md-4">
              <label htmlFor="email" className="form-label fw-semibold">
                Email Address
              </label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : touched.email && formData.email ? 'is-valid' : ''}`}
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. rajesh@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
              onClick={isEditing ? onCancelEdit : resetForm}
              disabled={isLoading}
            >
              <FaUndo /> {isEditing ? 'Cancel Edit' : 'Clear Form'}
            </button>

            {isEditing ? (
              <button
                type="submit"
                className="btn btn-warning text-dark fw-bold d-flex align-items-center gap-2"
                disabled={isLoading}
              >
                <FaCheck /> {isLoading ? 'Updating...' : 'Update Customer'}
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary fw-semibold d-flex align-items-center gap-2"
                disabled={isLoading}
              >
                <FaUserPlus /> {isLoading ? 'Saving...' : 'Save Customer'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerForm;
