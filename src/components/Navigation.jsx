import React from 'react';
import './Navigation.css';


const Navigation = ({ currentView, setCurrentView, onAdminAccess, isAdminAuthenticated, onAdminLogout }) => {
  const navItems = [
    { key: 'form', label: 'New Assignment', icon: '👤' },
    /* { key: 'all-results', label: 'All Results', icon: '📊' } */
  ];

  const handleAdminClick = () => {
    if (onAdminAccess) {
      onAdminAccess();
    } else {
      setCurrentView('admin');
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${currentView === item.key ? 'active' : ''}`}
            onClick={() => setCurrentView(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}

        <button
          className={`nav-item admin-item ${(currentView === 'admin' || currentView === 'admin-login') ? 'active' : ''}`}
          onClick={handleAdminClick}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">
            {isAdminAuthenticated ? 'Admin Dashboard' : 'Admin Login'}
          </span>
        </button>

        {isAdminAuthenticated && (currentView === 'admin' || currentView === 'admin-login') && (
          <button
            className="nav-item logout-item"
            onClick={onAdminLogout}
            title="Logout from Admin"
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
