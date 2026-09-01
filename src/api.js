/**
 * Inventory Management System - API Service Layer & Calculations
 * 
 * Supports both Google Apps Script (GAS) Web App Backend and
 * standalone persistent LocalStorage mode for seamless local development & offline testing.
 */

const STORAGE_KEYS = {
  PRODUCTS: 'ims_products',
  SALES: 'ims_sales',
  MOVEMENTS: 'ims_movements',
  ALERTS: 'ims_alerts',
  SETTINGS: 'ims_settings',
  API_URL: 'ims_api_url'
};

// Initial Seed Data for Instant Local Testing
const INITIAL_PRODUCTS = [
  {
    productId: 'PROD-101',
    productName: 'Ergonomic Mechanical Keyboard',
    sku: 'KB-MECH-01',
    category: 'Electronics',
    supplier: 'Apex Tech Corp',
    currentStock: 14,
    minimumStock: 20,
    maximumStock: 100,
    unitPrice: 89.99,
    lastRestocked: '2026-08-15T10:00:00Z',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-08-15T10:00:00Z'
  },
  {
    productId: 'PROD-102',
    productName: 'Wireless Noise-Cancelling Headphones',
    sku: 'AUD-NC-02',
    category: 'Electronics',
    supplier: 'SoundWave Audio',
    currentStock: 4,
    minimumStock: 15,
    maximumStock: 80,
    unitPrice: 149.50,
    lastRestocked: '2026-08-10T12:00:00Z',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-08-10T12:00:00Z'
  },
  {
    productId: 'PROD-103',
    productName: 'Ultra-Wide 34" Curved Monitor',
    sku: 'MON-34C-03',
    category: 'Electronics',
    supplier: 'Vision Display Ltd',
    currentStock: 28,
    minimumStock: 10,
    maximumStock: 50,
    unitPrice: 429.00,
    lastRestocked: '2026-08-20T14:30:00Z',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-08-20T14:30:00Z'
  },
  {
    productId: 'PROD-104',
    productName: 'USB-C Multi-Port Hub (8-in-1)',
    sku: 'HUB-USBC-04',
    category: 'Accessories',
    supplier: 'ConnectMax Inc',
    currentStock: 0,
    minimumStock: 25,
    maximumStock: 150,
    unitPrice: 39.99,
    lastRestocked: '2026-07-28T11:00:00Z',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-08-25T15:00:00Z'
  },
  {
    productId: 'PROD-105',
    productName: 'Heavy Duty Standing Desk Mat',
    sku: 'DESK-MAT-05',
    category: 'Office Supplies',
    supplier: 'ComfortWork Space',
    currentStock: 45,
    minimumStock: 15,
    maximumStock: 90,
    unitPrice: 49.00,
    lastRestocked: '2026-08-18T09:00:00Z',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-08-18T09:00:00Z'
  },
  {
    productId: 'PROD-106',
    productName: 'High-Speed 4K HDMI Cable (6ft)',
    sku: 'CAB-HDMI-06',
    category: 'Accessories',
    supplier: 'Apex Tech Corp',
    currentStock: 8,
    minimumStock: 30,
    maximumStock: 200,
    unitPrice: 12.99,
    lastRestocked: '2026-08-05T16:00:00Z',
    createdAt: '2026-03-12T13:00:00Z',
    updatedAt: '2026-08-22T10:00:00Z'
  },
  {
    productId: 'PROD-107',
    productName: 'Aluminum Laptop Stand (Adjustable)',
    sku: 'STND-LPT-07',
    category: 'Accessories',
    supplier: 'ComfortWork Space',
    currentStock: 32,
    minimumStock: 20,
    maximumStock: 120,
    unitPrice: 34.50,
    lastRestocked: '2026-08-22T11:00:00Z',
    createdAt: '2026-04-01T09:30:00Z',
    updatedAt: '2026-08-22T11:00:00Z'
  },
  {
    productId: 'PROD-108',
    productName: 'Precision Gaming Mouse (16k DPI)',
    sku: 'MOU-GAME-08',
    category: 'Electronics',
    supplier: 'Apex Tech Corp',
    currentStock: 18,
    minimumStock: 25,
    maximumStock: 110,
    unitPrice: 59.99,
    lastRestocked: '2026-08-14T10:30:00Z',
    createdAt: '2026-04-15T14:00:00Z',
    updatedAt: '2026-08-14T10:30:00Z'
  }
];

const INITIAL_SALES = [
  { saleId: 'SALE-1001', productId: 'PROD-101', quantity: 6, unitPrice: 89.99, totalAmount: 539.94, saleDate: '2026-08-26T14:00:00Z' },
  { saleId: 'SALE-1002', productId: 'PROD-101', quantity: 4, unitPrice: 89.99, totalAmount: 359.96, saleDate: '2026-08-28T11:30:00Z' },
  { saleId: 'SALE-1003', productId: 'PROD-102', quantity: 8, unitPrice: 149.50, totalAmount: 1196.00, saleDate: '2026-08-24T16:20:00Z' },
  { saleId: 'SALE-1004', productId: 'PROD-102', quantity: 5, unitPrice: 149.50, totalAmount: 747.50, saleDate: '2026-08-29T10:15:00Z' },
  { saleId: 'SALE-1005', productId: 'PROD-104', quantity: 15, unitPrice: 39.99, totalAmount: 599.85, saleDate: '2026-08-25T15:45:00Z' },
  { saleId: 'SALE-1006', productId: 'PROD-106', quantity: 22, unitPrice: 12.99, totalAmount: 285.78, saleDate: '2026-08-27T09:10:00Z' },
  { saleId: 'SALE-1007', productId: 'PROD-108', quantity: 9, unitPrice: 59.99, totalAmount: 539.91, saleDate: '2026-08-30T13:40:00Z' },
  { saleId: 'SALE-1008', productId: 'PROD-103', quantity: 2, unitPrice: 429.00, totalAmount: 858.00, saleDate: '2026-08-31T17:00:00Z' }
];

const INITIAL_MOVEMENTS = [
  { movementId: 'MOV-1001', productId: 'PROD-101', type: 'RESTOCK', quantity: 25, date: '2026-08-15T10:00:00Z', reason: 'Supplier PO #7891' },
  { movementId: 'MOV-1002', productId: 'PROD-101', type: 'SALE', quantity: 6, date: '2026-08-26T14:00:00Z', reason: 'Customer Order #4401' },
  { movementId: 'MOV-1003', productId: 'PROD-101', type: 'SALE', quantity: 4, date: '2026-08-28T11:30:00Z', reason: 'Customer Order #4422' },
  { movementId: 'MOV-1004', productId: 'PROD-102', type: 'SALE', quantity: 8, date: '2026-08-24T16:20:00Z', reason: 'Customer Order #4405' },
  { movementId: 'MOV-1005', productId: 'PROD-102', type: 'SALE', quantity: 5, date: '2026-08-29T10:15:00Z', reason: 'Customer Order #4430' },
  { movementId: 'MOV-1006', productId: 'PROD-104', type: 'SALE', quantity: 15, date: '2026-08-25T15:45:00Z', reason: 'Stock Depleted - Flash Sale' },
  { movementId: 'MOV-1007', productId: 'PROD-106', type: 'SALE', quantity: 22, date: '2026-08-27T09:10:00Z', reason: 'Bulk Educational Order' },
  { movementId: 'MOV-1008', productId: 'PROD-105', type: 'RESTOCK', quantity: 30, date: '2026-08-18T09:00:00Z', reason: 'Monthly Inventory Replenishment' }
];

const INITIAL_SETTINGS = [
  { setting: 'safetyStockMultiplier', value: '1.5' },
  { setting: 'predictionDays', value: '30' },
  { setting: 'lowStockThreshold', value: '80' },
  { setting: 'restockLeadTime', value: '7' }
];

// Calculation Helpers
export const generateId = (prefix = 'ID') => {
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${timestamp}${randomStr}`;
};

export const calculateAverageDailyDemand = (sales = [], productId, days = 30) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const productSales = sales.filter(s => {
    if (s.productId !== productId) return false;
    const saleDate = new Date(s.saleDate);
    return !isNaN(saleDate.getTime()) && saleDate >= cutoff;
  });

  const totalQuantity = productSales.reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0);
  return days > 0 ? parseFloat((totalQuantity / days).toFixed(2)) : 0;
};

export const calculateDemandPrediction = (avgDailyDemand, days = 30) => {
  const demand = parseFloat(avgDailyDemand) || 0;
  return Math.ceil(demand * days);
};

export const calculateSafetyStock = (avgDailyDemand, leadTimeDays = 7, safetyMultiplier = 1.5) => {
  const demand = parseFloat(avgDailyDemand) || 0;
  const leadTime = parseFloat(leadTimeDays) || 7;
  const multiplier = parseFloat(safetyMultiplier) || 1.5;
  return Math.ceil(demand * leadTime * multiplier);
};

export const calculateDaysUntilStockout = (currentStock, avgDailyDemand) => {
  const stock = parseFloat(currentStock) || 0;
  const demand = parseFloat(avgDailyDemand) || 0;
  if (stock <= 0) return 0;
  if (demand <= 0) return 999; // Sufficient / no current demand
  return Math.floor(stock / demand);
};

// Local Storage Repository
class LocalRepository {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
    this.recomputeAlerts();
  }

  resetData() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    this.recomputeAlerts();
  }

  getProducts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [];
    } catch (e) {
      return INITIAL_PRODUCTS;
    }
  }

  saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.recomputeAlerts();
  }

  getSales() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES)) || [];
    } catch (e) {
      return INITIAL_SALES;
    }
  }

  saveSales(sales) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }

  getMovements() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) || [];
    } catch (e) {
      return INITIAL_MOVEMENTS;
    }
  }

  saveMovements(movements) {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }

  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || INITIAL_SETTINGS;
    } catch (e) {
      return INITIAL_SETTINGS;
    }
  }

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  getAlerts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS)) || [];
    } catch (e) {
      return [];
    }
  }

  saveAlerts(alerts) {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  }

  recomputeAlerts() {
    const products = this.getProducts();
    const existingAlerts = this.getAlerts();
    const activeResolvedMap = new Map();
    
    existingAlerts.forEach(a => {
      if (a.status === 'RESOLVED') {
        activeResolvedMap.set(a.productId, a.status);
      }
    });

    const newAlerts = [];
    products.forEach(p => {
      const stock = parseFloat(p.currentStock) || 0;
      const min = parseFloat(p.minimumStock) || 0;

      if (stock <= min) {
        let severity = 'MEDIUM';
        let message = `Product '${p.productName}' is approaching minimum stock level (${stock}/${min}).`;

        if (stock <= 0) {
          severity = 'CRITICAL';
          message = `Product '${p.productName}' is OUT OF STOCK (0 units remaining). Immediate reorder required!`;
        } else if (stock <= min * 0.4) {
          severity = 'HIGH';
          message = `Product '${p.productName}' is critically low (${stock} units left, minimum: ${min}).`;
        }

        const existing = existingAlerts.find(a => a.productId === p.productId && a.status === 'ACTIVE');

        newAlerts.push({
          alertId: existing ? existing.alertId : generateId('ALT'),
          productId: p.productId,
          productName: p.productName,
          sku: p.sku,
          currentStock: stock,
          minimumStock: min,
          alertType: stock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          message,
          severity,
          createdAt: existing ? existing.createdAt : new Date().toISOString(),
          status: existing ? existing.status : 'ACTIVE'
        });
      }
    });

    // Also keep resolved alerts for history
    const resolvedAlerts = existingAlerts.filter(a => a.status === 'RESOLVED');
    this.saveAlerts([...newAlerts, ...resolvedAlerts]);
  }
}

const localRepo = new LocalRepository();

// Unified API Service
const api = {
  // Config & Status Helpers
  getApiUrl: () => {
    return localStorage.getItem(STORAGE_KEYS.API_URL) || (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) || '';
  },

  setApiUrl: (url) => {
    const cleanUrl = url ? url.trim() : '';
    localStorage.setItem(STORAGE_KEYS.API_URL, cleanUrl);
    return cleanUrl;
  },

  isConfigured: () => {
    const url = api.getApiUrl();
    return !!url && url.includes('script.google.com');
  },

  testConnection: async (testUrl) => {
    const url = (testUrl || api.getApiUrl()).trim();
    if (!url) throw new Error('Please provide a Google Apps Script Web App URL');

    const fullUrl = url.includes('?') ? `${url}&action=getDashboard` : `${url}?action=getDashboard`;
    try {
      const response = await fetch(fullUrl, { method: 'GET', mode: 'cors' });
      const result = await response.json();
      if (result && result.success !== undefined) {
        return { success: true, message: 'Successfully connected to Google Apps Script backend!' };
      }
      return { success: true, message: 'Connected to backend endpoint' };
    } catch (e) {
      throw new Error(`Connection test failed: ${e.message}. Ensure the script is deployed as a Web App with access set to "Anyone".`);
    }
  },

  resetSampleData: async () => {
    localRepo.resetData();
    return { success: true, message: 'Sample inventory data reset successfully.' };
  },

  // Products
  getProducts: async () => {
    if (api.isConfigured()) {
      try {
        const url = `${api.getApiUrl()}?action=getProducts`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) return { data: json.data || [] };
      } catch (e) {
        console.warn('GAS fetch failed, using local storage fallback:', e);
      }
    }
    return { data: localRepo.getProducts() };
  },

  getProduct: async (id) => {
    if (api.isConfigured()) {
      try {
        const url = `${api.getApiUrl()}?action=getProduct&id=${encodeURIComponent(id)}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) return { data: json.data };
      } catch (e) {
        console.warn('GAS fetch failed, using local fallback:', e);
      }
    }
    const products = localRepo.getProducts();
    const prod = products.find(p => p.productId === id);
    if (!prod) throw new Error('Product not found');
    return { data: prod };
  },

  addProduct: async (productData) => {
    const newProduct = {
      productId: productData.productId || generateId('PROD'),
      productName: productData.productName,
      sku: productData.sku,
      category: productData.category || 'General',
      supplier: productData.supplier || 'Unassigned',
      currentStock: parseFloat(productData.currentStock) || 0,
      minimumStock: parseFloat(productData.minimumStock) || 0,
      maximumStock: parseFloat(productData.maximumStock) || 100,
      unitPrice: parseFloat(productData.unitPrice) || 0,
      lastRestocked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (api.isConfigured()) {
      try {
        await fetch(api.getApiUrl(), {
          method: 'POST',
          body: JSON.stringify({ action: 'addProduct', data: newProduct })
        });
      } catch (e) {
        console.warn('GAS addProduct error:', e);
      }
    }

    // Always keep local mirror updated
    const products = localRepo.getProducts();
    products.unshift(newProduct);
    localRepo.saveProducts(products);

    // Record initial stock movement
    if (newProduct.currentStock > 0) {
      await api.addStockMovement({
        productId: newProduct.productId,
        type: 'INITIAL',
        quantity: newProduct.currentStock,
        reason: 'Initial Product Stock Addition'
      });
    }

    return { data: newProduct, success: true };
  },

  updateProduct: async (productData) => {
    const updated = {
      ...productData,
      currentStock: parseFloat(productData.currentStock) || 0,
      minimumStock: parseFloat(productData.minimumStock) || 0,
      maximumStock: parseFloat(productData.maximumStock) || 0,
      unitPrice: parseFloat(productData.unitPrice) || 0,
      updatedAt: new Date().toISOString()
    };

    if (api.isConfigured()) {
      try {
        await fetch(api.getApiUrl(), {
          method: 'POST',
          body: JSON.stringify({ action: 'updateProduct', data: updated })
        });
      } catch (e) {
        console.warn('GAS updateProduct error:', e);
      }
    }

    const products = localRepo.getProducts();
    const index = products.findIndex(p => p.productId === updated.productId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updated };
      localRepo.saveProducts(products);
    }

    return { data: updated, success: true };
  },

  deleteProduct: async (id) => {
    if (api.isConfigured()) {
      try {
        await fetch(`${api.getApiUrl()}?action=deleteProduct&id=${encodeURIComponent(id)}`);
      } catch (e) {
        console.warn('GAS deleteProduct error:', e);
      }
    }

    const products = localRepo.getProducts().filter(p => p.productId !== id);
    localRepo.saveProducts(products);
    return { success: true };
  },

  // Sales
  addSale: async (saleData) => {
    const quantity = parseFloat(saleData.quantity) || 0;
    const unitPrice = parseFloat(saleData.unitPrice) || 0;
    const totalAmount = quantity * unitPrice;

    const newSale = {
      saleId: generateId('SALE'),
      productId: saleData.productId,
      quantity,
      unitPrice,
      totalAmount,
      saleDate: new Date().toISOString()
    };

    if (api.isConfigured()) {
      try {
        await fetch(api.getApiUrl(), {
          method: 'POST',
          body: JSON.stringify({ action: 'addSale', data: newSale })
        });
      } catch (e) {
        console.warn('GAS addSale error:', e);
      }
    }

    // Update sales list
    const sales = localRepo.getSales();
    sales.unshift(newSale);
    localRepo.saveSales(sales);

    // Deduct stock from product
    const products = localRepo.getProducts();
    const prod = products.find(p => p.productId === saleData.productId);
    if (prod) {
      prod.currentStock = Math.max(0, (parseFloat(prod.currentStock) || 0) - quantity);
      prod.updatedAt = new Date().toISOString();
      localRepo.saveProducts(products);
    }

    // Add stock movement
    await api.addStockMovement({
      productId: saleData.productId,
      type: 'SALE',
      quantity: -quantity,
      reason: saleData.reason || `Customer Sale (${quantity} units)`
    });

    return { data: newSale, success: true };
  },

  // Stock Management (Restock / Adjustments)
  restockProduct: async (restockData) => {
    const qty = parseFloat(restockData.quantity) || 0;
    const productId = restockData.productId;

    if (api.isConfigured()) {
      try {
        await fetch(api.getApiUrl(), {
          method: 'POST',
          body: JSON.stringify({ action: 'restockProduct', data: restockData })
        });
      } catch (e) {
        console.warn('GAS restockProduct error:', e);
      }
    }

    const products = localRepo.getProducts();
    const prod = products.find(p => p.productId === productId);
    if (prod) {
      prod.currentStock = (parseFloat(prod.currentStock) || 0) + qty;
      prod.lastRestocked = new Date().toISOString();
      prod.updatedAt = new Date().toISOString();
      localRepo.saveProducts(products);
    }

    await api.addStockMovement({
      productId,
      type: 'RESTOCK',
      quantity: qty,
      reason: restockData.reason || `Restocked ${qty} units`
    });

    return { success: true };
  },

  updateStock: async (stockData) => {
    const { productId, currentStock, reason } = stockData;
    const products = localRepo.getProducts();
    const prod = products.find(p => p.productId === productId);
    if (!prod) throw new Error('Product not found');

    const diff = (parseFloat(currentStock) || 0) - (parseFloat(prod.currentStock) || 0);
    prod.currentStock = parseFloat(currentStock) || 0;
    prod.updatedAt = new Date().toISOString();
    localRepo.saveProducts(products);

    await api.addStockMovement({
      productId,
      type: diff >= 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_SUB',
      quantity: diff,
      reason: reason || 'Inventory stock manual adjustment'
    });

    return { success: true };
  },

  // Stock Movements
  getStockMovements: async () => {
    if (api.isConfigured()) {
      try {
        const url = `${api.getApiUrl()}?action=getStockMovements`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) return { data: json.data || [] };
      } catch (e) {
        console.warn('GAS fetch movements failed:', e);
      }
    }
    const movements = localRepo.getMovements();
    const products = localRepo.getProducts();
    const prodMap = new Map(products.map(p => [p.productId, p]));

    const enriched = movements.map(m => ({
      ...m,
      productName: prodMap.get(m.productId)?.productName || 'Unknown Product',
      sku: prodMap.get(m.productId)?.sku || '—'
    }));

    return { data: enriched };
  },

  addStockMovement: async (movementData) => {
    const newMovement = {
      movementId: generateId('MOV'),
      productId: movementData.productId,
      type: movementData.type || 'ADJUSTMENT',
      quantity: parseFloat(movementData.quantity) || 0,
      date: new Date().toISOString(),
      reason: movementData.reason || 'General inventory activity'
    };

    const movements = localRepo.getMovements();
    movements.unshift(newMovement);
    localRepo.saveMovements(movements);

    return { data: newMovement, success: true };
  },

  // Alerts
  getAlerts: async () => {
    if (api.isConfigured()) {
      try {
        const url = `${api.getApiUrl()}?action=getAlerts`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) return { data: json.data || [] };
      } catch (e) {
        console.warn('GAS alerts fetch error:', e);
      }
    }
    localRepo.recomputeAlerts();
    return { data: localRepo.getAlerts() };
  },

  resolveAlert: async ({ alertId }) => {
    if (api.isConfigured()) {
      try {
        await fetch(api.getApiUrl(), {
          method: 'POST',
          body: JSON.stringify({ action: 'resolveAlert', data: { alertId } })
        });
      } catch (e) {
        console.warn('GAS resolveAlert error:', e);
      }
    }

    const alerts = localRepo.getAlerts();
    const alert = alerts.find(a => a.alertId === alertId);
    if (alert) {
      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date().toISOString();
      localRepo.saveAlerts(alerts);
    }
    return { success: true };
  },

  // Predictions (Demand Forecasting)
  getPredictions: async () => {
    const products = localRepo.getProducts();
    const sales = localRepo.getSales();
    const settingsList = localRepo.getSettings();
    const settingMap = {};
    settingsList.forEach(s => { settingMap[s.setting] = s.value; });

    const predictionDays = parseInt(settingMap.predictionDays, 10) || 30;
    const leadTime = parseInt(settingMap.restockLeadTime, 10) || 7;
    const safetyMultiplier = parseFloat(settingMap.safetyStockMultiplier) || 1.5;

    const predictions = products.map(p => {
      const avgDailyDemand = calculateAverageDailyDemand(sales, p.productId, 30);
      const predictedDemand = calculateDemandPrediction(avgDailyDemand, predictionDays);
      const safetyStock = calculateSafetyStock(avgDailyDemand, leadTime, safetyMultiplier);
      const daysUntilStockout = calculateDaysUntilStockout(p.currentStock, avgDailyDemand);

      let riskLevel = 'SAFE';
      if (p.currentStock <= 0) riskLevel = 'CRITICAL';
      else if (daysUntilStockout <= 3) riskLevel = 'CRITICAL';
      else if (daysUntilStockout <= 7) riskLevel = 'HIGH';
      else if (daysUntilStockout <= 14) riskLevel = 'MEDIUM';

      return {
        productId: p.productId,
        productName: p.productName,
        sku: p.sku,
        category: p.category,
        currentStock: p.currentStock,
        minimumStock: p.minimumStock,
        avgDailyDemand,
        predictedDemand,
        safetyStock,
        daysUntilStockout,
        riskLevel,
        confidence: avgDailyDemand > 0 ? 'High (Based on 30d run rate)' : 'Insufficient History'
      };
    });

    return { data: predictions };
  },

  // Reorder Suggestions
  getReorderSuggestions: async () => {
    const { data: predictions } = await api.getPredictions();
    const products = localRepo.getProducts();
    const prodMap = new Map(products.map(p => [p.productId, p]));

    const suggestions = predictions
      .map(pred => {
        const prod = prodMap.get(pred.productId);
        const targetStock = (pred.predictedDemand || 0) + (pred.safetyStock || 0);
        const reorderQuantity = Math.max(0, targetStock - pred.currentStock);

        let priority = 'LOW';
        if (pred.currentStock <= 0 || pred.daysUntilStockout <= 3) priority = 'CRITICAL';
        else if (pred.currentStock <= pred.minimumStock || pred.daysUntilStockout <= 7) priority = 'HIGH';
        else if (reorderQuantity > 0 && pred.daysUntilStockout <= 15) priority = 'MEDIUM';

        const estimatedStockoutDate = pred.daysUntilStockout < 999
          ? new Date(Date.now() + pred.daysUntilStockout * 24 * 60 * 60 * 1000).toISOString()
          : null;

        return {
          productId: pred.productId,
          productName: pred.productName,
          sku: pred.sku,
          category: pred.category,
          supplier: prod?.supplier || 'Default Supplier',
          currentStock: pred.currentStock,
          minimumStock: pred.minimumStock,
          predictedDemand: pred.predictedDemand,
          safetyStock: pred.safetyStock,
          reorderQuantity: Math.max(reorderQuantity, pred.minimumStock),
          unitPrice: prod?.unitPrice || 0,
          estimatedCost: Math.max(reorderQuantity, pred.minimumStock) * (prod?.unitPrice || 0),
          daysUntilStockout: pred.daysUntilStockout,
          estimatedStockoutDate,
          priority,
          recommendedAction: priority === 'CRITICAL'
            ? 'Place immediate rush purchase order'
            : priority === 'HIGH'
            ? 'Issue standard supplier purchase order'
            : 'Monitor weekly replenishment cycle'
        };
      })
      .filter(s => s.priority === 'CRITICAL' || s.priority === 'HIGH' || s.currentStock <= s.minimumStock)
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return order[a.priority] - order[b.priority];
      });

    return { data: suggestions };
  },

  // Dashboard
  getDashboard: async () => {
    const products = localRepo.getProducts();
    const sales = localRepo.getSales();
    const movements = localRepo.getMovements();
    const alerts = localRepo.getAlerts().filter(a => a.status === 'ACTIVE');
    const { data: predictions } = await api.getPredictions();

    const totalProducts = products.length;
    const totalInventoryUnits = products.reduce((acc, p) => acc + (parseFloat(p.currentStock) || 0), 0);
    const totalInventoryValue = products.reduce((acc, p) => acc + ((parseFloat(p.currentStock) || 0) * (parseFloat(p.unitPrice) || 0)), 0);
    
    const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minimumStock).length;
    const outOfStockCount = products.filter(p => p.currentStock <= 0).length;
    const criticalStockCount = predictions.filter(p => p.riskLevel === 'CRITICAL').length;
    
    const totalSalesAmount = sales.reduce((acc, s) => acc + (parseFloat(s.totalAmount) || 0), 0);

    const prodMap = new Map(products.map(p => [p.productId, p]));
    const recentActivity = movements.slice(0, 8).map(m => ({
      ...m,
      productName: prodMap.get(m.productId)?.productName || 'Product',
      sku: prodMap.get(m.productId)?.sku || ''
    }));

    return {
      data: {
        totalProducts,
        totalInventoryUnits,
        totalInventoryValue,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
        criticalStockProducts: criticalStockCount,
        activeAlertCount: alerts.length,
        totalSales: totalSalesAmount,
        recentActivity,
        predictionOverview: predictions.slice(0, 5)
      }
    };
  },

  // Settings
  getSettings: async () => {
    if (api.isConfigured()) {
      try {
        const url = `${api.getApiUrl()}?action=getSettings`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) return { data: json.data || [] };
      } catch (e) {
        console.warn('GAS getSettings error:', e);
      }
    }
    return { data: localRepo.getSettings() };
  },

  updateSetting: async ({ setting, value }) => {
    if (api.isConfigured()) {
      try {
        await fetch(api.getApiUrl(), {
          method: 'POST',
          body: JSON.stringify({ action: 'updateSetting', data: { setting, value } })
        });
      } catch (e) {
        console.warn('GAS updateSetting error:', e);
      }
    }

    const settings = localRepo.getSettings();
    const idx = settings.findIndex(s => s.setting === setting);
    if (idx !== -1) {
      settings[idx].value = value;
    } else {
      settings.push({ setting, value });
    }
    localRepo.saveSettings(settings);

    return { success: true };
  }
};

export default api;