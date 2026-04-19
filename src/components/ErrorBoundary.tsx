import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    try {
      const parsedError = JSON.parse(error.message);
      this.setState({ errorInfo: parsedError.error });
    } catch {
      this.setState({ errorInfo: error.message });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <div className="glass-card p-8 rounded-3xl max-w-md text-center">
            <h1 className="text-2xl font-display mb-4 text-red-600">Something went wrong</h1>
            <p className="text-sm text-muted mb-6">
              {this.state.errorInfo || "An unexpected error occurred."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

