import { queryResolvers } from './queries.js';
import { mutationResolvers } from './mutations.js';

/**
 * Combined GraphQL resolvers
 */
export const resolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
};

export type { GraphQLContext } from './queries.js';
