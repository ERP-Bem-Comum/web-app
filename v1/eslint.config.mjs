import { defineConfig, globalIgnores } from 'eslint/config'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'

const eslintConfig = defineConfig([
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react/jsx-no-duplicate-props': 'off',
      'react/display-name': 'off',
      'prettier/prettier': 'off',
      'prefer-const': 'off',
    },
  },
  prettierConfig,
  globalIgnores([
    '.output/**',
    'out/**',
    'build/**',
    'src/services/generated/**',
    'src/types/generated/**',
  ]),
])

export default eslintConfig
