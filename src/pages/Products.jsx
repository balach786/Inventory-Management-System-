/**
 * Inventory Management System - Products Page
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  formatCurrency,
  formatDate,
  statusBadge,
  loadingSkeleton
} from '../components/UI';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Download,
  RotateCcw,
  ShoppingCart,
  Boxes,
  AlertCircle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);

  // Selected item & forms
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionQuantity, setActionQuantity] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    productName: '',
    sku: '',
    category: '',
    supplier: '',
    currentStock: '',
    minimumStock: '',
    maximumStock: '',
    unitPrice: '',
  };

  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.getProducts();
      setProducts(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load products:', err);
      showToast('Failed to load products', 'error');
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProducts();
    const handleRefresh = () => loadProducts();
    window.addEventListener('ims_refresh', handleRefresh);
    return () => window.removeEventListener('ims_refresh', handleRefresh);
  }, [loadProducts]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.supplier && p.supplier.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'ALL' || p.category === categoryFilter;

      let matchesStock = true;
      const stock = parseFloat(p.currentStock) || 0;
      const min = parseFloat(p.minimumStock) || 0;

      if (stockStatusFilter === 'OUT_OF_STOCK') {
        matchesStock = stock <= 0;
      } else if (stockStatusFilter === 'LOW_STOCK') {
        matchesStock = stock > 0 && stock <= min;
      } else if (stockStatusFilter === 'IN_STOCK') {
        matchesStock = stock > min;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockStatusFilter]);

  // Validate form
  const validateForm = (isEdit = false) => {
    const errors = {};
    if (!form.productName.trim()) errors.productName = 'Product name is required';
    if (!form.sku.trim()) {
      errors.sku = 'SKU is required';
    } else {
      const duplicate = products.find(
        (p) =>
          p.sku.toLowerCase() === form.sku.trim().toLowerCase() &&
          (!isEdit || p.productId !== selectedProduct?.productId)
      );
      if (duplicate) errors.sku = 'SKU code must be unique';
    }

    if (form.currentStock === '' || isNaN(form.currentStock) || Number(form.currentStock) < 0) {
      errors.currentStock = 'Valid non-negative stock required';
    }
    if (form.minimumStock === '' || isNaN(form.minimumStock) || Number(form.minimumStock) < 0) {
      errors.minimumStock = 'Valid minimum threshold required';
    }
    if (form.unitPrice === '' || isNaN(form.unitPrice) || Number(form.unitPrice) < 0) {
      errors.unitPrice = 'Valid unit price required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add Product Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setSubmitting(true);
    try {
      await api.addProduct(form);
      showToast(`Added product "${form.productName}" successfully`, 'success');
      setAddModalOpen(false);
      setForm(initialForm);
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to add product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Product Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setSubmitting(true);
    try {
      await api.updateProduct({
        ...selectedProduct,
        ...form
      });
      showToast(`Updated product "${form.productName}"`, 'success');
      setEditModalOpen(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to update product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product Submit
  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      await api.deleteProduct(selectedProduct.productId);
      showToast(`Deleted product "${selectedProduct.productName}"`, 'success');
      setDeleteModalOpen(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Restock Submit
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(actionQuantity);
    if (!qty || qty <= 0) {
      showToast('Please enter a valid restock quantity', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await api.restockProduct({
        productId: selectedProduct.productId,
        quantity: qty,
        reason: actionReason || `Restocked ${qty} units`
      });
      showToast(`Added ${qty} units to ${selectedProduct.productName}`, 'success');
      setRestockModalOpen(false);
      setSelectedProduct(null);
      setActionQuantity('');
      setActionReason('');
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to restock', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Sale Submit
  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(actionQuantity);
    if (!qty || qty <= 0) {
      showToast('Please enter a valid sale quantity', 'warning');
      return;
    }
    if (qty > selectedProduct.currentStock) {
      showToast(`Cannot sell ${qty} units. Only ${selectedProduct.currentStock} in stock!`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.addSale({
        productId: selectedProduct.productId,
        quantity: qty,
        unitPrice: selectedProduct.unitPrice,
        reason: actionReason || 'Quick POS sale'
      });
      showToast(`Recorded sale of ${qty} units`, 'success');
      setSaleModalOpen(false);
      setSelectedProduct(null);
      setActionQuantity('');
      setActionReason('');
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to record sale', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (products.length === 0) {
      showToast('No products to export', 'warning');
      return;
    }

    const headers = [
      'Product ID',
      'Product Name',
      'SKU',
      'Category',
      'Supplier',
      'Current Stock',
      'Minimum Stock',
      'Maximum Stock',
      'Unit Price',
      'Total Value',
      'Last Restocked'
    ];

    const rows = products.map((p) => [
      p.productId,
      `"${p.productName.replace(/"/g, '""')}"`,
      p.sku,
      p.category || '',
      `"${(p.supplier || '').replace(/"/g, '""')}"`,
      p.currentStock,
      p.minimumStock,
      p.maximumStock || '',
      p.unitPrice,
      (p.currentStock * p.unitPrice).toFixed(2),
      p.lastRestocked || ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported inventory catalog to CSV', 'success');
  };

  const openEditModal = (p) => {
    setSelectedProduct(p);
    setForm({
      productName: p.productName || '',
      sku: p.sku || '',
      category: p.category || '',
      supplier: p.supplier || '',
      currentStock: p.currentStock !== undefined ? String(p.currentStock) : '',
      minimumStock: p.minimumStock !== undefined ? String(p.minimumStock) : '',
      maximumStock: p.maximumStock !== undefined ? String(p.maximumStock) : '',
      unitPrice: p.unitPrice !== undefined ? String(p.unitPrice) : '',
    });
    setFormErrors({});
    setEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="products-page animate-fade-in">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Products & Inventory</h1>
            <p className="page-subtitle">Loading inventory catalog...</p>
          </div>
        </div>
        {loadingSkeleton(8, 6)}
      </div>
    );
  }

  return (
    <div className="products-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Products & Inventory Catalog</h1>
          <p className="page-subtitle">
            Manage SKU listings, unit costs, real-time stock levels, and threshold triggers
          </p>
        </div>

        <div className="page-actions">
          <Button variant="secondary" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setForm(initialForm);
              setFormErrors({});
              setAddModalOpen(true);
            }}
          >
            Add New Product
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="mb-6" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by product name, SKU, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} className="text-muted" />
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '140px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '150px' }}
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Product Table */}
      <Card>
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <Boxes size={28} />
            </div>
            <h3 className="empty-title">No products found</h3>
            <p className="empty-description">
              {searchQuery || categoryFilter !== 'ALL' || stockStatusFilter !== 'ALL'
                ? 'Try adjusting your search terms or filter criteria.'
                : 'Get started by creating your first inventory product.'}
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setForm(initialForm);
                setFormErrors({});
                setAddModalOpen(true);
              }}
            >
              Add Product
            </Button>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>Product / SKU</TableCell>
                <TableCell isHeader>Category</TableCell>
                <TableCell isHeader>Supplier</TableCell>
                <TableCell isHeader>Stock Level</TableCell>
                <TableCell isHeader>Unit Price</TableCell>
                <TableCell isHeader>Total Value</TableCell>
                <TableCell isHeader>Last Restocked</TableCell>
                <TableCell isHeader style={{ textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredProducts.map((p) => {
                const stockVal = (parseFloat(p.currentStock) || 0) * (parseFloat(p.unitPrice) || 0);
                return (
                  <TableRow key={p.productId}>
                    <TableCell>
                      <div className="font-semibold">{p.productName}</div>
                      <div className="font-mono text-xs text-muted">{p.sku}</div>
                    </TableCell>
                    <TableCell>
                      <span className="badge badge-info">{p.category || 'General'}</span>
                    </TableCell>
                    <TableCell className="text-secondary text-sm">
                      {p.supplier || '—'}
                    </TableCell>
                    <TableCell>
                      {statusBadge(p.currentStock, p.minimumStock)}
                      <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                        Min: {p.minimumStock} | Max: {p.maximumStock || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {formatCurrency(p.unitPrice)}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {formatCurrency(stockVal)}
                    </TableCell>
                    <TableCell className="text-muted text-xs">
                      {formatDate(p.lastRestocked)}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <Button
                          variant="icon"
                          size="sm"
                          title="Record Sale"
                          onClick={() => {
                            setSelectedProduct(p);
                            setActionQuantity('');
                            setActionReason('');
                            setSaleModalOpen(true);
                          }}
                        >
                          <ShoppingCart size={15} className="text-blue-500" />
                        </Button>

                        <Button
                          variant="icon"
                          size="sm"
                          title="Restock"
                          onClick={() => {
                            setSelectedProduct(p);
                            setActionQuantity('');
                            setActionReason('');
                            setRestockModalOpen(true);
                          }}
                        >
                          <RotateCcw size={15} className="text-emerald-500" />
                        </Button>

                        <Button
                          variant="icon"
                          size="sm"
                          title="Edit Product"
                          onClick={() => openEditModal(p)}
                        >
                          <Pencil size={15} />
                        </Button>

                        <Button
                          variant="icon"
                          size="sm"
                          title="Delete Product"
                          onClick={() => {
                            setSelectedProduct(p);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={15} className="text-danger" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Modal: Add Product */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Inventory Product"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddSubmit} loading={submitting}>
              Create Product
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Ergonomic Office Chair"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              required
            />
            {formErrors.productName && <span className="form-error">{formErrors.productName}</span>}
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">SKU Code *</label>
              <input
                type="text"
                className="form-input font-mono"
                placeholder="e.g. CHAIR-ERG-01"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                required
              />
              {formErrors.sku && <span className="form-error">{formErrors.sku}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Furniture / Electronics"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Supplier Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Apex Office Supplies"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Initial Stock *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
                value={form.currentStock}
                onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                required
              />
              {formErrors.currentStock && <span className="form-error">{formErrors.currentStock}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Safety Threshold *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="10"
                value={form.minimumStock}
                onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
                required
              />
              {formErrors.minimumStock && <span className="form-error">{formErrors.minimumStock}</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Maximum Stock Capacity</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="100"
                value={form.maximumStock}
                onChange={(e) => setForm({ ...form, maximumStock: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input font-mono"
                placeholder="29.99"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                required
              />
              {formErrors.unitPrice && <span className="form-error">{formErrors.unitPrice}</span>}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Product */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Inventory Product"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} loading={submitting}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-input"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              required
            />
            {formErrors.productName && <span className="form-error">{formErrors.productName}</span>}
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">SKU Code *</label>
              <input
                type="text"
                className="form-input font-mono"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                required
              />
              {formErrors.sku && <span className="form-error">{formErrors.sku}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Supplier Name</label>
            <input
              type="text"
              className="form-input"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Current Stock *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.currentStock}
                onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Safety Threshold *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.minimumStock}
                onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Maximum Stock</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.maximumStock}
                onChange={(e) => setForm({ ...form, maximumStock: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input font-mono"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Restock Row Action */}
      <Modal
        isOpen={restockModalOpen}
        onClose={() => setRestockModalOpen(false)}
        title={`Restock: ${selectedProduct?.productName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRestockModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleRestockSubmit} loading={submitting}>
              Add Stock
            </Button>
          </>
        }
      >
        <form onSubmit={handleRestockSubmit}>
          <p className="text-sm text-secondary mb-4">
            Current Stock: <strong className="font-mono">{selectedProduct?.currentStock}</strong> units. Minimum threshold: <strong className="font-mono">{selectedProduct?.minimumStock}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">Quantity to Add *</label>
            <input
              type="number"
              min="1"
              className="form-input"
              placeholder="e.g. 25"
              value={actionQuantity}
              onChange={(e) => setActionQuantity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Reference Note</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. PO #7411"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Sale Row Action */}
      <Modal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        title={`Record Sale: ${selectedProduct?.productName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSaleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaleSubmit} loading={submitting}>
              Confirm Sale
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaleSubmit}>
          <p className="text-sm text-secondary mb-4">
            Current Stock: <strong className="font-mono">{selectedProduct?.currentStock}</strong> units | Unit Price: <strong className="font-mono">{formatCurrency(selectedProduct?.unitPrice)}</strong>
          </p>

          <div className="form-group">
            <label className="form-label">Units Sold *</label>
            <input
              type="number"
              min="1"
              max={selectedProduct?.currentStock || 0}
              className="form-input"
              placeholder="e.g. 3"
              value={actionQuantity}
              onChange={(e) => setActionQuantity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Customer / Invoice Note</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Inv #892"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Confirm */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Product"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSubmit} loading={submitting}>
              Delete Product
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
          <AlertCircle size={24} className="text-danger" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p className="font-semibold text-sm">Are you sure you want to delete this product?</p>
            <p className="text-xs text-muted mt-1">
              "{selectedProduct?.productName}" ({selectedProduct?.sku}) will be permanently removed from your catalog.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Products;