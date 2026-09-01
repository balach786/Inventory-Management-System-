# Google Apps Script Backend Setup Guide

This guide walks you through setting up and deploying the **Google Apps Script & Google Sheets Backend** for the Inventory Management System.

---

## 1. Create a New Google Spreadsheet

1. Go to [Google Sheets](https://sheets.new) in your web browser.
2. Rename the spreadsheet to **"Enterprise Inventory Management Database"** (or your preferred name).

---

## 2. Open the Apps Script Editor

1. In the top menu of your Google Sheet, click **Extensions > Apps Script**.
2. A new tab will open with the Apps Script code editor.
3. Rename the project to **"Inventory API Backend"**.

---

## 3. Add the Backend Code

1. In the Apps Script editor, open the default `Code.gs` file.
2. Delete any placeholder code in `Code.gs`.
3. Open the file [`scripts/Code.gs`](file:///c:/Users/BK%20Magsi/Downloads/Inventory%20Management%20System/inventory-system/scripts/Code.gs) in this repository.
4. Copy the entire contents of `scripts/Code.gs` and paste it into the Apps Script editor.
5. Click the **Save** icon (diskette) or press `Ctrl + S`.

---

## 4. Deploy as a Web App

1. In the top right of the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the deployment settings:
   - **Description**: `v2.1 Inventory API Production`
   - **Execute as**: `Me (your_email@gmail.com)`
   - **Who has access**: `Anyone` *(Crucial: Allows the React web app to communicate with the API without OAuth popups)*
4. Click **Deploy**.
5. When prompted, click **Authorize access**, choose your Google account, click **Advanced**, and then click **Go to Inventory API Backend (unsafe)** to grant spreadsheet permissions.
6. Copy the **Web App URL** generated (it will look like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 5. Connect Frontend to Google Apps Script

You can connect the frontend to your live Google Apps Script Web App in two ways:

### Option A: Via the Settings UI (Instant)
1. Start your local application (`npm run dev`).
2. Navigate to **Settings & GAS API** in the sidebar.
3. Paste your Web App URL into the **Google Apps Script Web App URL** input field.
4. Click **Test Connection** to verify live communication.
5. Click **Save Web App URL**.

### Option B: Via `.env` File
1. Open the [`.env`](file:///c:/Users/BK%20Magsi/Downloads/Inventory%20Management%20System/inventory-system/.env) file at the root of the project.
2. Add your Web App URL:
   ```env
   REACT_APP_API_BASE_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/
   ```
3. Restart the dev server (`npm run dev`).

---

## 6. Automatic Database Initialization

When the Web App receives its first request, `scripts/Code.gs` will automatically create and configure the following 5 sheets with proper headers:

| Sheet Name | Purpose |
| :--- | :--- |
| **`Products`** | SKU catalog, inventory levels, unit prices, supplier names |
| **`Sales`** | Customer sales transaction log and revenues |
| **`StockMovements`** | Audit ledger for sales, restocks, and adjustments |
| **`Alerts`** | Low stock and critical stockout trigger history |
| **`Settings`** | Safety stock multipliers and lead times |

---

## 7. Supported API Actions

### GET Endpoints (`?action=...`)
- `getDashboard`: Aggregated metrics, inventory value, alerts, and recent movements
- `getProducts`: Complete product catalog
- `getProduct&id=...`: Retrieve specific product
- `getAlerts`: Active and resolved low stock alerts
- `getPredictions`: 30-day moving average demand forecasts and stockout predictions
- `getReorderSuggestions`: Automated purchase order queue
- `getStockMovements`: Complete stock movement transaction log
- `getSettings`: Configuration settings and multipliers

### POST Endpoints (JSON Body: `{ action: "...", data: { ... } }`)
- `addProduct`: Create new product
- `updateProduct`: Edit product details
- `deleteProduct`: Remove product
- `addSale`: Record customer sale (automatically updates product stock and logs movement)
- `restockProduct`: Record supplier restock (automatically increments stock and logs movement)
- `updateStock`: Manual stock quantity adjustment
- `resolveAlert`: Mark low stock alert as resolved
- `updateSetting`: Update forecasting parameters
