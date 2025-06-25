import React, { useState, useEffect } from 'react';
import { AlertCircle, X, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export const ErrorToast = ({ error, onDismiss, onRetry }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      // Auto-dismiss after 8 seconds for non-critical errors
      if (!error.includes('Authentication') && !error.includes('connection')) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, 8000);
        return () => clearTimeout(timer);
      }
    }
  }, [error]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300); // Wait for animation to complete
  };

  const getErrorIcon = () => {
    if (error?.includes('connect') || error?.includes('NetworkError')) {
      return <WifiOff className="w-5 h-5" />;
    } else if (error?.includes('timeout')) {
      return <RefreshCw className="w-5 h-5" />;
    }
    return <AlertCircle className="w-5 h-5" />;
  };

  const getErrorType = () => {
    if (error?.includes('Authentication')) return 'error';
    if (error?.includes('connect') || error?.includes('NetworkError')) return 'warning';
    if (error?.includes('Server error')) return 'error';
    return 'info';
  };

  const getBackgroundColor = () => {
    const type = getErrorType();
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    const type = getErrorType();
    switch (type) {
      case 'error': return 'text-red-800';
      case 'warning': return 'text-yellow-800';
      default: return 'text-blue-800';
    }
  };

  if (!error) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className={`max-w-md p-4 rounded-lg border shadow-lg ${getBackgroundColor()}`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${getTextColor()}`}>
            {getErrorIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {error}
            </p>
            
            {onRetry && (
              <button
                onClick={onRetry}
                className={`mt-2 text-xs px-3 py-1 rounded border transition-colors ${
                  getErrorType() === 'error' 
                    ? 'border-red-300 text-red-700 hover:bg-red-100'
                    : getErrorType() === 'warning'
                    ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                    : 'border-blue-300 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <RefreshCw className="w-3 h-3 inline mr-1" />
                Retry
              </button>
            )}
          </div>
          
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 p-1 rounded transition-colors ${
              getErrorType() === 'error'
                ? 'text-red-600 hover:bg-red-100'
                : getErrorType() === 'warning'
                ? 'text-yellow-600 hover:bg-yellow-100'
                : 'text-blue-600 hover:bg-blue-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorToast;