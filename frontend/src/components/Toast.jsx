import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const Toast = () => {
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  useEffect(() => {
    const handleShowToast = (e) => {
      const { message, type = 'error' } = e.detail;
      setToast({ message, type, visible: true });
      
      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3500);
    };

    window.addEventListener('showToast', handleShowToast);
    return () => window.removeEventListener('showToast', handleShowToast);
  }, []);

  if (!toast.visible) return null;

  const isError = toast.type === 'error';

  return (
    <div className={`toast-notification ${isError ? 'toast-error' : 'toast-success'}`}>
      <div className="toast-icon">
        {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
      </div>
      <div className="toast-message">{toast.message}</div>
    </div>
  );
};

export const showToast = (message, type = 'error') => {
  window.dispatchEvent(new CustomEvent('showToast', { detail: { message, type } }));
};

export default Toast;
