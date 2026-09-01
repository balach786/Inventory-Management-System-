/**
 * Inventory Management System - Main Layout Component
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar, Sidebar, useToast } from './components/UI';
import api from './api';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [reorderCount, setReorderCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const location = useLocation();

  const loadGlobalMetrics = useCallback(async () => {
    try {
      const [alertsRes, reordersRes] = await Promise.all([
        api.getAlerts(),
        api.getReorderSuggestions()
      ]);
      const activeAlerts = (alertsRes.data || []).filter(a => a.status === 'ACTIVE');
      setAlertCount(activeAlerts.length);
      setReorderCount((reordersRes.data || []).length);
    } catch (err) {
      console.warn('Error loading global layout metrics:', err);
    }
  }, []);

  useEffect(() => {
    loadGlobalMetrics();
  }, [loadGlobalMetrics, location.pathname]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await loadGlobalMetrics();
      showToast('Inventory data refreshed', 'success', 2500);
      // Dispatch custom window event so child pages can refresh
      window.dispatchEvent(new Event('ims_refresh'));
    } catch (err) {
      showToast('Failed to refresh data', 'error');
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        alertCount={alertCount}
        reorderCount={reorderCount}
      />

      <div className="app-main-wrapper">
        <Navbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onRefresh={handleManualRefresh}
          refreshing={refreshing}
        />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;