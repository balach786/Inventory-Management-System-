/**
 * Inventory Management System - Google Apps Script Backend
 * 
 * This script provides a complete API for managing inventory, products,
 * stock movements, sales, alerts, and predictions using Google Sheets as the database.
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();
const PRODUCTS_SHEET = 'Products';
const SALES_SHEET = 'Sales';
const STOCK_MOVEMENTS_SHEET = 'StockMovements';
const ALERTS_SHEET = 'Alerts';
const SETTINGS_SHEET = 'Settings';

// ---------------------------------------------------------------------------
// Initialize sheets and headers on first load
// ---------------------------------------------------------------------------

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) 
      ? e.parameter.action 
      : (e && e.parameters && e.parameters.action 
          ? (Array.isArray(e.parameters.action) ? e.parameters.action[0] : e.parameters.action) 
          : '');
    const id = (e && e.parameter && e.parameter.id) 
      ? e.parameter.id 
      : (e && e.parameters && e.parameters.id 
          ? (Array.isArray(e.parameters.id) ? e.parameters.id[0] : e.parameters.id) 
          : '');
    
    // Initialize sheets on first access
    initializeSheets();
    
    switch (action) {
      case 'getProducts': return getProducts();
      case 'getProduct': return getProduct(id);
      case 'getDashboard': return getDashboard();
      case 'getLowStock': return getLowStock();
      case 'getAlerts': return getAlerts();
      case 'getPredictions': return getPredictions();
      case 'getReorderSuggestions': return getReorderSuggestions();
      case 'getStockMovements': return getStockMovements();
      case 'getSettings': return getSettingsOutput();
      case 'deleteProduct': return deleteProduct(id);
      default: return getDashboard();
    }
  } catch (f) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error: ' + f.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

function doPost(e) {
  try {
    const params = (e && e.postData && e.postData.contents) ? JSON.parse(e.postData.contents) : {};
    const action = params.action || (e && e.parameter && e.parameter.action) || '';
    const data = params.data || {};
    
    // Initialize sheets on first access
    initializeSheets();
    
    switch (action) {
      case 'addProduct': return addProduct(data);
      case 'addSale': return addSale(data);
      case 'updateStock': return updateStock(data);
      case 'restockProduct': return restockProduct(data);
      case 'addStockMovement': return addStockMovement(data);
      case 'updateProduct': return updateProduct(data);
      case 'updateAlert': return updateAlert(data);
      case 'resolveAlert': return updateAlert(data);
      case 'deleteProduct': return deleteProduct(data.productId || data.id || data);
      case 'updateSetting': return updateSetting(data);
      default: return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Unknown action: ' + action
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
  } catch (f) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error: ' + f.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

// ---------------------------------------------------------------------------
// Sheet Initialization
// ---------------------------------------------------------------------------

function initializeSheets() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create sheets if they don't exist
    const sheets = ['Products', 'Sales', 'StockMovements', 'Alerts', 'Settings'];
    sheets.forEach(sheetName => {
      if (!ss.getSheetByName(sheetName)) {
        ss.insertSheet(sheetName);
      }
    });
    
    // Set up headers
    setupProductHeaders();
    setupSalesHeaders();
    setupStockMovementsHeaders();
    setupAlertsHeaders();
    setupSettingsHeaders();
  } catch (e) {
    Logger.log('initializeSheets error: ' + e.message);
  }
}

// Product headers
function setupProductHeaders() {
  const sheet = SS.getSheetByName(PRODUCTS_SHEET);
  const headers = [
    'productId', 'productName', 'sku', 'category', 'supplier',
    'currentStock', 'minimumStock', 'maximumStock', 'unitPrice',
    'lastRestocked', 'createdAt', 'updatedAt'
  ];
  
  const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headersMatch = headers.every((h, i) => h === existingHeaders[i]);
  
  if (!headersMatch) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

// Sales headers
function setupSalesHeaders() {
  const sheet = SS.getSheetByName(SALES_SHEET);
  const headers = ['saleId', 'productId', 'quantity', 'saleDate', 'unitPrice', 'totalAmount'];
  
  const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headersMatch = headers.every((h, i) => h === existingHeaders[i]);
  
  if (!headersMatch) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

// StockMovements headers
function setupStockMovementsHeaders() {
  const sheet = SS.getSheetByName(STOCK_MOVEMENTS_SHEET);
  const headers = ['movementId', 'productId', 'type', 'quantity', 'date', 'reason'];
  
  const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headersMatch = headers.every((h, i) => h === existingHeaders[i]);
  
  if (!headersMatch) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

// Alerts headers
function setupAlertsHeaders() {
  const sheet = SS.getSheetByName(ALERTS_SHEET);
  const headers = ['alertId', 'productId', 'alertType', 'message', 'severity', 'createdAt', 'status'];
  
  const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headersMatch = headers.every((h, i) => h === existingHeaders[i]);
  
  if (!headersMatch) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

// Settings headers
function setupSettingsHeaders() {
  const sheet = SS.getSheetByName(SETTINGS_SHEET);
  const headers = ['setting', 'value'];
  
  const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headersMatch = headers.every((h, i) => h === existingHeaders[i]);
  
  if (!headersMatch) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  // Initialize default settings if empty
  const settings = getAllSettings();
  if (settings.length === 0) {
    const defaults = [
      ['safetyStockMultiplier', '1.5'],
      ['predictionDays', '30'],
      ['lowStockThreshold', '80'], // percentage
      ['restockLeadTime', '7']    // days
    ];
    defaults.forEach(d => appendRowSheet(SETTINGS_SHEET, d));
  }
}

// ---------------------------------------------------------------------------
// Product CRUD
// ---------------------------------------------------------------------------

function getProducts() {
  const sheet = SS.getSheetByName(PRODUCTS_SHEET);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  const products = data
    .filter(row => row[0]) // filter out empty rows
    .map(row => ({
      productId: row[0],
      productName: row[1],
      sku: row[2],
      category: row[3],
      supplier: row[4],
      currentStock: parseFloat(row[5]) || 0,
      minimumStock: parseFloat(row[6]) || 0,
      maximumStock: parseFloat(row[7]) || 0,
      unitPrice: parseFloat(row[8]) || 0,
      lastRestocked: row[9] ? formatDate(row[9]) : '',
      createdAt: row[10] ? formatDate(row[10]) : '',
      updatedAt: row[11] ? formatDate(row[11]) : ''
    }));
  return ContentService
    .createOutput(JSON.stringify({
      success: true,
      data: products
    }))
    .setMimeType(ContentService.MIME_TYPE_JSON);
}

function getProduct(id) {
  const sheet = SS.getSheetByName(PRODUCTS_SHEET);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  const row = data.find(r => r[0] === id);
  
  if (!row) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Product not found'
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
  
  return ContentService
    .createOutput(JSON.stringify({
      success: true,
      data: {
        productId: row[0],
        productName: row[1],
        sku: row[2],
        category: row[3],
        supplier: row[4],
        currentStock: parseFloat(row[5]) || 0,
        minimumStock: parseFloat(row[6]) || 0,
        maximumStock: parseFloat(row[7]) || 0,
        unitPrice: parseFloat(row[8]) || 0,
        lastRestocked: row[9] ? formatDate(row[9]) : '',
        createdAt: row[10] ? formatDate(row[10]) : '',
        updatedAt: row[11] ? formatDate(row[11]) : ''
      }
    }))
    .setMimeType(ContentService.MIME_TYPE_JSON);
}

function addProduct(data) {
  try {
    const {
      productName, sku, category, supplier,
      currentStock, minimumStock, maximumStock, unitPrice
    } = data;
    
    // Validation
    if (!productName || !sku) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Product name and SKU are required'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    // Check for duplicate SKU
    const existing = findProductBySKU(sku);
    if (existing) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'SKU already exists'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    const sheet = SS.getSheetByName(PRODUCTS_SHEET);
    const newId = generateId();
    const now = new Date();
    
    const row = [
      newId,
      productName,
      sku,
      category || '',
      supplier || '',
      parseFloat(currentStock) || 0,
      parseFloat(minimumStock) || 0,
      parseFloat(maximumStock) || 100,
      parseFloat(unitPrice) || 0,
      formatDate(now),
      formatDate(now),
      formatDate(now)
    ];
    
    sheet.appendRow(row);
    
    // Generate initial alerts
    generateAlerts();
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: { productId: newId },
        message: 'Product added successfully'
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error adding product: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

function updateProduct(data) {
  try {
    const { productId, productName, sku, category, supplier,
      currentStock, minimumStock, maximumStock, unitPrice } = data;
    
    if (!productId) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Product ID is required'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    // Check for duplicate SKU (excluding current product)
    const existing = findProductBySKU(sku, productId);
    if (existing) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'SKU already exists in another product'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    const sheet = SS.getSheetByName(PRODUCTS_SHEET);
    const rowIndex = sheet.getRange('A:A').getValues()
      .find((r, i) => r[0] === productId && i > 0) + 1;
    
    if (!rowIndex) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Product not found'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    sheet.getRange(rowIndex, 1, 1, 12).setValues([[
      productId,
      productName || '',
      sku || '',
      category || '',
      supplier || '',
      parseFloat(currentStock) || 0,
      parseFloat(minimumStock) || 0,
      parseFloat(maximumStock) || 100,
      parseFloat(unitPrice) || 0,
      formatDate(new Date()),
      formatDate(new Date()),
      formatDate(new Date())
    ]]);
    
    generateAlerts();
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: { productId },
        message: 'Product updated successfully'
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error updating product: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

function deleteProduct(data) {
  try {
    const { productId } = data;
    
    if (!productId) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Product ID is required'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    const sheet = SS.getSheetByName(PRODUCTS_SHEET);
    const rowIndex = sheet.getRange('A:A').getValues()
      .find((r, i) => r[0] === productId && i > 0) + 1;
    
    if (!rowIndex) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Product not found'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    // Delete related sales and stock movements
    const salesSheet = SS.getSheetByName(SALES_SHEET);
    const movementsSheet = SS.getSheetByName(STOCK_MOVEMENTS_SHEET);
    const alertsSheet = SS.getSheetByName(ALERTS_SHEET);
    
    // Get row indices to delete
    const salesData = salesSheet.getRange(2, 1, salesSheet.getLastRow() - 1, 6).getValues();
    salesData.filter((r, i) => r[1] === productId).forEach((r, i) => {
      const si = salesData.findIndex(x => x[0] === r[0]);
      if (si !== -1) salesSheet.deleteRow(si + 2);
    });
    
    const movementsData = movementsSheet.getRange(2, 1, movementsSheet.getLastRow() - 1, 6).getValues();
    movementsData.filter((r, i) => r[1] === productId).forEach((r, i) => {
      const mi = movementsData.findIndex(x => x[0] === r[0]);
      if (mi !== -1) movementsSheet.deleteRow(mi + 2);
    });
    
    // Delete alert for this product
    const alertData = alertsSheet.getRange(2, 1, alertsSheet.getLastRow() - 1, 7).getValues();
    alertData.filter((r, i) => r[1] === productId).forEach((r, i) => {
      const ai = alertData.findIndex(x => x[0] === r[0]);
      if (ai !== -1) alertsSheet.deleteRow(ai + 2);
    });
    
    // Actually delete the product row
    sheet.deleteRow(rowIndex);
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: { productId },
        message: 'Product deleted successfully'
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error deleting product: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

// ---------------------------------------------------------------------------
// Helper: Find product by ID or SKU
// ---------------------------------------------------------------------------

function findProductById(id) {
  const sheet = SS.getSheetByName(PRODUCTS_SHEET);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  return data.find(r => r[0] === id);
}

function findProductBySKU(sku, excludeId = null) {
  const sheet = SS.getSheetByName(PRODUCTS_SHEET);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  return data.find(r => r[2] === sku && r[0] !== excludeId);
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

function addSale(data) {
  try {
    const { productId, quantity, unitPrice } = data;
    
    if (!productId || !quantity || quantity <= 0) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Valid product ID and quantity are required'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    const sheet = SS.getSheetByName(SALES_SHEET);
    const newId = generateId();
    const now = new Date();
    const salesUnitPrice = unitPrice !== undefined ? unitPrice : 0;
    const totalAmount = salesUnitPrice * quantity;
    
    const row = [
      newId,
      productId,
      quantity,
      formatDate(now),
      salesUnitPrice,
      totalAmount
    ];
    
    sheet.appendRow(row);
    
    // Record stock movement for sale
    recordStockMovement({
      productId,
      type: 'SALE',
      quantity,
      reason: 'Sale transaction'
    });
    
    // Update product current stock
    updateProductStock(productId, -quantity);
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: { saleId: newId },
        message: 'Sale recorded successfully'
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error recording sale: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

// ---------------------------------------------------------------------------
// Stock Management
// ---------------------------------------------------------------------------

function updateStock(data) {
  try {
    const { productId, quantity } = data;
    
    if (!productId || quantity === undefined) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Product ID and quantity are required'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    const currentStock = getProductCurrentStock(productId);
    const newStock = currentStock + quantity;
    
    if (newStock < 0) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Stock cannot go below zero'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    updateProductStock(productId, quantity);
    
    // Record stock movement
    recordStockMovement({
      productId,
      type: quantity > 0 ? 'RESTOCK' : 'ADJUSTMENT',
      quantity: Math.abs(quantity),
      reason: 'Stock update'
    });
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: { productId, newStock },
        message: 'Stock updated successfully'
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error updating stock: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

function restockProduct(data) {
  try {
    const { productId, quantity } = data;
    
    if (!productId || !quantity || quantity <= 0) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Valid product ID and restock quantity are required'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    const currentStock = getProductCurrentStock(productId);
    const newStock = currentStock + quantity;
    
    updateProductStock(productId, quantity);
    
    // Record stock movement
    recordStockMovement({
      productId,
      type: 'RESTOCK',
      quantity,
      reason: 'Restock purchase'
    });
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: { productId, newStock },
        message: 'Product restocked successfully'
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error restocking product: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

// Helper: Update product stock in sheet
function updateProductStock(productId, quantityDelta) {
  const sheet = SS.getSheetByName(PRODUCTS_SHEET);
  const rowIndex = sheet.getRange('A:A').getValues()
    .find((r, i) => r[0] === productId && i > 0) + 1;
  
  if (!rowIndex) return;
  
  const currentCell = sheet.getRange(rowIndex, 6); // currentStock column
  const currentValue = currentCell.getValue() ? parseFloat(currentCell.getValue()) : 0;
  const newValue = Math.max(0, currentValue + quantityDelta);
  
  currentCell.setValue(newValue);
  
  // Update last restocked date
  sheet.getRange(rowIndex, 10).setValue(formatDate(new Date()));
  
  // Generate alerts after stock change
  generateAlerts();
}

// ---------------------------------------------------------------------------
// Stock Movement Recording
// ---------------------------------------------------------------------------

function recordStockMovement(data) {
  try {
    const { productId, type, quantity, reason } = data;
    
    const sheet = SS.getSheetByName(STOCK_MOVEMENTS_SHEET);
    const newId = generateId();
    const now = new Date();
    
    const row = [
      newId,
      productId,
      type,
      quantity,
      formatDate(now),
      reason || ''
    ];
    
    sheet.appendRow(row);
  } catch (e) {
    Logger.log('recordStockMovement error: ' + e.message);
  }
}

// ---------------------------------------------------------------------------
// Dashboard Data
// ---------------------------------------------------------------------------

function getDashboard() {
  try {
    const products = getProductsData();
    const movements = getStockMovementsData();
    const alerts = getAlertsData();
    
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + p.currentStock, 0);
    const inventoryValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0);
    const lowStockProducts = products.filter(p => p.currentStock <= p.minimumStock && p.currentStock > 0).length;
    const outOfStockProducts = products.filter(p => p.currentStock <= 0).length;
    const criticalStockProducts = products.filter(p => p.currentStock <= 0).length;
    
    // Recent stock activity
    const recentActivity = movements
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    
    // Sales overview
    const salesData = getSalesData();
    const totalSales = salesData.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    
    // Demand prediction overview
    const predictionOverview = getPredictionOverview(products);
    
    // Reorder recommendations
    const reorderSuggestions = getReorderSuggestionsData();
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: {
          totalProducts,
          totalUnits,
          inventoryValue,
          lowStockProducts,
          outOfStockProducts,
          criticalStockProducts,
          recentActivity,
          totalSales,
          predictionOverview,
          reorderSuggestions
        }
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error getting dashboard: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

function getProductsData() {
  const sheet = SS.getSheetByName(PRODUCTS_SHEET);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  return data
    .filter(row => row[0])
    .map(row => ({
      productId: row[0],
      productName: row[1],
      sku: row[2],
      category: row[3],
      supplier: row[4],
      currentStock: parseFloat(row[5]) || 0,
      minimumStock: parseFloat(row[6]) || 0,
      maximumStock: parseFloat(row[7]) || 0,
      unitPrice: parseFloat(row[8]) || 0,
      lastRestocked: row[9] ? formatDate(row[9]) : '',
      createdAt: row[10] ? formatDate(row[10]) : '',
      updatedAt: row[11] ? formatDate(row[11]) : ''
    }));
}

function getSalesData() {
  const sheet = SS.getSheetByName(SALES_SHEET);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  return data
    .filter(row => row[0])
    .map(row => ({
      saleId: row[0],
      productId: row[1],
      quantity: parseFloat(row[2]) || 0,
      saleDate: row[3] ? formatDate(row[3]) : '',
      unitPrice: parseFloat(row[4]) || 0,
      totalAmount: parseFloat(row[5]) || 0
    }));
}

function getStockMovementsData() {
  const sheet = SS.getSheetByName(STOCK_MOVEMENTS_SHEET);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  return data
    .filter(row => row[0])
    .map(row => ({
      movementId: row[0],
      productId: row[1],
      type: row[2],
      quantity: parseFloat(row[3]) || 0,
      date: row[4] ? formatDate(row[4]) : '',
      reason: row[5] || ''
    }));
}

function getAlertsData() {
  const sheet = SS.getSheetByName(ALERTS_SHEET);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  return data
    .filter(row => row[0])
    .map(row => ({
      alertId: row[0],
      productId: row[1],
      alertType: row[2],
      message: row[3],
      severity: row[4],
      createdAt: row[5] ? formatDate(row[5]) : '',
      status: row[6]
    }));
}

// ---------------------------------------------------------------------------
// Low Stock
// ---------------------------------------------------------------------------

function getLowStock() {
  try {
    const products = getProductsData();
    const lowStock = products
      .filter(p => p.currentStock <= p.minimumStock && p.currentStock > 0)
      .map(p => ({
        productId: p.productId,
        productName: p.productName,
        sku: p.sku,
        currentStock: p.currentStock,
        minimumStock: p.minimumStock,
        severity: p.currentStock <= 0 ? 'CRITICAL' : 'HIGH',
        message: getLowStockMessage(p)
      }));
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: lowStock
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error getting low stock: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

function getLowStockMessage(product) {
  if (product.currentStock <= 0) {
    return `Current stock is 0.`;
  }
  return `Current stock is ${product.currentStock}, minimum stock is ${product.minimumStock}.`;
}

// ---------------------------------------------------------------------------
// Alerts Management
// ---------------------------------------------------------------------------

function generateAlerts() {
  const sheet = SS.getSheetByName(ALERTS_SHEET);
  const products = getProductsData();
  const existingAlerts = getAlertsData();
  
  // Get existing active alerts per product
  const activeAlertsPerProduct = {};
  existingAlerts.filter(a => a.status !== 'RESOLVED').forEach(a => {
    activeAlertsPerProduct[a.productId] = (activeAlertsPerProduct[a.productId] || 0) + 1;
  });
  
  // Generate new alerts
  products.forEach(product => {
    const key = product.productId;
    
    // Skip if there's already an active alert for this product
    if (activeAlertsPerProduct[key]) return;
    
    if (product.currentStock <= 0) {
      // CRITICAL: Out of stock
      const alertId = generateId();
      const row = [
        alertId,
        product.productId,
        'CRITICAL',
        `${product.productName} is out of stock. Current stock: ${product.currentStock}`,
        'CRITICAL',
        formatDate(new Date()),
        'ACTIVE'
      ];
      sheet.appendRow(row);
    } else if (product.currentStock <= product.minimumStock * 0.25) {
      // CRITICAL: Very low
      const alertId = generateId();
      const row = [
        alertId,
        product.productId,
        'CRITICAL',
        `${product.productName} stock critically low: ${product.currentStock} (min: ${product.minimumStock})`,
        'CRITICAL',
        formatDate(new Date()),
        'ACTIVE'
      ];
      sheet.appendRow(row);
    } else if (product.currentStock <= product.minimumStock) {
      // HIGH
      const alertId = generateId();
      const row = [
        alertId,
        product.productId,
        'HIGH',
        `${product.productName} is below minimum stock: ${product.currentStock} (min: ${product.minimumStock})`,
        'HIGH',
        formatDate(new Date()),
        'ACTIVE'
      ];
      sheet.appendRow(row);
    } else if (product.currentStock <= product.minimumStock * 1.5) {
      // MEDIUM
      const alertId = generateId();
      const row = [
        alertId,
        product.productId,
        'MEDIUM',
        `${product.productName} stock below threshold: ${product.currentStock} (min: ${product.minimumStock})`,
        'MEDIUM',
        formatDate(new Date()),
        'ACTIVE'
      ];
      sheet.appendRow(row);
    }
  });
  
  // Return new alerts
  const allAlerts = getAlertsData().filter(a => a.status !== 'RESOLVED');
  return allAlerts;
}

function getAlerts() {
  try {
    const alerts = getAlertsData().filter(a => a.status !== 'RESOLVED');
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: alerts
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error getting alerts: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

function resolveAlert(data) {
  try {
    const { alertId } = data;
    
    const sheet = SS.getSheetByName(ALERTS_SHEET);
    const rowIndex = sheet.getRange('A:A').getValues()
      .find((r, i) => r[0] === alertId && i > 0) + 1;
    
    if (!rowIndex) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Alert not found'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    sheet.getRange(rowIndex, 7).setValue('RESOLVED'); // status column
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: { alertId },
        message: 'Alert resolved successfully'
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error resolving alert: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

// ---------------------------------------------------------------------------
// Demand Prediction
// ---------------------------------------------------------------------------

function getPredictions() {
  try {
    const products = getProductsData();
    const salesData = getSalesData();
    
    // Group sales by product
    const salesByProduct = {};
    products.forEach(p => salesByProduct[p.productId] = []);
    
    salesData.forEach(s => {
      if (salesByProduct[s.productId]) {
        salesByProduct[s.productId].push(s);
      }
    });
    
    const predictions = products.map(product => {
      const productSales = salesByProduct[product.productId] || [];
      const totalUnitsSold = productSales.reduce((sum, s) => sum + s.quantity, 0);
      const firstSale = productSales.length > 0 
        ? new Date(productSales.sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate))[0].saleDate)
        : null;
      const lastSale = productSales.length > 0
        ? new Date(productSales.sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate))[productSales.length - 1].saleDate)
        : null;
      
      // Calculate average daily demand
      let averageDailyDemand = 0;
      let daysSinceFirstSale = 0;
      
      if (productSales.length > 0 && firstSale && lastSale) {
        daysSinceFirstSale = (lastSale - firstSale) / (1000 * 60 * 60 * 24) + 1;
        if (daysSinceFirstSale > 0) {
          averageDailyDemand = totalUnitsSold / daysSinceFirstSale;
        }
      }
      
      // Days until stockout
      let daysUntilStockout = 0;
      let demandStatus = '';
      
      if (averageDailyDemand > 0) {
        daysUntilStockout = product.currentStock / averageDailyDemand;
        if (daysUntilStockout <= 1) {
          demandStatus = 'CRITICAL';
        } else if (daysUntilStockout <= 3) {
          demandStatus = 'HIGH';
        } else if (daysUntilStockout <= 7) {
          demandStatus = 'MEDIUM';
        } else {
          demandStatus = 'SAFE';
        }
      } else {
        demandStatus = 'INSUFFICIENT_HISTORY';
      }
      
      // Predicted demand (e.g., for next 30 days)
      const predictedDemand = averageDailyDemand * 30;
      
      // Safety stock
      const safetyStock = product.minimumStock * 0.5; // 50% of minimum as safety
      
      return {
        productId: product.productId,
        productName: product.productName,
        sku: product.sku,
        totalUnitsSold,
        averageDailyDemand: parseFloat(averageDailyDemand.toFixed(2)),
        predictedDemand: parseFloat(predictedDemand.toFixed(2)),
        daysUntilStockout: parseFloat(daysUntilStockout.toFixed(2)),
        demandStatus,
        safetyStock: parseFloat(safetyStock.toFixed(2)),
        lastSale: lastSale ? formatDate(lastSale) : '',
        firstSale: firstSale ? formatDate(firstSale) : ''
      };
    });
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: predictions
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error getting predictions: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

function getPredictionOverview(products) {
  const predictions = products.map(product => {
    const avgDaily = calculateAverageDailyDemand(product.productId);
    const days = calculateDaysUntilStockout(product.productId);
    const predicted = calculateDemandPrediction(product.productId);
    const safety = calculateSafetyStock(product.productId);
    
    return {
      productId: product.productId,
      productName: product.productName,
      averageDailyDemand: avgDaily,
      predictedDemand: predicted,
      daysUntilStockout: days,
      safetyStock: safety
    };
  });
  
  return predictions;
}

// Helper functions for prediction
function calculateAverageDailyDemand(productId) {
  const salesData = getSalesData().filter(s => s.productId === productId);
  if (salesData.length === 0) return 0;
  
  const totalUnits = salesData.reduce((sum, s) => sum + s.quantity, 0);
  const dates = salesData.map(s => new Date(s.saleDate));
  const sortedDates = dates.sort((a, b) => a - b);
  
  if (sortedDates.length < 2) return totalUnits; // Only one sale, treat as daily
  
  const days = (sortedDates[sortedDates.length - 1] - sortedDates[0]) / (1000 * 60 * 60 * 24);
  if (days <= 0) return totalUnits;
  
  return totalUnits / days;
}

function calculateDaysUntilStockout(productId) {
  const product = getProductsData().find(p => p.productId === productId);
  if (!product) return 0;
  
  const avgDaily = calculateAverageDailyDemand(productId);
  
  if (avgDaily <= 0) {
    return 0; // Return 0 instead of Infinity/NaN
  }
  
  return product.currentStock / avgDaily;
}

function calculateDemandPrediction(productId) {
  const avgDaily = calculateAverageDailyDemand(productId);
  // Predict for next 30 days
  if (avgDaily <= 0) return 0;
  return Math.round(avgDaily * 30);
}

function calculateSafetyStock(productId) {
  const product = getProductsData().find(p => p.productId === productId);
  if (!product) return 0;
  // Safety stock = 50% of minimum stock * average daily demand concept
  // Simplified: minimum stock * 0.5 as safety buffer
  return product.minimumStock * 0.5;
}

// ---------------------------------------------------------------------------
// Reorder Suggestions
// ---------------------------------------------------------------------------

function getReorderSuggestions() {
  try {
    const products = getProductsData();
    const suggestions = products.map(product => {
      const avgDaily = calculateAverageDailyDemand(product.productId);
      const predicted = calculateDemandPrediction(product.productId);
      const safety = calculateSafetyStock(product.productId);
      
      // Reorder formula: targetStock = predictedDemand + safetyStock
      const targetStock = predicted + safety;
      const reorderQuantity = targetStock - product.currentStock;
      
      let priority = 'LOW';
      let recommendedAction = 'No action required';
      let stockoutRisk = 'SAFE';
      let estimatedStockout = '';
      
      const daysUntilStockout = calculateDaysUntilStockout(product.productId);
      
      if (daysUntilStockout <= 1) {
        priority = 'CRITICAL';
        stockoutRisk = 'CRITICAL';
        estimatedStockout = 'Within 1 day';
        recommendedAction = 'Reorder Now';
      } else if (daysUntilStockout <= 3) {
        priority = 'HIGH';
        stockoutRisk = 'HIGH';
        estimatedStockout = `${daysUntilStockout.toFixed(1)} days`;
        recommendedAction = 'Reorder Urgently';
      } else if (daysUntilStockout <= 7) {
        priority = 'MEDIUM';
        stockoutRisk = 'MEDIUM';
        estimatedStockout = `${daysUntilStockout.toFixed(1)} days`;
        recommendedAction = 'Consider reordering';
      } else {
        priority = 'LOW';
        stockoutRisk = 'SAFE';
        estimatedStockout = 'More than 7 days';
        recommendedAction = 'Monitor';
      }
      
      // Only show reorder if quantity > 0
      const finalReorderQuantity = reorderQuantity > 0 ? Math.ceil(reorderQuantity) : 0;
      
      return {
        productId: product.productId,
        productName: product.productName,
        sku: product.sku,
        currentStock: product.currentStock,
        averageDailyDemand: parseFloat(avgDaily.toFixed(2)),
        predictedDemand: parseFloat(predicted.toFixed(2)),
        safetyStock: parseFloat(safety.toFixed(2)),
        targetStock: Math.ceil(targetStock),
        reorderQuantity: finalReorderQuantity,
        priority,
        stockoutRisk,
        estimatedStockout,
        recommendedAction
      };
    });
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: suggestions
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error getting reorder suggestions: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

function getReorderSuggestionsData() {
  return getReorderSuggestions();
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function getAllSettings() {
  const sheet = SS.getSheetByName(SETTINGS_SHEET);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  return data
    .filter(row => row[0])
    .map(row => ({ setting: row[0], value: row[1] }));
}

function getSettingsOutput() {
  try {
    const settings = getAllSettings();
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: settings
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error getting settings: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

function getSetting(settingName) {
  const settings = getAllSettings();
  const s = settings.find(s => s.setting === settingName);
  return s ? s.value : null;
}

function updateSetting(data) {
  try {
    const { setting, value } = data;
    
    if (!setting) {
      return ContentService
        .createOutput(JSON.stringify({
          success: false,
          data: null,
          message: 'Setting name is required'
        }))
        .setMimeType(ContentService.MIME_TYPE_JSON);
    }
    
    const sheet = SS.getSheetByName(SETTINGS_SHEET);
    const rowIndex = sheet.getRange('A:A').getValues()
      .find((r, i) => r[0] === setting && i > 0) + 1;
    
    if (!rowIndex) {
      // Add new setting
      sheet.appendRow([setting, value]);
    } else {
      // Update existing
      sheet.getRange(rowIndex, 2).setValue(value);
    }
    
    return ContentService
      .createOutput(JSON.stringify({
        success: true,
        data: { setting, value },
        message: 'Setting updated successfully'
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  } catch (e) {
    return ContentService
      .createOutput(JSON.stringify({
        success: false,
        data: null,
        message: 'Error updating setting: ' + e.message
      }))
      .setMimeType(ContentService.MIME_TYPE_JSON);
  }
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function generateId() {
  return 'P' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function formatDate(date) {
  if (!(date instanceof Date)) return date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// End of script