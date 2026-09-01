/**
 * Inventory Management System - Stock Movements Audit Log Page
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api';
import {
  Card,
  CardsGrid,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  useToast,
  formatDateTime,
  loadingSkeleton
} from '../components/UI';
import {
  History,
  Download,
  Filter,
  Search,
  RotateCcw,
  ShoppingCart,
  Layers,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity
} from 'lucide-react';

const Movements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const { showToast } = useToast();

  const loadMovements = useCallback(async () => {
    try {
      const res = await api.getStockMovements();
      setMovements(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load stock movements:', err);
      showToast('Failed to load stock movement log', 'error');
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMovements();
    const handleRefresh = () => loadMovements();
    window.addEventListener('ims_refresh', handleRefresh);
    return () => window.removeEventListener('ims_refresh', handleRefresh);
  }, [loadMovements]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchesSearch =
        (m.productName && m.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.sku && m.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.reason && m.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.movementId && m.movementId.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesType = true;
      if (typeFilter !== 'ALL') {
        matchesType = m.type === typeFilter;
      }

      return matchesSearch && matchesType;
    });
  }, [movements, searchQuery, typeFilter]);

  // Calculations
  const totalUnitsRestocked = movements
    .filter((m) => m.type === 'RESTOCK' || m.type === 'INITIAL' || (parseFloat(m.quantity) || 0) > 0)
    .reduce((acc, m) => acc + Math.abs(parseFloat(m.quantity) || 0), 0);

  const totalUnitsSold = movements
    .filter((m) => m.type === 'SALE' || (parseFloat(m.quantity) || 0) < 0)
    .reduce((acc, m) => acc + Math.abs(parseFloat(m.quantity) || 0), 0);

  // CSV Export
  const handleExportCSV = () => {
    if (movements.length === 0) {
      showToast('No movement records to export', 'warning');
      return;
    }

    const headers = ['Movement ID', 'Product Name', 'SKU', 'Type', 'Quantity', 'Date', 'Reason'];
    const rows = movements.map((m) => [
      m.movementId,
      `"${(m.productName || '').replace(/"/g, '""')}"`,
      m.sku || '',
      m.type,
      m.quantity,
      m.date || '',
      `"${(m.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stock_movements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported stock movement log to CSV', 'success');
  };

  const getMovementTypeBadge = (type, qty) => {
    switch (type) {
      case 'SALE':
        return <span className="badge badge-danger">Customer Sale</span>;
      case 'RESTOCK':
        return <span className="badge badge-success">Restock Replenishment</span>;
      case 'INITIAL':
        return <span className="badge badge-info">Initial Inventory</span>;
      case 'ADJUSTMENT_ADD':
      case 'ADJUSTMENT_SUB':
      case 'ADJUSTMENT':
        return <span className="badge badge-warning">Stock Adjustment</span>;
      case 'RETURN':
        return <span className="badge badge-info">Customer Return</span>;
      default:
        return <span className="badge badge-info">{type}</span>;
    }
  };

  if (loading) {
    return (
      <div className="movements-page animate-fade-in">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Stock Movements & Audit Log</h1>
            <p className="page-subtitle">Loading inventory transaction history...</p>
          </div>
        </div>
        {loadingSkeleton(8, 6)}
      </div>
    );
  }

  return (
    <div className="movements-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Stock Movements & Transaction Log</h1>
          <p className="page-subtitle">
            Complete immutable ledger of all sales deductions, purchase restocks, and manual adjustments
          </p>
        </div>

        <Button variant="secondary" icon={Download} onClick={handleExportCSV}>
          Export Movement CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <CardsGrid cols={3}>
        <Card className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Total Transactions Logged</span>
            <span className="metric-value font-mono">{movements.length} Records</span>
            <span className="metric-subtext">Across complete catalog timeline</span>
          </div>
          <div className="metric-icon-wrapper icon-purple">
            <History size={22} />
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Total Replenished Units</span>
            <span className="metric-value font-mono text-success">+{totalUnitsRestocked} Units</span>
            <span className="metric-subtext">Restocks & initial product loads</span>
          </div>
          <div className="metric-icon-wrapper icon-emerald">
            <ArrowUpCircle size={22} />
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Total Dispatched Units</span>
            <span className="metric-value font-mono text-danger">-{totalUnitsSold} Units</span>
            <span className="metric-subtext">Customer orders & outbound sales</span>
          </div>
          <div className="metric-icon-wrapper icon-rose">
            <ArrowDownCircle size={22} />
          </div>
        </Card>
      </CardsGrid>

      {/* Filter and Search Bar */}
      <Card className="mb-6" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by product, SKU, movement ID, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} className="text-muted" />
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '160px' }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Movement Types</option>
                <option value="SALE">Customer Sale</option>
                <option value="RESTOCK">Restock Replenishment</option>
                <option value="INITIAL">Initial Stock</option>
                <option value="ADJUSTMENT">Stock Adjustment</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Movements Table */}
      <Card>
        {filteredMovements.length === 0 ? (
          <div className="empty-state">
            <Activity size={32} className="text-muted mb-2" />
            <h3 className="empty-title">No stock movements found</h3>
            <p className="empty-description">
              Try changing your filter settings or record new sales and restock activities.
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Movement ID</TableCell>
                <TableCell isHeader>Product / SKU</TableCell>
                <TableCell isHeader>Type</TableCell>
                <TableCell isHeader>Quantity Change</TableCell>
                <TableCell isHeader>Reason / Reference</TableCell>
                <TableCell isHeader style={{ textAlign: 'right' }}>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredMovements.map((m) => {
                const isPositive =
                  (parseFloat(m.quantity) || 0) > 0 ||
                  m.type === 'RESTOCK' ||
                  m.type === 'INITIAL';

                return (
                  <TableRow key={m.movementId}>
                    <TableCell className="font-mono text-xs font-semibold text-muted">
                      {m.movementId}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{m.productName}</div>
                      <span className="font-mono text-xs text-muted">{m.sku}</span>
                    </TableCell>
                    <TableCell>
                      {getMovementTypeBadge(m.type, m.quantity)}
                    </TableCell>
                    <TableCell>
                      <span
                        className="font-mono font-bold"
                        style={{
                          fontSize: '0.95rem',
                          color: isPositive ? 'var(--success-500)' : 'var(--danger-500)'
                        }}
                      >
                        {isPositive ? `+${Math.abs(m.quantity)}` : `-${Math.abs(m.quantity)}`} units
                      </span>
                    </TableCell>
                    <TableCell className="text-secondary text-sm">
                      {m.reason || 'General inventory activity'}
                    </TableCell>
                    <TableCell className="text-xs text-muted" style={{ textAlign: 'right' }}>
                      {formatDateTime(m.date)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Movements;
