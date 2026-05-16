import React from 'react';
import { Check, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onDismiss: (id: string) => void;
}

const EnhancedToast: React.FC<ToastProps> = ({ id, type, title, message, onDismiss }) => {
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
    <div 
      className={`
        pointer-events-auto flex items-start gap-3 p-4 rounded-xl 
        border shadow-2xl backdrop-blur-md 
        bg-gradient-to-br animate-fade-in-up
        ${bgColors[type]}
      `}
    >
      <div className="mt-0.5 animate-scale-in">{icons[type]}</div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-white animate-fade-in">{title}</h4>
        {message && (
          <p className="text-xs text-slate-300 mt-1 animate-fade-in-up">{message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-slate-400 hover:text-white transition-colors hover:bg-white/10 rounded-lg p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default EnhancedToast;
