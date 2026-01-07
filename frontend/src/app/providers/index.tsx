import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from './ApolloProvider';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Combines all application providers
 * Add new providers here in the correct nesting order
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrowserRouter>
      <ApolloProvider>
        {/* Add more providers here as needed:
          - AuthProvider
          - ThemeProvider
          - ToastProvider
          - etc.
        */}
        {children}
      </ApolloProvider>
    </BrowserRouter>
  );
}
