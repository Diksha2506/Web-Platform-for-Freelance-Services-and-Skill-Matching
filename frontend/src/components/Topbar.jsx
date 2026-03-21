import React from 'react';
import { FiSearch, FiBell, FiPlus, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Topbar = ({ title, subtitle, unreadCount, onNotificationClick, onActionClick, actionLabel, onProfileClick, searchQuery, onSearchChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // handleLogout logic removed from here and moved to profile pages as requested

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
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', background: 'var(--gradient-primary)',
              color: '#FFFFFF', border: 'none', borderRadius: '12px',
              fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <FiPlus /> {actionLabel}
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={onProfileClick}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.9rem', color: '#FFFFFF',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {user?.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {user?.first_name || user?.username}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 600 }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
