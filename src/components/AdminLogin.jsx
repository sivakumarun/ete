import React, { useState } from 'react';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    userId: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const ADMIN_CREDENTIALS = {
    userId: 'admin',
    password: 'ETE@2025'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!credentials.userId.trim()) {
      newErrors.userId = 'User ID is required';
    }

    if (!credentials.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      if (credentials.userId === ADMIN_CREDENTIALS.userId &&
          credentials.password === ADMIN_CREDENTIALS.password) {
        // Store admin session
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminLoginTime', new Date().toISOString());
        onLoginSuccess();
      } else {
        setErrors({
          general: 'Invalid credentials. Please check your User ID and Password.'
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="admin-icon">
            <span>🔒</span>
          </div>
          <h2>Admin Authentication</h2>
          <p>Please enter your credentials to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && (
            <div className="error-banner">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="userId" className="form-label">
              User ID <span className="required">*</span>
            </label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={credentials.userId}
              onChange={handleChange}
              className={`form-input ${errors.userId ? 'error' : ''}`}
              placeholder="Enter User ID"
              disabled={isLoading}
              autoComplete="username"
            />
            {errors.userId && (
              <span className="error-message">{errors.userId}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Enter Password"
              disabled={isLoading}
              autoComplete="current-password"
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner">
                <span className="spinner"></span>
                Authenticating...
              </span>
            ) : (
              'Access Admin Dashboard'
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="security-notice">
            <p>🔐 Secure Admin Access</p>
            <small>This area is restricted to authorized personnel only</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
