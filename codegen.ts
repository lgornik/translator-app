import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './backend/src/infrastructure/graphql/schema.ts',
  documents: ['frontend/src/**/*.ts', 'frontend/src/**/*.tsx'],
  generates: {
    // Generate types for frontend
    './frontend/src/shared/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        // Use shared types where possible
        scalars: {
          ID: 'string',
        },
        // Generate hooks
        withHooks: true,
        withHOC: false,
        withComponent: false,
        // Enum handling - use string unions for better DX
        enumsAsTypes: true,
        // Skip typename for cleaner types
        skipTypename: true,
        // Immutable types
        immutableTypes: true,
        // Better naming
        namingConvention: {
          typeNames: 'change-case-all#pascalCase',
          enumValues: 'keep',
        },
      },
    },
    // Generate introspection for schema validation
    './shared/generated/schema.json': {
      plugins: ['introspection'],
      config: {
        minify: true,
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
