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

// Camadas da constituição v1.2.0 (ADR-0004) → tipos de elemento p/ eslint-plugin-boundaries.
// Módulo = server/ (BFF, DDD) + client/ (FRONT, MVVM) + public-api. Fronteira client↔server = server fn.
// modo 'folder': o pattern casa a PASTA. ORDEM IMPORTA: mais específico antes do genérico.
const F = { capture: ['feature'] }
const boundaryElements = [
  { type: 'shared-ui', pattern: 'src/shared/ui' },
  { type: 'shared', pattern: 'src/shared' }, // inclui primitives/http/bus/i18n/ports/utils
  { type: 'external', pattern: 'src/external' },
  // server-side (BFF, DDD)
  { type: 'server-domain', pattern: 'src/modules/*/server/domain', ...F },
  { type: 'server-application', pattern: 'src/modules/*/server/application', ...F },
  { type: 'server-adapters', pattern: 'src/modules/*/server/adapters', ...F },
  // client-side (FRONT, MVVM)
  { type: 'client-data', pattern: 'src/modules/*/client/data', ...F },
  { type: 'client-usecase', pattern: 'src/modules/*/client/usecase', ...F },
  { type: 'client-view-model', pattern: 'src/modules/*/client/view-model', ...F },
  { type: 'client-ui', pattern: 'src/modules/*/client/ui', ...F },
  { type: 'public-api', pattern: 'src/modules/*/public-api', ...F },
]

// Dependência aponta pra dentro; mesma feature via {{from.captured.feature}}; cross-módulo só `public-api`.
const sameFeature = (types) => ({ to: { type: types, captured: { feature: '{{from.captured.feature}}' } } })
const boundaryRules = [
  // --- cross-cutting ---
  { from: { type: 'shared' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'shared-ui' }, allow: { to: { type: ['shared', 'shared-ui'] } } },
  { from: { type: 'external' }, allow: { to: { type: ['shared', 'external'] } } }, // server-only; nunca módulos

  // --- SERVER (DDD): domain puro → application → adapters ---
  { from: { type: 'server-domain' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'server-domain' }, allow: sameFeature('server-domain') },
  { from: { type: 'server-application' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'server-application' }, allow: sameFeature(['server-domain', 'server-application']) },
  { from: { type: 'server-adapters' }, allow: { to: { type: ['shared', 'external', 'public-api'] } } },
  { from: { type: 'server-adapters' }, allow: sameFeature(['server-domain', 'server-application', 'server-adapters']) },

  // --- CLIENT (MVVM): data → usecase → view-model → ui ---
  // data: Repository é a PORTA → chama a server function (server-adapters da MESMA feature). Não toca server/domain|application.
  { from: { type: 'client-data' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'client-data' }, allow: sameFeature(['client-data', 'server-adapters']) },
  // usecase: shared + data/usecase própria + public-api (emite no bus de shared).
  { from: { type: 'client-usecase' }, allow: { to: { type: ['shared', 'public-api'] } } },
  { from: { type: 'client-usecase' }, allow: sameFeature(['client-data', 'client-usecase']) },
  // view-model: shared + data/usecase/view-model própria + public-api (TanStack Query, assina o bus).
  { from: { type: 'client-view-model' }, allow: { to: { type: ['shared', 'public-api'] } } },
  { from: { type: 'client-view-model' }, allow: sameFeature(['client-data', 'client-usecase', 'client-view-model']) },
  // ui: shared + design system + view-model/data(tipos)/ui própria + public-api. NÃO importa server/* nem repository direto.
  { from: { type: 'client-ui' }, allow: { to: { type: ['shared', 'shared-ui', 'public-api'] } } },
  { from: { type: 'client-ui' }, allow: sameFeature(['client-data', 'client-view-model', 'client-ui']) },

  // --- public-api: re-exporta as camadas do PRÓPRIO módulo (client p/ consumo externo) ---
  { from: { type: 'public-api' }, allow: { to: { type: 'shared' } } },
  {
    from: { type: 'public-api' },
    allow: sameFeature(['server-domain', 'server-application', 'server-adapters', 'client-data', 'client-usecase', 'client-view-model', 'client-ui']),
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
      '**/routeTree.gen.ts',
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
      // Params/vars prefixados com `_` são intencionalmente não-usados (assinatura exigida pelo tipo).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
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
      // Resolver TS p/ o boundaries enxergar imports .ts/.tsx e os subpath imports (#shared, #modules, …).
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/include': ['src/**/*'],
      // Composition root / framework glue — fora da matriz de camadas.
      // src/app/ = bootstrap (router, query-client, routeTree gerado); src/routes/ = file-based routing.
      'boundaries/ignore': ['src/app/**', 'src/routes/**'],
      'boundaries/elements': boundaryElements,
    },
    rules: {
      'boundaries/dependencies': ['error', { default: 'disallow', rules: boundaryRules }],
    },
  },

  // MVVM (constituição §XI, ADR-0004): VIEWS BURRAS = *.page.tsx + *.component.tsx (e rotas).
  // ViewModel (*.view-model.ts) e Controller (*.controller.ts) PODEM ter estado — não entram aqui.
  // Proibido nas views burras: data-hooks (useQuery/useMutation), useReducer, e import de
  // server/data/usecase/repository/server-fn (passe pela ViewModel).
  {
    files: [
      'src/modules/*/client/ui/**/*.page.tsx',
      'src/modules/*/client/ui/**/*.component.tsx',
      'src/routes/**/*.tsx',
    ],
    rules: {
      // ⚠ flat config substitui (não mescla): re-inclui os selectors globais TS 6→7 + XSS.
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'enum não é apagável (TS native / strip-types). Use union de literais + objeto `as const`.' },
        { selector: 'TSModuleDeclaration[kind="namespace"]', message: 'namespace com runtime não é apagável. Use módulos ESM.' },
        { selector: 'TSParameterProperty', message: 'parameter property não é apagável. Declare o campo explicitamente.' },
        { selector: 'TSImportEquals', message: '`import =` é CommonJS. Use import ESM.' },
        { selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]', message: 'dangerouslySetInnerHTML é vetor de XSS — evite ou sanitize e desabilite por linha.' },
        { selector: 'CallExpression[callee.name=/^use(Query|Mutation|InfiniteQuery|Queries|SuspenseQuery)$/]', message: 'View burra (§XI MVVM): data-hooks do TanStack Query vivem na ViewModel (*.view-model.ts), não na page/component.' },
        { selector: 'CallExpression[callee.name="useReducer"]', message: 'View burra (§XI MVVM): estado complexo (useReducer) vive na ViewModel/Controller, não na page/component.' },
      ],
    },
  },

  // Ban de import server/data/usecase SÓ em views burras (page/component) — NÃO em rotas:
  // a rota é composition root e o `beforeLoad` legitimamente chama server functions (padrão do framework).
  {
    files: ['src/modules/*/client/ui/**/*.page.tsx', 'src/modules/*/client/ui/**/*.component.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [
          { group: ['**/server/**', '**/client/data/**', '**/client/usecase/**', '**/*.server-fn', '**/*.repository'], message: 'View burra (§XI MVVM): page/component não importa server/data/usecase/repository — receba tudo da ViewModel por props.' },
        ] },
      ],
    },
  },

  // TanStack lança `redirect()`/`notFound()` (não-Error) por design — em rotas e server functions.
  {
    files: ['src/routes/**/*.{ts,tsx}', 'src/modules/*/server/adapters/*.server-fn.ts'],
    rules: { '@typescript-eslint/only-throw-error': 'off' },
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
