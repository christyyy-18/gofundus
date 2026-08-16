import React, { createContext, useState, useContext } from 'react';
import './Toast.css';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container" role="alert" aria-live="assertive">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}> {t.message} </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
