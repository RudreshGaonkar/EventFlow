import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-400" />,
  error:   <XCircle    size={16} className="text-red-400"     />,
  warning: <AlertCircle size={16} className="text-amber-400"  />,
  info:    <Info        size={16} className="text-blue-400"   />,
};

const BORDERS = {
  success: 'border-emerald-500/30',
  error:   'border-red-500/30',
  warning: 'border-amber-500/30',
  info:    'border-blue-500/30',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const dismiss = (id) => setToasts(t => t.filter(toast => toast.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3
                bg-surface-container border ${BORDERS[toast.type]}
                rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-xl
                min-w-[260px] max-w-[360px]`}
            >
              <span className="mt-0.5 shrink-0">{ICONS[toast.type]}</span>
              <p className="text-sm text-on-surface flex-1 leading-snug">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
