import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback component */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show reset button */
  showReset?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for graceful error handling
 * Catches JavaScript errors anywhere in the child component tree
 * 
 * @example
 * <ErrorBoundary onError={(error) => logError(error)}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div 
          className="error-boundary"
          role="alert"
          aria-live="assertive"
        >
          <div className="error-boundary__content">
            <h2 className="error-boundary__title">
              Ups! CoÅ› poszÅ‚o nie tak
            </h2>
            <p className="error-boundary__message">
              Przepraszamy, wystÄ…piÅ‚ nieoczekiwany bÅ‚Ä…d. 
              SprÃ³buj odÅ›wieÅ¼yÄ‡ stronÄ™ lub skontaktuj siÄ™ z pomocÄ… technicznÄ….
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary__details">
                <summary>SzczegÃ³Å‚y bÅ‚Ä™du (tylko w trybie deweloperskim)</summary>
                <pre>{this.state.error.message}</pre>
                <pre>{this.state.error.stack}</pre>
              </details>
            )}
            {this.props.showReset !== false && (
              <div className="error-boundary__actions">
                <Button 
                  variant="primary" 
                  onClick={this.handleReset}
                  aria-label="SprÃ³buj ponownie"
                >
                  SprÃ³buj ponownie
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => window.location.reload()}
                  aria-label="OdÅ›wieÅ¼ stronÄ™"
                >
                  OdÅ›wieÅ¼ stronÄ™
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}
