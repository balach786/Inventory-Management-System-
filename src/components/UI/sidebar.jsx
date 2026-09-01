import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  History,
  Settings,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose, alertCount = 0, reorderCount = 0 }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products & Inventory', icon: Package },
    { to: '/alerts', label: 'Low Stock Alerts', icon: AlertTriangle, badge: alertCount },
    { to: '/predictions', label: 'Demand Forecasting', icon: TrendingUp },
    { to: '/reorders', label: 'Reorder Queue', icon: RotateCcw, badge: reorderCount },
    { to: '/movements', label: 'Stock Movements', icon: History },
    { to: '/settings', label: 'Settings & GAS API', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-mobile-header">
          <span className="sidebar-header-title">Navigation</span>
          <button
            onClick={onClose}
            className="btn btn-icon sidebar-close-btn"
            aria-label="Close navigation sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-section-title">MAIN MENU</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
                onClick={onClose}
              >
                <Icon size={19} className="sidebar-link-icon" />
                <span className="sidebar-link-label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="sidebar-link-badge animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="system-pill">
            <span className="system-pill-dot" />
            <div className="system-pill-text">
              <span className="system-pill-title">GAS Backend Ready</span>
              <span className="system-pill-version">v2.1 Enterprise</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;