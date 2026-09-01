/**
 * Inventory Management System - Demand Forecasting & Predictions Page
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
  useToast,
  statusBadge,
  priorityBadge,
  loadingSkeleton
} from '../components/UI';
import {
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Boxes
} from 'lucide-react';

const Predictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadPredictions = useCallback(async () => {
    try {
      const res = await api.getPredictions();
      setPredictions(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load predictions:', err);
      showToast('Failed to calculate demand forecasts', 'error');
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPredictions();
    const handleRefresh = () => loadPredictions();
    window.addEventListener('ims_refresh', handleRefresh);
    return () => window.removeEventListener('ims_refresh', handleRefresh);
  }, [loadPredictions]);

  if (loading) {
    return (
      <div className="predictions-page animate-fade-in">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Demand Forecasting & Stockout Predictions</h1>
            <p className="page-subtitle">Calculating statistical run rates from historical sales...</p>
          </div>
        </div>
        {loadingSkeleton(8, 7)}
      </div>
    );
  }

  // Summary calculations
  const criticalStockoutCount = predictions.filter(
    (p) => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH'
  ).length;

  const totalPredicted30d = predictions.reduce(
    (acc, p) => acc + (parseFloat(p.predictedDemand) || 0),
    0
  );

  const highestDemandItem = [...predictions].sort(
    (a, b) => (b.avgDailyDemand || 0) - (a.avgDailyDemand || 0)
  )[0];

  return (
    <div className="predictions-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Demand Forecasting & Run-Rate Predictions</h1>
          <p className="page-subtitle">
            Statistical 30-day moving average demand forecasts, safety buffers, and stockout projections
          </p>
        </div>

        <Button
          variant="primary"
          icon={RotateCcw}
          onClick={() => navigate('/reorders')}
        >
          View Automated Reorders
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <CardsGrid cols={3}>
        <Card className="metric-card">
          <div className="metric-info">
            <span className="metric-label">30-Day Catalog Demand Forecast</span>
            <span className="metric-value font-mono">{totalPredicted30d} Units</span>
            <span className="metric-subtext">Estimated aggregate monthly unit demand</span>
          </div>
          <div className="metric-icon-wrapper icon-purple">
            <TrendingUp size={22} />
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Immediate Stockout Risks</span>
            <span className="metric-value font-mono text-danger">
              {criticalStockoutCount} Items
            </span>
            <span className="metric-subtext">Projected to exhaust stock within 7 days</span>
          </div>
          <div className="metric-icon-wrapper icon-rose">
            <AlertTriangle size={22} />
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Top Velocity Product</span>
            <span className="metric-value" style={{ fontSize: '1.15rem' }}>
              {highestDemandItem?.productName || 'N/A'}
            </span>
            <span className="metric-subtext font-mono">
              {highestDemandItem?.avgDailyDemand || 0} units / day run-rate
            </span>
          </div>
          <div className="metric-icon-wrapper icon-blue">
            <Sparkles size={22} />
          </div>
        </Card>
      </CardsGrid>

      {/* Demand Table */}
      <Card title="Demand Projection Matrix" subtitle="Product-by-product breakdown of demand parameters and depletion timelines">
        {predictions.length === 0 ? (
          <div className="empty-state">
            <Boxes size={32} className="text-muted mb-2" />
            <h3 className="empty-title">No forecasting data available</h3>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Product / SKU</TableCell>
                <TableCell isHeader>Current Stock</TableCell>
                <TableCell isHeader>Daily Velocity</TableCell>
                <TableCell isHeader>30-Day Demand</TableCell>
                <TableCell isHeader>Safety Stock Buffer</TableCell>
                <TableCell isHeader>Est. Stockout</TableCell>
                <TableCell isHeader>Risk Status</TableCell>
              </TableRow>
            </TableHead>
            <tbody>
              {predictions.map((p) => {
                const isCritical = p.daysUntilStockout <= 3 || p.currentStock <= 0;
                const isHigh = p.daysUntilStockout <= 7;
                return (
                  <TableRow key={p.productId}>
                    <TableCell>
                      <div className="font-semibold">{p.productName}</div>
                      <span className="font-mono text-xs text-muted">{p.sku}</span>
                    </TableCell>
                    <TableCell>
                      {statusBadge(p.currentStock, p.minimumStock)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold">
                        {p.avgDailyDemand > 0 ? `${p.avgDailyDemand}/day` : '0/day'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-primary">
                        {p.predictedDemand} units
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-secondary">
                        {p.safetyStock} units
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock
                          size={15}
                          className={
                            isCritical
                              ? 'text-danger'
                              : isHigh
                              ? 'text-warning'
                              : 'text-muted'
                          }
                        />
                        <span
                          className={`font-mono font-bold ${
                            isCritical
                              ? 'text-danger'
                              : isHigh
                              ? 'text-warning'
                              : 'text-secondary'
                          }`}
                        >
                          {p.daysUntilStockout >= 999
                            ? 'Adequate'
                            : `${p.daysUntilStockout} days`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {priorityBadge(p.riskLevel)}
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

export default Predictions;