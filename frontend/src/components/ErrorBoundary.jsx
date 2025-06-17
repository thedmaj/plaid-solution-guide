import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary caught error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
          <div className="text-red-700 font-semibold mb-2">
            {this.props.fallback || 'Something went wrong rendering this component.'}
          </div>
          {isDevelopment && this.state.error && (
            <details className="text-sm text-red-600">
              <summary className="cursor-pointer">Error Details (Development)</summary>
              <div className="mt-2 font-mono text-xs">
                <div><strong>Error:</strong> {this.state.error.message}</div>
                {this.state.error.stack && (
                  <div className="mt-1">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }
    
    return this.props.children;
  }
} 