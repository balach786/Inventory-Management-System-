/**
 * Inventory Management System - Application Routes
 */
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Alerts from './pages/Alerts';
import Predictions from './pages/Predictions';
import Reorders from './pages/Reorders';
import Movements from './pages/Movements';
import Settings from './pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'products', element: <Products /> },
      { path: 'alerts', element: <Alerts /> },
      { path: 'predictions', element: <Predictions /> },
      { path: 'reorders', element: <Reorders /> },
      { path: 'movements', element: <Movements /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);

export default router;