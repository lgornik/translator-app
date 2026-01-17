import { ApolloClient, InMemoryCache, ApolloProvider as BaseApolloProvider, HttpLink } from '@apollo/client';
import { ReactNode } from 'react';
import { API_CONFIG } from '@/shared/constants';

/**
 * Apollo Client instance
 */
const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: API_CONFIG.GRAPHQL_URL,
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
  devtools: {
    enabled: import.meta.env.DEV,
  },
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