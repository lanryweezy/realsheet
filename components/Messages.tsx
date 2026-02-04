import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-nexus-accent`} />
      {message && (
        <p className="mt-2 text-sm text-slate-400">{message}</p>
      )}
    </div>
  );
};

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-lg bg-slate-900/50 border border-slate-700 ${className}`}>
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <p className="text-slate-300 text-center mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

interface SuccessMessageProps {
  message: string;
  className?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  message, 
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg bg-green-900/30 border border-green-800 ${className}`}>
      <CheckCircle className="w-5 h-5 text-green-500" />
      <span className="text-green-300">{message}</span>
    </div>
  );
};

interface InfoMessageProps {
  message: string;
  className?: string;
}

export const InfoMessage: React.FC<InfoMessageProps> = ({ 
  message, 
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg bg-blue-900/30 border border-blue-800 ${className}`}>
      <Info className="w-5 h-5 text-blue-500" />
      <span className="text-blue-300">{message}</span>
    </div>
  );
};