# Inventory Management System - Setup Guide

## Overview
This is a complete Inventory Management System built with:
- **Frontend**: React.js
- **Backend**: Google Apps Script
- **Database**: Google Sheets

## Prerequisites
- Google Account
- Node.js (for React development)
- Code editor (VS Code recommended)

## Setup Instructions

### 1. Google Apps Script Deployment

#### Step 1: Create the Apps Script Project
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Delete the default `Code.gs` and replace it with the content from `/inventory-system/scripts/Code.gs`
4. Click the floppy disk icon to save (Cmd+S / Ctrl+S)

#### Step 2: Set Up Google Sheets Database
1. In the Apps Script project, go to "File" > "New" > "Spreadsheet"
2. This will create a new Google Sheets file linked to your script
3. The script will automatically initialize sheets and headers on first access

#### Step 3: Deploy as Web App
1. In Apps Script, click "Deploy" > "New deployment"
2. Select "Web app" as the deployment type
3. Configure settings:
   - **Execute as**: Me (your account)
   - **Who has access**: Anyone (or your organization)
4. Click "Deploy"
5. Copy the generated URL - this is your `REACT_APP_API_BASE_URL`

#### Step 4: Update API Configuration
1. In your React app, update `/inventory-system/src/api.js`
2. Set `REACT_APP_API_BASE_URL` to your deployed Apps Script URL:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://YOUR_URL.exec';
   ```
   Or replace the entire line with your specific URL.

### 2. React Frontend Setup

#### Option A: Using Create React App
```bash
cd /path/to/inventory-system
npm install
npm start
```

#### Option B: Using Vite
```bash
cd /path/to/inventory-system
npm install
npm run dev
```

#### Environment Variables
Create a `.env` file in the project root:
```
REACT_APP_API_BASE_URL=https://your-apps-script-url.exec
```

### 3. Google Sheets Structure
The script automatically creates these sheets on first run:

**Products Sheet Columns:**
- productId (string)
- productName (string)
- sku (string) - must be unique
- category (string)
- supplier (string)
- currentStock (number)
- minimumStock (number)
- maximumStock (number)
- unitPrice (number)
- lastRestocked (date)
- createdAt (date)
- updatedAt (date)

**Sales Sheet Columns:**
- saleId (string)
- productId (string)
- quantity (number)
- saleDate (date)
- unitPrice (number)
- totalAmount (number)

**StockMovements Sheet Columns:**
- movementId (string)
- productId (string)
- type (string: SALE, RESTOCK, ADJUSTMENT, RETURN)
- quantity (number)
- date (date)
- reason (string)

**Alerts Sheet Columns:**
- alertId (string)
- productId (string)
- alertType (string)
- message (string)
- severity (string: CRITICAL, HIGH, MEDIUM, SAFE)
- createdAt (date)
- status (string: ACTIVE, RESOLVED)

**Settings Sheet Columns:**
- setting (string)
- value (string)

### 4. First Run Initialization
On first access, the Apps Script will:
1. Create all necessary sheets if they don't exist
2. Set up column headers
3. Initialize default settings (safetyStockMultiplier, predictionDays, lowStockThreshold, restockLeadTime)
4. Generate initial alerts based on current inventory

### 4. Testing the System

#### Test Flow
1. Start the React app: `npm start`
2. Navigate to `http://localhost:3000`
3. The dashboard should load with statistics from Google Sheets
4. Test navigation: Dashboard → Products → Alerts → Predictions → Reorders → Settings

#### Test Scenarios
- **Add Product**: Fill the form with valid data and submit
- **Edit Product**: Edit an existing product and update
- **Delete Product**: Remove a product (confirmed with dialog)
- **Record Sale**: Enter sale data, stock should decrease and movement recorded
- **Restock Product**: Increase stock, movement recorded
- **Low Stock Detection**: Products with stock ≤ minimum should trigger alerts
- **Demand Prediction**: Products with sales history should show predictions
- **Reorder Suggestions**: Products below threshold should show reorder recommendations

#### Edge Cases Tested
- Product with 0 stock → CRITICAL alert
- Product with 1 stock → LOW stock alert
- Product with no sales → "Insufficient demand history"
- Duplicate SKU → Validation error
- Negative stock → Prevented
- Negative price → Prevented

### 5. Configuration Instructions

#### API Base URL
The Google Apps Script Web App URL should be stored in:
- `.env` file: `REACT_APP_API_BASE_URL=https://example.exec`
- Or directly in `src/api.js`

#### Google Sheets Location
The script uses the active spreadsheet. Make sure:
- The Apps Script project is bound to the correct Google Sheets file
- Share the Sheets file with the Apps Script account if using different accounts

#### System Settings (automatically set)
- `safetyStockMultiplier`: 1.5
- `predictionDays`: 30
- `lowStockThreshold`: 80 (percentage)
- `restockLeadTime`: 7 (days)

### 6. Deployment Best Practices

#### Security
- Restrict Apps Script access to your organization
- Don't expose the API URL in public repositories
- Validate all input on the backend (already implemented)

#### Performance
- The script caches frequently accessed data
- Avoid unnecessary repeated sheet reads
- React components should re-fetch data only when needed

#### Maintenance
- Regularly check Google Apps Script execution logs
- Monitor Google Sheets storage usage
- Update default settings as business needs change

### 7. Common Issues

#### "Cannot find function" errors
- Ensure the Apps Script project has been saved after pasting the code
- Check that all function names match between frontend and backend

#### CORS errors
- The Google Apps Script Web App should have proper CORS headers (included by default)
- Make sure the frontend URL is whitelisted if using organization-wide deployment

#### "Cannot read property of undefined"
- Ensure Google Sheets has been initialized (first run adds sheets)
- Check that the spreadsheet is properly bound to the Apps Script project

#### React app won't start
- Run `npm install` to install dependencies
- Check that `.env` file doesn't have syntax errors
- Verify `REACT_APP_API_BASE_URL` is correctly set

## Project Structure
```
/inventory-system/
├── scripts/              # Google Apps Script
│   └── Code.gs           # Backend logic
├── src/                  # React frontend
│   ├── api.js            # API service layer
│   ├── main.jsx          # App entry point
│   ├── pages/            # Page components
│   ├── components/       # UI components
│   ├── routes.jsx        # React routing
│   ├── App.css         # Global styles
│   └── ...
├── docs/                 # Documentation
│   └── SETUP_GUIDE.md    # This guide
└── package.json          # Dependencies
```

## Need Help?
- Check Google Apps Script execution logs for backend errors
- Use browser DevTools → Network tab for API errors
- Verify Google Sheets has the correct structure
- Ensure REACT_APP_API_BASE_URL matches your deployed URL