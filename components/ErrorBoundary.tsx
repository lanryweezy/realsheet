import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Log to error service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Send to logging service
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
      console.error('Production Error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // Optional: Reload the page or specific component
    // window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-slate-400 mb-6">
              The application encountered an unexpected error.
            </p>
            <div className="bg-slate-950 rounded-lg p-4 mb-6 text-left border border-slate-800 overflow-auto max-h-32">
                <code className="text-xs font-mono text-red-400">
                    {this.state.error?.message || "Unknown Error"}
                </code>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2.5 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
              >
                <RefreshCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Component-specific error boundaries
export const GridErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary 
      onError={(error, info) => console.error('Grid Error:', error, info)}
      fallback={
        <div className="flex items-center justify-center h-full bg-slate-900 rounded-lg border border-slate-700">
          <div className="text-center p-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Grid Error</h3>
            <p className="text-slate-400 mb-4">Failed to load spreadsheet data</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export const ModalErrorBoundary: React.FC<{ children: ReactNode; title: string }> = ({ children, title }) => {
  return (
    <ErrorBoundary 
      onError={(error, info) => console.error(`${title} Error:`, error, info)}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;