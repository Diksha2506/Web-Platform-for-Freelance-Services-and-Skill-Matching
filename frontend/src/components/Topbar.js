import React from 'react';
import { FiSearch, FiBell, FiPlus, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Topbar = ({ title, subtitle, unreadCount, onNotificationClick, onActionClick, actionLabel, onProfileClick, searchQuery, onSearchChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>
        <button className="notification-btn" onClick={onNotificationClick}>
          <FiBell />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
        {actionLabel && (
          <button
            onClick={onActionClick}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', background: 'linear-gradient(135deg, #2EC4B6, #25A99D)',
              color: '#FFFFFF', border: 'none', borderRadius: '10px',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              transition: 'all 0.3s ease', boxShadow: '0 2px 8px rgba(46,196,182,0.25)',
            }}
          >
            <FiPlus /> {actionLabel}
          </button>
        )}
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: 'transparent',
            color: '#DC2626', border: '1.5px solid #FCA5A5',
            borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem',
            cursor: 'pointer', transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => { e.target.style.background = '#DC2626'; e.target.style.color = '#fff'; }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#DC2626'; }}
        >
          <FiLogOut /> Logout
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={onProfileClick}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2EC4B6, #25A99D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem', color: '#FFFFFF',
          }}>
            {user?.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2937' }}>
              {user?.first_name || user?.username}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
