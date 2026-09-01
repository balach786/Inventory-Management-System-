import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({
  showToast: (message, type, duration) => {},
  dismissToast: (id) => {}
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    return id;
  }, [dismissToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="toast-icon text-emerald-400" size={20} />;
      case 'error':
        return <AlertCircle className="toast-icon text-rose-400" size={20} />;
      case 'warning':
        return <AlertTriangle className="toast-icon text-amber-400" size={20} />;
      default:
        return <Info className="toast-icon text-blue-400" size={20} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type} animate-slide-in`}>
            <div className="toast-content">
              {getIcon(t.type)}
              <span className="toast-message">{t.message}</span>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="toast-close"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;