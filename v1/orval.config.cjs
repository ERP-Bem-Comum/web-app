/** @type {import('orval').Config} */
module.exports = {
  coreApi: {
    input: {
      target: './handbook/doc.yaml',
    },
    output: {
      target: './src/services/generated/core-api.ts',
      schemas: './src/types/generated/core-api',
      client: 'react-query',
      httpClient: 'axios',
      mode: 'tags-split',
      prettier: true,
      override: {
        mutator: {
          path: './src/services/generated/mutator.ts',
          name: 'apiMutator',
        },
      },
    },
  },
}
