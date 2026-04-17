import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

export default function AdminModal({ open, title, onClose, onSave, saving, children, wide }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className={`relative bg-surface-container border border-outline-variant/20
              rounded-3xl shadow-2xl w-full ${wide ? 'max-w-lg' : 'max-w-sm'}
              max-h-[90vh] overflow-y-auto`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
              <h3 className="font-headline font-bold text-on-surface text-base">{title}</h3>
              <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">{children}</div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-outline-variant/10">
              <button onClick={onClose}
                className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant
                  bg-surface-container-high rounded-xl hover:text-on-surface transition-all">
                Cancel
              </button>
              <button onClick={onSave} disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-on-primary-container
                  bg-primary-container rounded-xl hover:opacity-90 transition-all
                  disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
