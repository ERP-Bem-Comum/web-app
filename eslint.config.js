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
  // Design system — Atomic Design. ORDEM IMPORTA: estes patterns (mais específicos)
  // vêm ANTES do 'shared-ui' genérico, senão tudo em src/shared/ui casaria como shared-ui.
  // Hierarquia: tokens ← atoms ← molecules ← organisms (dependência só "para baixo").
  { type: 'ds-tokens', pattern: 'src/shared/ui/tokens' },
  { type: 'ds-atom', pattern: 'src/shared/ui/atoms' },
  { type: 'ds-molecule', pattern: 'src/shared/ui/molecules' },
  { type: 'ds-organism', pattern: 'src/shared/ui/organisms' },
  { type: 'shared-ui', pattern: 'src/shared/ui' },
  { type: 'shared', pattern: 'src/shared' }, // inclui primitives/http/bus/i18n/ports/utils
  { type: 'external', pattern: 'src/external' },
  // server-side (BFF, DDD)
  { type: 'server-domain', pattern: 'src/modules/*/server/domain', ...F },
  { type: 'server-application', pattern: 'src/modules/*/server/application', ...F },
  { type: 'server-adapters', pattern: 'src/modules/*/server/adapters', ...F },
  // client-side (FRONT, MVVM, AGNÓSTICO) — feature-first FLAT (ADR-0009): camada = SUFIXO.
  // data/ e domain/ são pastas COMPARTILHADAS (folder mode); o resto casa por sufixo (mode 'file').
  { type: 'client-data', pattern: 'src/modules/*/client/data', ...F },
  { type: 'client-domain', pattern: 'src/modules/*/client/domain', ...F },
  { type: 'client-view-model', mode: 'file', pattern: 'src/modules/*/client/**/*.view-model.ts', ...F },
  { type: 'client-data-options', mode: 'file', pattern: 'src/modules/*/client/**/*.{mutation,query}.ts', ...F },
  { type: 'client-usecase', mode: 'file', pattern: 'src/modules/*/client/**/*.{use-case,composition}.ts', ...F },
  { type: 'client-controller', mode: 'file', pattern: 'src/modules/*/client/**/*.controller.ts', ...F },
  { type: 'client-binding', mode: 'file', pattern: 'src/modules/*/client/**/*.binding.ts', ...F },
  { type: 'client-ui', mode: 'file', pattern: 'src/modules/*/client/**/*.{page,component}.tsx', ...F },
  { type: 'public-api', pattern: 'src/modules/*/public-api', ...F },
]

// Dependência aponta pra dentro; mesma feature via {{from.captured.feature}}; cross-módulo só `public-api`.
const sameFeature = (types) => ({ to: { type: types, captured: { feature: '{{from.captured.feature}}' } } })
const boundaryRules = [
  // --- cross-cutting ---
  { from: { type: 'shared' }, allow: { to: { type: 'shared' } } },
  // Design system (Atomic Design): cada nível só importa de níveis ABAIXO + tokens + shared.
  // atom ↛ molecule ↛ organism; ninguém importa "para cima". (ds-* listados antes de shared-ui.)
  { from: { type: 'ds-tokens' }, allow: { to: { type: ['shared', 'ds-tokens'] } } },
  { from: { type: 'ds-atom' }, allow: { to: { type: ['shared', 'ds-tokens', 'ds-atom'] } } },
  { from: { type: 'ds-molecule' }, allow: { to: { type: ['shared', 'ds-tokens', 'ds-atom', 'ds-molecule'] } } },
  { from: { type: 'ds-organism' }, allow: { to: { type: ['shared', 'ds-tokens', 'ds-atom', 'ds-molecule', 'ds-organism'] } } },
  { from: { type: 'shared-ui' }, allow: { to: { type: ['shared', 'shared-ui', 'ds-tokens', 'ds-atom', 'ds-molecule', 'ds-organism'] } } },
  { from: { type: 'external' }, allow: { to: { type: ['shared', 'external'] } } }, // server-only; nunca módulos

  // --- SERVER (DDD): domain puro → application → adapters ---
  { from: { type: 'server-domain' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'server-domain' }, allow: sameFeature('server-domain') },
  { from: { type: 'server-application' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'server-application' }, allow: sameFeature(['server-domain', 'server-application']) },
  { from: { type: 'server-adapters' }, allow: { to: { type: ['shared', 'external', 'public-api'] } } },
  { from: { type: 'server-adapters' }, allow: sameFeature(['server-domain', 'server-application', 'server-adapters']) },

  // --- CLIENT (MVVM AGNÓSTICO, ADR-0009): núcleo agnóstico (data/domain/view-model/options) × adapter (binding/controller/ui) ---
  // data (COMPARTILHADO): Repository = PORTA → server function (server-adapters da MESMA feature). Não toca server/domain|application.
  { from: { type: 'client-data' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'client-data' }, allow: sameFeature(['client-data', 'server-adapters']) },
  // domain (COMPARTILHADO, opcional): shared + data própria.
  { from: { type: 'client-domain' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'client-domain' }, allow: sameFeature(['client-data', 'client-domain']) },
  // data-options (*.mutation/*.query, AGNÓSTICO): shared + data/domain própria (define queryFn/mutationFn → repository).
  { from: { type: 'client-data-options' }, allow: { to: { type: 'shared' } } },
  { from: { type: 'client-data-options' }, allow: sameFeature(['client-data', 'client-domain', 'client-data-options']) },
  // view-model (AGNÓSTICO, objeto puro): shared + public-api + data/domain/options/view-model própria. SEM React (bloco anti-react).
  { from: { type: 'client-view-model' }, allow: { to: { type: ['shared', 'public-api'] } } },
  { from: { type: 'client-view-model' }, allow: sameFeature(['client-data', 'client-domain', 'client-data-options', 'client-view-model']) },
  // usecase (transitional → vira efeito do command): shared + public-api + data/domain/usecase/view-model própria.
  { from: { type: 'client-usecase' }, allow: { to: { type: ['shared', 'public-api'] } } },
  { from: { type: 'client-usecase' }, allow: sameFeature(['client-data', 'client-domain', 'client-usecase', 'client-view-model']) },
  // controller (ADAPTER, form local): shared + public-api + data própria (Zod schema).
  { from: { type: 'client-controller' }, allow: { to: { type: ['shared', 'public-api'] } } },
  { from: { type: 'client-controller' }, allow: sameFeature(['client-data', 'client-controller']) },
  // binding (ADAPTER): liga o framework ao núcleo. shared + public-api + data/options/view-model/usecase/binding própria.
  { from: { type: 'client-binding' }, allow: { to: { type: ['shared', 'public-api'] } } },
  { from: { type: 'client-binding' }, allow: sameFeature(['client-data', 'client-domain', 'client-data-options', 'client-view-model', 'client-usecase', 'client-binding']) },
  // ui (View burra): shared + design system + public-api + binding/controller/view-model(tipos)/ui própria. NÃO importa server/data/repository direto.
  { from: { type: 'client-ui' }, allow: { to: { type: ['shared', 'shared-ui', 'public-api'] } } },
  { from: { type: 'client-ui' }, allow: sameFeature(['client-binding', 'client-controller', 'client-view-model', 'client-ui']) },

  // --- public-api: re-exporta as camadas do PRÓPRIO módulo (client p/ consumo externo) ---
  { from: { type: 'public-api' }, allow: { to: { type: 'shared' } } },
  {
    from: { type: 'public-api' },
    allow: sameFeature(['server-domain', 'server-application', 'server-adapters', 'client-data', 'client-domain', 'client-data-options', 'client-view-model', 'client-usecase', 'client-controller', 'client-binding', 'client-ui']),
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
      // E2E (Playwright): runtime/tsconfig próprios, fora das camadas/boundaries do app.
      // Transpilado e validado pelo próprio Playwright em runtime (ver e2e/README.md).
      'e2e/**',
      'playwright.config.ts',
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
      // src/app/ = bootstrap (router, query-client, routeTree gerado); src/routes/ = file-based routing;
      // src/start.ts = Start instance (middleware global). Compõem camadas, não são uma delas.
      'boundaries/ignore': ['src/app/**', 'src/routes/**', 'src/start.ts'],
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
      'src/modules/*/client/**/*.page.tsx',
      'src/modules/*/client/**/*.component.tsx',
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
    files: ['src/modules/*/client/**/*.page.tsx', 'src/modules/*/client/**/*.component.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [
          { group: ['**/server/**', '**/client/data/**', '**/*.use-case', '**/*.server-fn', '**/*.repository'], message: 'View burra (§XI MVVM): page/component não importa server/data/use-case/repository — receba tudo do binding/ViewModel por props.' },
        ] },
      ],
    },
  },

  // Núcleo AGNÓSTICO (ADR-0009): data/domain + *.view-model/*.mutation/*.query NÃO importam React.
  // O framework entra só no *.binding.ts (adapter). Garante portabilidade React↔Solid.
  {
    files: [
      'src/modules/*/client/data/**/*.ts',
      'src/modules/*/client/domain/**/*.ts',
      'src/modules/*/client/**/*.{view-model,mutation,query}.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [
          { group: ['react', 'react-dom', 'react/*', '@tanstack/react-*'], message: 'Núcleo agnóstico (ADR-0009): proibido React / @tanstack/react-* — só @tanstack/query-core e tipos. O framework entra só no *.binding.ts.' },
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

  // Design system — "SÓ TOKENS" (zero-dep, ADR-0007/0008): proíbe cor/medida crua nos
  // componentes; force `vars.*` de #shared/ui/tokens. Cobre o que o vanilla-extract não
  // enforça sozinho. Escopo: UI do design system (atoms/molecules/organisms) + UI de feature.
  // EXCLUI tokens/ (definem os valores) e *.values.ts (a fonte de verdade dos literais).
  {
    files: ['src/shared/ui/{atoms,molecules,organisms}/**/*.{ts,tsx}', 'src/modules/*/client/**/*.css.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        // hex cru (#fff, #32C6F4, #aabbccdd) em qualquer literal string
        { selector: 'Literal[value=/#(?:[0-9a-fA-F]{3,4}){1,2}\\b/]', message: 'Cor crua proibida (design system). Use vars.color.* de #shared/ui/tokens.' },
        // medida em px crua ("8px", "1.5px")
        { selector: 'Literal[value=/^-?\\d*\\.?\\d+px$/]', message: 'Medida em px crua proibida (design system). Use vars.space.*/vars.radius.* de #shared/ui/tokens.' },
        // rgb()/rgba()/hsl()/hsla() cruas
        { selector: 'Literal[value=/(?:rgb|rgba|hsl|hsla)\\(/i]', message: 'Cor crua (rgb/hsl) proibida (design system). Use vars.color.* de #shared/ui/tokens.' },
        // MESMAS proibições dentro de template literals (`2px solid ${vars...}`) — o seletor
        // `Literal` não casa `TemplateLiteral`; sem isto, qualquer px/hex/rgb cru ao lado de uma
        // interpolação fura a governança silenciosamente. `TemplateElement` = trechos literais.
        { selector: 'TemplateElement[value.raw=/#(?:[0-9a-fA-F]{3,4}){1,2}\\b/]', message: 'Cor crua proibida (design system). Use vars.color.* de #shared/ui/tokens.' },
        { selector: 'TemplateElement[value.raw=/-?\\d*\\.?\\d+px\\b/]', message: 'Medida em px crua proibida (design system). Use vars.space.*/vars.radius.* de #shared/ui/tokens.' },
        { selector: 'TemplateElement[value.raw=/(?:rgb|rgba|hsl|hsla)\\(/i]', message: 'Cor crua (rgb/hsl) proibida (design system). Use vars.color.* de #shared/ui/tokens.' },
      ],
    },
  },
)
