/**
 * Inventory Management System - Alerts Page
 */
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import {
  Card,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Modal,
  useToast,
  formatDate,
  formatDateTime,
  priorityBadge,
  statusBadge,
  loadingSkeleton
} from '../components/UI';
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  Clock,
  Filter,
  Check
} from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE or RESOLVED
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const { showToast } = useToast();

  // Restock Modal
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [restockQty, setRestockQty] = useState('50');
  const [restockReason, setRestockReason] = useState('Low Stock Alert Resolution');
  const [submitting, setSubmitting] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await api.getAlerts();
      setAlerts(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      showToast('Failed to load alerts', 'error');
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAlerts();
    const handleRefresh = () => loadAlerts();
    window.addEventListener('ims_refresh', handleRefresh);
    return () => window.removeEventListener('ims_refresh', handleRefresh);
  }, [loadAlerts]);

  // Resolve Alert Action
  const handleResolveAlert = async (alertId) => {
    try {
      await api.resolveAlert({ alertId });
      showToast('Alert marked as resolved', 'success');
      loadAlerts();
    } catch (err) {
      showToast(err.message || 'Failed to resolve alert', 'error');
    }
  };

  // Restock from Alert
  const handleRestockFromAlert = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    const qty = parseFloat(restockQty);
    if (!qty || qty <= 0) {
      showToast('Please enter a valid quantity', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await api.restockProduct({
        productId: selectedAlert.productId,
        quantity: qty,
        reason: restockReason || 'Alert Restock Replenishment'
      });
      await api.resolveAlert({ alertId: selectedAlert.alertId });
      showToast(`Restocked ${qty} units and resolved alert!`, 'success');
      setRestockModalOpen(false);
      setSelectedAlert(null);
      loadAlerts();
    } catch (err) {
      showToast(err.message || 'Failed to process restock', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesTab = a.status === activeTab;
    const matchesSeverity =
      severityFilter === 'ALL' || a.severity === severityFilter;
    return matchesTab && matchesSeverity;
  });

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length;

  if (loading) {
    return (
      <div className="alerts-page animate-fade-in">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Low Stock Alerts</h1>
            <p className="page-subtitle">Loading inventory alerts...</p>
          </div>
        </div>
        {loadingSkeleton(6, 5)}
      </div>
    );
  }

  return (
    <div className="alerts-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Low Stock Alert System</h1>
          <p className="page-subtitle">
            Automated threshold monitors detecting critical depletion and out-of-stock events
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant={activeTab === 'ACTIVE' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Active Alerts ({activeCount})
          </Button>
          <Button
            variant={activeTab === 'RESOLVED' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('RESOLVED')}
          >
            Resolved History
          </Button>
        </div>
      </div>

      {/* Critical Alert Warning Banner */}
      {criticalCount > 0 && activeTab === 'ACTIVE' && (
        <Card className="mb-6" style={{ marginBottom: '1.5rem', background: 'var(--danger-50)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="metric-icon-wrapper icon-rose">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className="text-danger font-bold">
                {criticalCount} Critical Stockout Alert(s) Require Immediate Attention!
              </h4>
              <p className="text-xs text-secondary mt-0.5">
                Items with 0 or near-zero stock have triggered priority supplier restock recommendations.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Bar */}
      <Card className="mb-6" style={{ marginBottom: '1.5rem', padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} className="text-muted" />
            <span className="text-sm font-semibold">Filter Severity:</span>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '130px' }}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>

          <span className="text-xs text-muted">
            Showing {filteredAlerts.length} {activeTab.toLowerCase()} alert(s)
          </span>
        </div>
      </Card>

      {/* Alerts Table */}
      <Card>
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-500)' }}>
              <CheckCircle2 size={28} />
            </div>
            <h3 className="empty-title">
              {activeTab === 'ACTIVE' ? 'No active alerts!' : 'No resolved alerts history'}
            </h3>
            <p className="empty-description">
              {activeTab === 'ACTIVE'
                ? 'All products are currently stocked safely above their minimum thresholds.'
                : 'Resolved alerts will appear here once cleared.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Severity</TableCell>
                <TableCell isHeader>Product / SKU</TableCell>
                <TableCell isHeader>Stock Status</TableCell>
                <TableCell isHeader>Alert Message</TableCell>
                <TableCell isHeader>Triggered Date</TableCell>
                <TableCell isHeader style={{ textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredAlerts.map((alert) => (
                <TableRow key={alert.alertId}>
                  <TableCell>
                    {priorityBadge(alert.severity)}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{alert.productName}</div>
                    <span className="font-mono text-xs text-muted">{alert.sku}</span>
                  </TableCell>
                  <TableCell>
                    {statusBadge(alert.currentStock, alert.minimumStock)}
                    <div className="text-xs text-muted mt-0.5">
                      Min threshold: {alert.minimumStock}
                    </div>
                  </TableCell>
                  <TableCell style={{ maxWidth: '320px' }}>
                    <span className="text-sm">{alert.message}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {formatDateTime(alert.createdAt)}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {alert.status === 'ACTIVE' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button
                          variant="success"
                          size="sm"
                          icon={RotateCcw}
                          onClick={() => {
                            setSelectedAlert(alert);
                            setRestockQty('50');
                            setRestockModalOpen(true);
                          }}
                        >
                          Restock
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Check}
                          onClick={() => handleResolveAlert(alert.alertId)}
                        >
                          Resolve
                        </Button>
                      </div>
                    ) : (
                      <span className="badge badge-success">Resolved</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Restock & Resolve Modal */}
      <Modal
        isOpen={restockModalOpen}
        onClose={() => setRestockModalOpen(false)}
        title={`Restock & Resolve: ${selectedAlert?.productName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRestockModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleRestockFromAlert} loading={submitting}>
              Restock & Resolve Alert
            </Button>
          </>
        }
      >
        <form onSubmit={handleRestockFromAlert}>
          <p className="text-sm text-secondary mb-4">
            Current Stock: <strong>{selectedAlert?.currentStock}</strong> | Minimum: <strong>{selectedAlert?.minimumStock}</strong>
          </p>

          <div className="form-group">
            <label className="form-label">Units to Add to Stock *</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reference Reason</label>
            <input
              type="text"
              className="form-input"
              value={restockReason}
              onChange={(e) => setRestockReason(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Alerts;