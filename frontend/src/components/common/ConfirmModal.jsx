import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, danger = false }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative glass rounded-xl p-6 w-full max-w-md z-10"
          >
            <h3 className="text-lg font-semibold text-[#F9FAFB] mb-2">{title}</h3>
            <p className="text-[#9CA3AF] text-sm mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#2D3748] transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  danger
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-[#6C63FF]/10 text-[#6C63FF] hover:bg-[#6C63FF]/20'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
