import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../stores/useNotificationStore';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-rose-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
};

const bgColors = {
  success: 'bg-emerald-50 border-emerald-100',
  error: 'bg-rose-50 border-rose-100',
  info: 'bg-blue-50 border-blue-100',
  warning: 'bg-amber-50 border-amber-100',
};

export const Toaster: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-lg ${bgColors[n.type]} flex gap-3 items-start relative overflow-hidden group`}
          >
            <div className="shrink-0 mt-0.5">{icons[n.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-neutral-900 tracking-tight leading-none">
                {n.message}
              </p>
              {n.description && (
                <p className="text-xs font-bold text-neutral-500 mt-1.5 leading-relaxed">
                  {n.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-0.5 bg-black/5"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
