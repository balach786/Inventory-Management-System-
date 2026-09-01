/**
 * Inventory Management System - Dashboard Page
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  Card,
  CardsGrid,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Modal,
  useToast,
  formatCurrency,
  formatDate,
  formatDateTime,
  statusBadge,
  priorityBadge,
  loadingSkeleton
} from '../components/UI';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Plus,
  RotateCcw,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  Boxes,
  Activity,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [reorders, setReorders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Quick Action Modals
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [actionQuantity, setActionQuantity] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [dashRes, prodRes, reordersRes, alertsRes] = await Promise.all([
        api.getDashboard(),
        api.getProducts(),
        api.getReorderSuggestions(),
        api.getAlerts()
      ]);

      setDashboard(dashRes.data);
      setProducts(prodRes.data || []);
      setReorders(reordersRes.data || []);
      setAlerts(alertsRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Dashboard load error:', err);
      showToast('Failed to load dashboard data', 'error');
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();

    const handleRefreshEvent = () => loadData();
    window.addEventListener('ims_refresh', handleRefreshEvent);
    return () => window.removeEventListener('ims_refresh', handleRefreshEvent);
  }, [loadData]);

  // Handle Quick Sale
  const handleRecordSale = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('Please select a product', 'warning');
      return;
    }
    const qty = parseFloat(actionQuantity);
    if (!qty || qty <= 0) {
      showToast('Please enter a valid quantity', 'warning');
      return;
    }

    const prod = products.find(p => p.productId === selectedProductId);
    if (prod && qty > prod.currentStock) {
      showToast(`Cannot sell ${qty} units. Only ${prod.currentStock} in stock!`, 'error');
      return;
    }

    setActionLoading(true);
    try {
      await api.addSale({
        productId: selectedProductId,
        quantity: qty,
        unitPrice: prod ? prod.unitPrice : 0,
        reason: actionReason || 'Quick POS sale entry'
      });
      showToast(`Recorded sale of ${qty} units of ${prod?.productName}`, 'success');
      setSaleModalOpen(false);
      setSelectedProductId('');
      setActionQuantity('');
      setActionReason('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to record sale', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Quick Restock
  const handleRecordRestock = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('Please select a product', 'warning');
      return;
    }
    const qty = parseFloat(actionQuantity);
    if (!qty || qty <= 0) {
      showToast('Please enter a valid quantity', 'warning');
      return;
    }

    const prod = products.find(p => p.productId === selectedProductId);
    setActionLoading(true);
    try {
      await api.restockProduct({
        productId: selectedProductId,
        quantity: qty,
        reason: actionReason || 'Inventory replenishment'
      });
      showToast(`Restocked ${qty} units of ${prod?.productName}`, 'success');
      setRestockModalOpen(false);
      setSelectedProductId('');
      setActionQuantity('');
      setActionReason('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to record restock', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page animate-fade-in">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Executive Dashboard</h1>
            <p className="page-subtitle">Loading inventory analytics...</p>
          </div>
        </div>
        {loadingSkeleton(6, 4)}
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const criticalProducts = products.filter(p => p.currentStock <= p.minimumStock);

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Header Banner */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Inventory Overview</h1>
          <p className="page-subtitle">
            Real-time stock monitoring, demand predictions, and Google Apps Script integration
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="secondary"
            icon={ShoppingCart}
            onClick={() => setSaleModalOpen(true)}
          >
            Record Sale
          </Button>

          <Button
            variant="secondary"
            icon={RotateCcw}
            onClick={() => setRestockModalOpen(true)}
          >
            Restock
          </Button>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/products')}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <CardsGrid cols={4}>
        <Card className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Total Inventory Value</span>
            <span className="metric-value font-mono">
              {formatCurrency(dashboard?.totalInventoryValue || 0)}
            </span>
            <span className="metric-subtext">
              {dashboard?.totalInventoryUnits || 0} total units in stock
            </span>
          </div>
          <div className="metric-icon-wrapper icon-emerald">
            <DollarSign size={22} />
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Total Catalog Products</span>
            <span className="metric-value font-mono">
              {dashboard?.totalProducts || 0}
            </span>
            <span className="metric-subtext">
              Active SKU items managed
            </span>
          </div>
          <div className="metric-icon-wrapper icon-blue">
            <Boxes size={22} />
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Low & Out of Stock</span>
            <span className="metric-value font-mono text-danger">
              {(dashboard?.lowStockProducts || 0) + (dashboard?.outOfStockProducts || 0)}
            </span>
            <span className="metric-subtext">
              {dashboard?.outOfStockProducts || 0} completely out of stock
            </span>
          </div>
          <div className="metric-icon-wrapper icon-rose">
            <AlertTriangle size={22} />
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Recorded Sales</span>
            <span className="metric-value font-mono">
              {formatCurrency(dashboard?.totalSales || 0)}
            </span>
            <span className="metric-subtext">
              Across all historical sales
            </span>
          </div>
          <div className="metric-icon-wrapper icon-purple">
            <TrendingUp size={22} />
          </div>
        </Card>
      </CardsGrid>

      {/* AI Automated Stock Health Insights Banner */}
      {criticalProducts.length > 0 && (
        <Card className="mb-6 border-amber-500/40" style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div className="metric-icon-wrapper icon-amber" style={{ width: '40px', height: '40px' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                  Automated Replenishment Alert
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {criticalProducts.length} product(s) are below safety threshold. {reorders.length} recommended reorder(s) generated.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/reorders')}
            >
              Review Reorder Queue
            </Button>
          </div>
        </Card>
      )}

      {/* Main 2-Column Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left Column: Reorder Recommendations Table */}
        <Card
          title="Priority Reorder Queue"
          subtitle="Calculated using 30-day moving average demand & lead time"
          action={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/reorders')}
            >
              View All
            </Button>
          }
        >
          {reorders.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <CheckCircle2 size={36} className="text-success mb-2" />
              <p className="font-semibold text-sm">All inventory levels are healthy</p>
              <p className="text-xs text-muted">No immediate reorders required</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell isHeader>Product</TableCell>
                  <TableCell isHeader>Stock</TableCell>
                  <TableCell isHeader>Reorder Qty</TableCell>
                  <TableCell isHeader>Priority</TableCell>
                </TableRow>
              </TableHead>
              <tbody>
                {reorders.slice(0, 5).map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div className="font-semibold">{item.productName}</div>
                      <span className="text-xs font-mono text-muted">{item.sku}</span>
                    </TableCell>
                    <TableCell>
                      {statusBadge(item.currentStock, item.minimumStock)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-primary">
                        +{item.reorderQuantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {priorityBadge(item.priority)}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {/* Right Column: Recent Stock Activity Feed */}
        <Card
          title="Recent Stock Activity"
          subtitle="Real-time log of sales, restocks, and adjustments"
          action={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/movements')}
            >
              Full Log
            </Button>
          }
        >
          {(dashboard?.recentActivity || []).length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <Activity size={36} className="text-muted mb-2" />
              <p className="font-semibold text-sm">No recent stock movements</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(dashboard?.recentActivity || []).slice(0, 6).map((act, idx) => {
                const isPositive = (parseFloat(act.quantity) || 0) > 0 || act.type === 'RESTOCK' || act.type === 'INITIAL';
                return (
                  <div
                    key={act.movementId || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isPositive ? 'var(--success-500)' : 'var(--danger-500)'
                        }}
                      >
                        {act.type === 'SALE' ? <ShoppingCart size={16} /> : <RotateCcw size={16} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                          {act.productName}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {act.reason || act.type} • {formatDateTime(act.date)}
                        </div>
                      </div>
                    </div>

                    <div
                      className="font-mono font-bold"
                      style={{
                        fontSize: '0.875rem',
                        color: isPositive ? 'var(--success-500)' : 'var(--danger-500)'
                      }}
                    >
                      {isPositive ? `+${Math.abs(act.quantity)}` : `-${Math.abs(act.quantity)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Modal: Quick Sale */}
      <Modal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        title="Record Customer Sale"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSaleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRecordSale}
              loading={actionLoading}
            >
              Confirm Sale
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordSale}>
          <div className="form-group">
            <label className="form-label">Select Product *</label>
            <select
              className="form-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId} disabled={p.currentStock <= 0}>
                  {p.productName} ({p.sku}) — Stock: {p.currentStock} | Price: {formatCurrency(p.unitPrice)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Units Sold *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="e.g. 5"
                value={actionQuantity}
                onChange={(e) => setActionQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reference / Order ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Order #1049"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Restock */}
      <Modal
        isOpen={restockModalOpen}
        onClose={() => setRestockModalOpen(false)}
        title="Restock Inventory"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRestockModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleRecordRestock}
              loading={actionLoading}
            >
              Add Stock
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordRestock}>
          <div className="form-group">
            <label className="form-label">Select Product *</label>
            <select
              className="form-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.productName} ({p.sku}) — Current Stock: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Quantity Received *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="e.g. 50"
                value={actionQuantity}
                onChange={(e) => setActionQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supplier PO / Note</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. PO #8820"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;