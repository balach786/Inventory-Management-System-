/**
 * Inventory Management System - Settings & Google Apps Script Config Page
 */
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import {
  Card,
  Button,
  Modal,
  useToast,
  loadingSkeleton
} from '../components/UI';
import {
  Settings as SettingsIcon,
  Cloud,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Shield,
  Save,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    safetyStockMultiplier: '1.5',
    predictionDays: '30',
    lowStockThreshold: '80',
    restockLeadTime: '7'
  });
  const [apiUrl, setApiUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const { showToast } = useToast();

  const loadSettings = useCallback(async () => {
    try {
      const currentUrl = api.getApiUrl();
      setApiUrl(currentUrl);

      const res = await api.getSettings();
      if (res.data && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach((s) => {
          map[s.setting] = s.value;
        });
        setSettings((prev) => ({ ...prev, ...map }));
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load settings:', err);
      showToast('Failed to load settings', 'error');
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save GAS Web App URL
  const handleSaveApiUrl = async (e) => {
    e.preventDefault();
    api.setApiUrl(apiUrl);
    showToast('Google Apps Script Web App URL saved', 'success');
  };

  // Test Connection to GAS Backend
  const handleTestConnection = async () => {
    if (!apiUrl.trim()) {
      showToast('Please enter a Google Apps Script Web App URL first', 'warning');
      return;
    }

    setTestingConnection(true);
    try {
      const result = await api.testConnection(apiUrl);
      showToast(result.message || 'Connected successfully to Google Apps Script!', 'success', 5000);
      api.setApiUrl(apiUrl);
    } catch (err) {
      showToast(err.message || 'Connection test failed', 'error', 6000);
    } finally {
      setTestingConnection(false);
    }
  };

  // Save System Parameter Settings
  const handleSaveParameters = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await Promise.all(
        Object.entries(settings).map(([setting, value]) =>
          api.updateSetting({ setting, value: String(value) })
        )
      );
      showToast('System inventory parameters updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Reset Sample Data
  const handleResetData = async () => {
    try {
      await api.resetSampleData();
      showToast('Sample inventory, sales, and movement data restored', 'success');
      setResetModalOpen(false);
      loadSettings();
      window.dispatchEvent(new Event('ims_refresh'));
    } catch (err) {
      showToast('Failed to reset sample data', 'error');
    }
  };

  if (loading) {
    return (
      <div className="settings-page animate-fade-in">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">System Settings & Backend Config</h1>
            <p className="page-subtitle">Loading system configuration...</p>
          </div>
        </div>
        {loadingSkeleton(6, 4)}
      </div>
    );
  }

  const isLiveGas = api.isConfigured();

  return (
    <div className="settings-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">System Settings & Cloud Integration</h1>
          <p className="page-subtitle">
            Configure Google Apps Script backend, adjust demand forecasting multipliers, and manage local data
          </p>
        </div>

        <Button
          variant="outline"
          icon={HelpCircle}
          onClick={() => setGuideModalOpen(true)}
        >
          GAS Setup Guide
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Card 1: Google Apps Script Backend Web App URL */}
        <Card
          title="Google Apps Script (GAS) Backend"
          subtitle="Link your Google Sheets database through a deployed Google Apps Script Web App"
        >
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              background: isLiveGas ? 'var(--success-50)' : 'var(--primary-50)',
              border: `1px solid ${isLiveGas ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            {isLiveGas ? (
              <Cloud size={22} className="text-success" />
            ) : (
              <Database size={22} className="text-primary" />
            )}
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                {isLiveGas ? 'Connected to Google Apps Script Web App' : 'Running in Local Storage / Demo Mode'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {isLiveGas
                  ? 'All changes sync directly to your live Google Sheets spreadsheets.'
                  : 'Operating locally with persistent browser storage. Connect your GAS URL below to sync to Google Sheets.'}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveApiUrl}>
            <div className="form-group">
              <label className="form-label">Google Apps Script Web App URL</label>
              <input
                type="url"
                className="form-input font-mono text-sm"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <span className="text-xs text-muted mt-1">
                Enter the URL received from "Deploy as Web App" (Access: Anyone).
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant="outline"
                icon={Cloud}
                onClick={handleTestConnection}
                loading={testingConnection}
              >
                Test Connection
              </Button>
              <Button type="submit" variant="primary" icon={Save}>
                Save Web App URL
              </Button>
            </div>
          </form>
        </Card>

        {/* Card 2: Forecasting & Safety Stock Parameters */}
        <Card
          title="Inventory & Forecasting Parameters"
          subtitle="Tune algorithmic variables for safety stock buffers and reorder calculations"
        >
          <form onSubmit={handleSaveParameters}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Safety Stock Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="5"
                  className="form-input font-mono"
                  value={settings.safetyStockMultiplier}
                  onChange={(e) =>
                    setSettings({ ...settings, safetyStockMultiplier: e.target.value })
                  }
                  required
                />
                <span className="text-xs text-muted">Standard: 1.5x</span>
              </div>

              <div className="form-group">
                <label className="form-label">Prediction Horizon (Days)</label>
                <input
                  type="number"
                  min="7"
                  max="90"
                  className="form-input font-mono"
                  value={settings.predictionDays}
                  onChange={(e) =>
                    setSettings({ ...settings, predictionDays: e.target.value })
                  }
                  required
                />
                <span className="text-xs text-muted">Standard: 30 days</span>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Restock Lead Time (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  className="form-input font-mono"
                  value={settings.restockLeadTime}
                  onChange={(e) =>
                    setSettings({ ...settings, restockLeadTime: e.target.value })
                  }
                  required
                />
                <span className="text-xs text-muted">Avg supplier turnaround</span>
              </div>

              <div className="form-group">
                <label className="form-label">Low Stock Trigger (%)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  className="form-input font-mono"
                  value={settings.lowStockThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, lowStockThreshold: e.target.value })
                  }
                  required
                />
                <span className="text-xs text-muted">% of minimum stock</span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <Button type="submit" variant="primary" icon={Save} loading={savingSettings}>
                Save System Parameters
              </Button>
            </div>
          </form>
        </Card>

        {/* Card 3: Data Management & Sample Data */}
        <Card
          title="Data Management & Demonstration Seed"
          subtitle="Manage local browser database and sample inventory data"
        >
          <p className="text-sm text-secondary mb-4">
            Resetting data will replenish the catalog with sample hardware, accessories, sales history, and triggered stock movements.
          </p>

          <Button
            variant="danger"
            icon={RotateCcw}
            onClick={() => setResetModalOpen(true)}
          >
            Reset to Sample Catalog Data
          </Button>
        </Card>

        {/* Card 4: Architecture & Google Sheets Overview */}
        <Card
          title="System Architecture & Sheets Overview"
          subtitle="Google Sheets tables synchronized by Google Apps Script"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FileSpreadsheet size={16} className="text-emerald-500" />
              <span className="text-sm font-semibold">Products:</span>
              <span className="text-xs text-muted">SKU, Category, Stock, Pricing, Supplier</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FileSpreadsheet size={16} className="text-blue-500" />
              <span className="text-sm font-semibold">Sales:</span>
              <span className="text-xs text-muted">SaleId, ProductId, Quantity, UnitPrice, SaleDate</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FileSpreadsheet size={16} className="text-purple-500" />
              <span className="text-sm font-semibold">StockMovements:</span>
              <span className="text-xs text-muted">MovementId, Type, Quantity, Date, Reason</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FileSpreadsheet size={16} className="text-amber-500" />
              <span className="text-sm font-semibold">Alerts:</span>
              <span className="text-xs text-muted">AlertId, Severity, Message, Status</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FileSpreadsheet size={16} className="text-secondary" />
              <span className="text-sm font-semibold">Settings:</span>
              <span className="text-xs text-muted">Multipliers, LeadTimes, Thresholds</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal: Google Apps Script Setup Guide */}
      <Modal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        title="Google Apps Script Setup Guide"
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setGuideModalOpen(false)}>
            Done
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p className="text-sm text-secondary">
            Follow these 4 simple steps to connect this frontend to your live Google Sheets backend:
          </p>

          <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <h4 className="font-bold text-sm mb-1">1. Create a Google Spreadsheet</h4>
            <p className="text-xs text-secondary">
              Open <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-primary font-semibold">Google Sheets</a> and create a new blank spreadsheet.
            </p>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <h4 className="font-bold text-sm mb-1">2. Open Apps Script Editor</h4>
            <p className="text-xs text-secondary">
              In your spreadsheet menu, click <strong>Extensions &gt; Apps Script</strong>.
            </p>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <h4 className="font-bold text-sm mb-1">3. Paste Code.gs &amp; Deploy</h4>
            <p className="text-xs text-secondary">
              Copy the contents of <code className="font-mono">scripts/Code.gs</code> from this project into the Apps Script editor, click <strong>Save</strong>, then click <strong>Deploy &gt; New deployment</strong>. Select type: <strong>Web App</strong>, Execute as: <strong>Me</strong>, Who has access: <strong>Anyone</strong>.
            </p>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <h4 className="font-bold text-sm mb-1">4. Paste the Web App URL</h4>
            <p className="text-xs text-secondary">
              Copy the Web App URL provided by Google Apps Script and paste it into the Web App URL field in this Settings page or in your <code className="font-mono">.env</code> file.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal: Reset Confirm */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset to Sample Data"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetData}>
              Reset Data
            </Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          Are you sure you want to reset your local database to sample inventory, sales, and movement records?
        </p>
      </Modal>
    </div>
  );
};

export default Settings;