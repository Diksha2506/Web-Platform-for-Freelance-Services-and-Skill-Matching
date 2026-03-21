import React from 'react';
import { motion } from 'framer-motion';
import { LuLogOut } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
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
      <Link to="/" className="sidebar-logo">
        <div className="logo-icon">TL</div>
        <h2>TalentLink</h2>
      </Link>

      <div className="sidebar-nav">
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
                background: activeTab === item.id ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.2)',
                color: activeTab === item.id ? 'var(--primary)' : '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}>
                {item.badge}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
