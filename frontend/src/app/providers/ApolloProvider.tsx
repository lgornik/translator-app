import { ApolloClient, InMemoryCache, ApolloProvider as BaseApolloProvider } from '@apollo/client';
import { ReactNode } from 'react';
import { API_CONFIG } from '@/shared/constants';

/**
 * Apollo Client instance
 */
const apolloClient = new ApolloClient({
  uri: API_CONFIG.GRAPHQL_URL,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
  connectToDevTools: import.meta.env.DEV,
});

interface ApolloProviderProps {
  children: ReactNode;
}

/**
 * Apollo Provider wrapper
 */
export function ApolloProvider({ children }: ApolloProviderProps) {
  return (
    <BaseApolloProvider client={apolloClient}>
      {children as React.ReactNode}
    </BaseApolloProvider>
  );
}
