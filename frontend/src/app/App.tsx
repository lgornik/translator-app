import { AppRouter } from './Router';
import { ErrorBoundary } from '@/shared/components/feedback';

/**
 * Main application component
 * Wrapped in ErrorBoundary for graceful error handling
 */
export function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // In production, you would send this to an error tracking service
        console.error('Application error:', error, errorInfo);
      }}
    >
      <AppRouter />
    </ErrorBoundary>
  );
}
