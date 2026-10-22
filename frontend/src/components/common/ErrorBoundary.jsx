import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught client error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-12">
          <div className="card text-center max-w-lg mx-auto p-8">
            <div className="inline-flex p-4 rounded-full bg-error-subtle mb-4">
              <AlertTriangle size={32} className="text-error" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted mb-6">
              An unexpected error occurred in the application view. Your data is safe.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <RotateCcw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
