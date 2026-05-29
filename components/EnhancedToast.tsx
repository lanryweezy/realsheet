import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info, AlertTriangle, RotateCcw } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  onUndo?: () => void;
}

interface EnhancedToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const EnhancedToast = React.forwardRef<HTMLDivElement, EnhancedToastProps>(({ toast, onDismiss }, ref) => {
  const { id, type, title, message, onUndo } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, interval);

    const autoDismiss = setTimeout(() => {
       onDismiss(id);
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(autoDismiss);
    };
  }, [id, onDismiss]);

  const icons = {
    success: <Check className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const bgColors = {
    success: 'from-green-900/90 to-green-800/90 border-green-500/20',
    error: 'from-red-900/90 to-red-800/90 border-red-500/20',
    warning: 'from-amber-900/90 to-amber-800/90 border-amber-500/20',
    info: 'from-blue-900/90 to-blue-800/90 border-blue-500/20'
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`
        pointer-events-auto flex flex-col rounded-xl
        border shadow-2xl backdrop-blur-md 
        bg-gradient-to-br overflow-hidden
        ${bgColors[type]}
      `}
    >
      <div className="flex items-start gap-3 p-4">
      <div className="mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        {message && (
          <p className="text-xs text-slate-300 mt-1">{message}</p>
        )}
        {onUndo && (
          <button
            onClick={() => { onUndo(); onDismiss(id); }}
            className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold text-white uppercase tracking-wider transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            Undo Action
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-white/40 hover:text-white transition-colors hover:bg-white/10 rounded-lg p-1"
      >
        <X className="w-4 h-4" />
      </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-black/10">
        <motion.div
          className="h-full bg-white/20"
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "linear" }}
        />
      </div>
    </motion.div>
  );
});

export default EnhancedToast;
