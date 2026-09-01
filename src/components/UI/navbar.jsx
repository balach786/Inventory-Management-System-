import React from 'react';
import { useTheme } from './theme';
import { Sun, Moon, Menu, Layers, RefreshCw, Database, Cloud } from 'lucide-react';
import api from '../../api';

export const Navbar = ({ onToggleSidebar, isConnected, onRefresh, refreshing }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <button
          onClick={onToggleSidebar}
          className="navbar-menu-toggle btn btn-icon"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="navbar-brand">
          <div className="navbar-logo-icon">
            <Layers size={22} />
          </div>
          <div className="navbar-logo-text">
            <span className="brand-name">Inventory<span className="brand-accent">AI</span></span>
            <span className="brand-tagline">Management & Forecasting</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Backend Connectivity Status Badge */}
        <div className={`backend-status-badge ${api.isConfigured() ? 'status-live' : 'status-local'}`}>
          {api.isConfigured() ? (
            <>
              <Cloud size={14} className="status-dot" />
              <span>Google Apps Script</span>
            </>
          ) : (
            <>
              <Database size={14} className="status-dot" />
              <span>Demo / Local Storage</span>
            </>
          )}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`btn btn-icon ${refreshing ? 'spinning' : ''}`}
            title="Refresh inventory data"
            aria-label="Refresh data"
          >
            <RefreshCw size={18} />
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="theme-toggle-btn btn btn-icon"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle color theme"
        >
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;