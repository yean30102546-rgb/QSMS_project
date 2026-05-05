import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches React component errors and displays fallback UI
 * Prevents entire app crash from a single component error
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details (in production, send to error tracking service)
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);

    // Call optional error handler prop
    this.props.onError?.(error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Send to error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <DefaultErrorFallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onReset={this.handleReset}
          />
        )
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  onReset,
}: DefaultErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-red-50">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-red-200 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-500" size={24} />
          <h1 className="text-2xl font-bold text-red-700">Oops! Something went wrong</h1>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 p-3 bg-gray-100 rounded-lg">
            <summary className="cursor-pointer font-mono text-xs text-gray-700 font-semibold mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="font-mono text-xs text-red-600 overflow-auto max-h-40">
              {error.toString()}
              {errorInfo?.componentStack && `\n\n${errorInfo.componentStack}`}
            </pre>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
