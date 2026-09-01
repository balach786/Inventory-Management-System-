import React from 'react';

export { Button } from './button';
export { Card, CardsGrid } from './card';
export { Table } from './table';
export { TableHead } from './table-head';
export { TableRow } from './table-row';
export { TableCell } from './table-cell';
export { Modal } from './modal';
export { Navbar } from './navbar';
export { Sidebar } from './sidebar';
export { ToastProvider, useToast } from './toast';
export { ThemeProvider, useTheme } from './theme';

// Common Formatters & Helpers
export const formatCurrency = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString;
  }
};

export const statusBadge = (stock, minimum) => {
  const current = parseFloat(stock) || 0;
  const min = parseFloat(minimum) || 0;

  if (current <= 0) {
    return <span className="badge badge-danger">Out of Stock</span>;
  }
  if (current <= min) {
    return <span className="badge badge-warning">Low Stock ({current})</span>;
  }
  return <span className="badge badge-success">In Stock ({current})</span>;
};

export const priorityBadge = (priority) => {
  switch (String(priority).toUpperCase()) {
    case 'CRITICAL':
      return <span className="badge badge-danger">Critical</span>;
    case 'HIGH':
      return <span className="badge badge-warning">High</span>;
    case 'MEDIUM':
      return <span className="badge badge-info">Medium</span>;
    default:
      return <span className="badge badge-success">Safe / Low</span>;
  }
};

export const loadingSkeleton = (rows = 5, cols = 6) => {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-row">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
};