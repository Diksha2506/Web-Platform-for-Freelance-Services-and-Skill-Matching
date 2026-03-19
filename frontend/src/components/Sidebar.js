import React from 'react';
import { motion } from 'framer-motion';
import { LuLogOut } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ navItems, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">TL</div>
        <h2>TalentLink</h2>
      </div>

      {/* User info card */}
      <div style={{
        margin: '0 16px 24px',
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div className="sidebar-user-avatar">{getInitials()}</div>
        <div>
          <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.9rem' }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
            {user?.role}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map((item) => (
          <motion.div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.badge > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}>
                {item.badge}
              </span>
            )}
          </motion.div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <motion.div
          className="nav-item"
          onClick={handleLogout}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          style={{ color: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}
        >
          <span className="nav-icon"><LuLogOut /></span>
          Sign Out
        </motion.div>
      </div>
    </div>
  );
};

export default Sidebar;
