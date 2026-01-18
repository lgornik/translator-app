// ApolloProvider.tsx
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider as BaseApolloProvider,
  HttpLink,
} from "@apollo/client";
import { ReactNode } from "react";
import { API_CONFIG } from "@/shared/constants";

// Generuj lub pobierz Session ID
const getSessionId = (): string => {
  const key = "translator_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `sess_${crypto.randomUUID()}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: API_CONFIG.GRAPHQL_URL,
    headers: {
      "X-Session-Id": getSessionId(),
    },
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "network-only" },
    query: { fetchPolicy: "network-only" },
  },
  devtools: {
    enabled: import.meta.env.DEV,
  },
});

interface ApolloProviderProps {
  children: ReactNode;
}

export function ApolloProvider({ children }: ApolloProviderProps) {
  return (
    <BaseApolloProvider client={apolloClient}>
      {children as React.ReactNode}
    </BaseApolloProvider>
  );
}
