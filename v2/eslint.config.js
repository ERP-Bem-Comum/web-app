import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import pluginStart from '@tanstack/eslint-plugin-start'
import pluginSecurity from 'eslint-plugin-security'
import noSecrets from 'eslint-plugin-no-secrets'
import boundaries from 'eslint-plugin-boundaries'
import pluginZod from 'eslint-plugin-zod'
import globals from 'globals'

// Camadas da constituição (v1.1.0) → tipos de elemento para o eslint-plugin-boundaries.
// Arquitetura vertical-modular espelhando o core-api (ADR-0006): modules/shared/external
// + public-api por módulo. modo 'folder' (default): o pattern casa a PASTA da camada.
// ORDEM IMPORTA: padrões mais específicos (src/shared/ui) antes dos genéricos (src/shared).
const boundaryElements = [
  { type: 'shared-ui', pattern: 'src/shared/ui' },
  { type: 'shared', pattern: 'src/shared' },
  { type: 'external', pattern: 'src/external' },
  { type: 'domain', pattern: 'src/modules/*/domain', capture: ['feature'] },
  { type: 'application', pattern: 'src/modules/*/application', capture: ['feature'] },
  { type: 'adapters', pattern: 'src/modules/*/adapters', capture: ['feature'] },
  { type: 'ui', pattern: 'src/modules/*/ui', capture: ['feature'] },
  { type: 'public-api', pattern: 'src/modules/*/public-api', capture: ['feature'] },
]

// Matriz de dependências (sintaxe v6: from/allow.to). `{{from.captured.feature}}` força
// isolamento de módulo: um módulo só importa as próprias camadas — cruzar módulos só via
// `public-api` (sem captura de feature = qualquer módulo). Regras `allow` são aditivas;
// o resto é `disallow`.
const boundaryRules = [
  // shared é puro: só importa shared.
  { from: { type: 'shared' }, allow: { to: { type: 'shared' } } },
  // design system: shared + ele mesmo.
  { from: { type: 'shared-ui' }, allow: { to: { type: ['shared', 'shared-ui'] } } },
  // external (adapters de I/O real): shared + external. Nunca importa módulos.
  { from: { type: 'external' }, allow: { to: { type: ['shared', 'external'] } } },
  // domain: shared + domain do MESMO módulo (puro).
  { from: { type: 'domain' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'domain' }, allow: { to: { type: 'domain', captured: { feature: '{{from.captured.feature}}' } } } },
  // application: shared + domain/application do MESMO módulo.
  { from: { type: 'application' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'application' }, allow: { to: { type: ['domain', 'application'], captured: { feature: '{{from.captured.feature}}' } } } },
  // adapters: shared + external + domain/application/adapters do MESMO módulo + public-api de qualquer módulo.
  { from: { type: 'adapters' }, allow: { to: { type: ['shared', 'external', 'public-api'] } } },
  {
    from: { type: 'adapters' },
    allow: { to: { type: ['domain', 'application', 'adapters'], captured: { feature: '{{from.captured.feature}}' } } },
  },
  // ui: shared + design system + todas as camadas do MESMO módulo + public-api de qualquer módulo.
  { from: { type: 'ui' }, allow: { to: { type: ['shared', 'shared-ui', 'public-api'] } } },
  {
    from: { type: 'ui' },
    allow: { to: { type: ['domain', 'application', 'adapters', 'ui'], captured: { feature: '{{from.captured.feature}}' } } },
  },
  // public-api: re-exporta as camadas do PRÓPRIO módulo (+ shared).
  { from: { type: 'public-api' }, allow: { to: { type: 'shared' } } },
  {
    from: { type: 'public-api' },
    allow: { to: { type: ['domain', 'application', 'adapters', 'ui'], captured: { feature: '{{from.captured.feature}}' } } },
  },
]

export default tseslint.config(
  // Não lintar: build, gerados e o submódulo do backend (tem lint próprio).
  {
    ignores: [
      'dist/**',
      '.output/**',
      '.nitro/**',
      '.tanstack/**',
      'node_modules/**',
      'core-api/**',
      'src/routeTree.gen.ts',
    ],
  },

  // Base JS + TypeScript estrito com checagem de tipos (arquiteture.md: strict máximo).
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  // Segurança da informação — preset recomendado (AST-based, aplica a tudo).
  pluginSecurity.configs.recommended,

  // Type-checked precisa do TS Project Service (lê o tsconfig.json).
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },

  // react-hooks v7 — preset em formato legacy, então registramos o plugin como objeto.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs['recommended-latest'].rules,
  },

  // Plugins de ecossistema (TanStack + Zod) — só em TS/TSX.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      pluginQuery.configs['flat/recommended'],
      pluginRouter.configs['flat/recommended'],
      pluginStart.configs['flat/recommended'],
      pluginZod.configs.recommended, // boas práticas Zod 4 (no-any-schema, prefer-meta, z.uuid, etc.)
    ],
  },

  // Regras do projeto: invariantes (arquiteture.md), migração TS 6→7 e segurança fina.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'no-secrets': noSecrets },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // --- Invariantes de tipo (TS handbook + arquiteture.md) ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // --- Migração saudável 6 → 7 (espelha erasableSyntaxOnly) + XSS no JSX ---
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'enum não é apagável (TS native / strip-types). Use union de literais + objeto `as const`.' },
        { selector: 'TSModuleDeclaration[kind="namespace"]', message: 'namespace com runtime não é apagável. Use módulos ESM.' },
        { selector: 'TSParameterProperty', message: 'parameter property não é apagável. Declare o campo explicitamente.' },
        { selector: 'TSImportEquals', message: '`import =` é CommonJS. Use import ESM.' },
        { selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]', message: 'dangerouslySetInnerHTML é vetor de XSS — evite ou sanitize e desabilite por linha.' },
      ],

      // --- Segurança da informação ---
      'no-secrets/no-secrets': ['error', { tolerance: 4.2 }], // entropia: pega token/segredo hardcoded
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-properties': [
        'error',
        { object: 'document', property: 'write', message: 'document.write é vetor de XSS.' },
      ],
      'security/detect-object-injection': 'off', // ruidoso demais (acusa todo obj[key])
    },
  },

  // Arquitetura: matriz de camadas + isolamento de feature (só em src/).
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      // Resolver TS p/ o boundaries enxergar imports .ts/.tsx (e futuros aliases @/).
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/include': ['src/**/*'],
      // Composition root / framework glue — fora da matriz de camadas.
      'boundaries/ignore': ['src/routes/**', 'src/router*', 'src/client*', 'src/ssr*', 'src/start*'],
      'boundaries/elements': boundaryElements,
    },
    rules: {
      'boundaries/dependencies': ['error', { default: 'disallow', rules: boundaryRules }],
    },
  },

  // MVVM (constituição §XI): views/pages são BURRAS. Proibido em *.component.tsx e rotas:
  // data-hooks (useQuery/useMutation), useReducer e import de adapters/server functions.
  // Toda orquestração e estado vive na ViewModel (*.presenter.hook.ts).
  {
    files: ['src/modules/*/ui/**/*.component.tsx', 'src/routes/**/*.tsx'],
    rules: {
      // ⚠ flat config substitui (não mescla) a mesma regra: re-inclui os selectors globais
      // de migração TS 6→7 + XSS além dos selectors específicos de MVVM.
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'enum não é apagável (TS native / strip-types). Use union de literais + objeto `as const`.' },
        { selector: 'TSModuleDeclaration[kind="namespace"]', message: 'namespace com runtime não é apagável. Use módulos ESM.' },
        { selector: 'TSParameterProperty', message: 'parameter property não é apagável. Declare o campo explicitamente.' },
        { selector: 'TSImportEquals', message: '`import =` é CommonJS. Use import ESM.' },
        { selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]', message: 'dangerouslySetInnerHTML é vetor de XSS — evite ou sanitize e desabilite por linha.' },
        { selector: 'CallExpression[callee.name=/^use(Query|Mutation|InfiniteQuery|Queries|SuspenseQuery)$/]', message: 'View burra (§XI MVVM): data-hooks do TanStack Query vivem na ViewModel (*.presenter.hook.ts), não na view/page.' },
        { selector: 'CallExpression[callee.name="useReducer"]', message: 'View burra (§XI MVVM): estado complexo (useReducer) vive na ViewModel, não na view/page.' },
      ],
      'no-restricted-imports': [
        'error',
        { patterns: [
          { group: ['**/adapters/**', '**/*.server-fn', '**/*.queries'], message: 'View burra (§XI MVVM): não importe adapters/server functions/queries direto na view/page — passe pela ViewModel.' },
        ] },
      ],
    },
  },

  // Testes (node:test): relaxa regras que conflitam com o idioma do runner.
  // `describe`/`it` retornam promises fire-and-forget por design (no-floating-promises);
  // asserções de tipo em testes são intencionais (vendorizados fiéis do core-api).
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      // Guards `if (r.ok)` em testes são narrowing intencional, mesmo quando o tipo
      // literal os torna "sempre verdadeiros" — não é code smell em asserção de teste.
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },

  // Arquivos de config em JS puro não passam por regras type-checked.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
)
