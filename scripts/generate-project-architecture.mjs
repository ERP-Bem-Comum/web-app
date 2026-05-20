import { promises as fs } from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const outputPath = path.join(rootDir, 'PROJECT_ARCHITECTURE.json')

const includeRootFiles = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'package.json',
  'tsconfig.json',
  'next.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  'eslint.config.mjs',
  'components.json',
  'Dockerfile',
  'docker-compose.yml',
  'firebase.json',
])

const includeDirPrefixes = [
  'src/app',
  'src/components',
  'src/contexts',
  'src/hooks',
  'src/services',
  'src/types',
  'src/validators',
  'src/enums',
  'src/configurations',
  'src/styles',
  'lib',
]

const excludeDirNames = new Set([
  '.git',
  '.next',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'public',
  'handbook',
  '.claude',
  '.codex',
  '.agents',
  'src/asset',
])

const architecturalFocus = {
  purpose:
    'Mapa focado em arquitetura do projeto para consumo por outra IA. Inclui camadas principais do frontend, rotas, componentes, hooks, services, tipos, validações e configs centrais.',
  excludes:
    'Exclui dependências, artefatos gerados, assets estáticos, imagens públicas, documentação auxiliar e configurações específicas de outros agentes.',
}

const rootDescriptionMap = {
  'AGENTS.md': 'Guia persistente do repositório com regras de engenharia, comandos e convenções locais.',
  'CLAUDE.md': 'Contexto arquitetural detalhado do projeto, com decisões, dívidas técnicas e padrões transversais.',
  'README.md': 'Resumo operacional do projeto para setup e uso básico.',
  'package.json': 'Manifesto principal da aplicação com scripts, dependências e versões reais da stack.',
  'tsconfig.json': 'Configuração do TypeScript, incluindo aliases e modo de compilação.',
  'next.config.js': 'Configuração do Next.js usada pelo App Router e build standalone.',
  'tailwind.config.ts': 'Configuração complementar do Tailwind para utilitários, keyframes e plugins locais.',
  'postcss.config.js': 'Configuração do PostCSS usada pela pipeline de estilos.',
  'eslint.config.mjs': 'Configuração flat do ESLint para lint da base.',
  'components.json': 'Configuração do ecossistema shadcn/ui neste repositório.',
  'Dockerfile': 'Definição da imagem Docker do frontend.',
  'docker-compose.yml': 'Execução containerizada local do frontend com variáveis e portas.',
  'firebase.json': 'Configuração de deploy/hosting via Firebase.',
}

function normalizeSlashes(value) {
  return value.split(path.sep).join('/')
}

function shouldInclude(relPath, isDirectory) {
  const normalized = normalizeSlashes(relPath)
  const topLevel = normalized.split('/')[0]

  if (excludeDirNames.has(normalized) || excludeDirNames.has(topLevel)) {
    return false
  }

  if (!normalized.includes('/')) {
    return includeRootFiles.has(normalized) || isDirectory
  }

  return includeDirPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
}

function getDirDescription(relPath) {
  const p = normalizeSlashes(relPath)

  if (p === '.') return 'Raiz arquitetural do projeto filtrada para análise por IA.'
  if (p === 'src/app') return 'Camada de rotas do Next.js App Router, com layouts, páginas e handlers.'
  if (p === 'src/components') return 'Camada de interface React organizada por domínio funcional e componentes compartilhados.'
  if (p === 'src/components/ui') return 'Primitive components e wrappers do shadcn/ui.'
  if (p === 'src/components/layout') return 'Blocos de layout, inputs compartilhados e componentes estruturais reutilizados.'
  if (p === 'src/components/reports') return 'Subsistema de relatórios com filtros, tabelas, gráficos e exportações.'
  if (p === 'src/contexts') return 'Contexts React para estado compartilhado entre componentes.'
  if (p === 'src/hooks') return 'Hooks customizados de dados, comportamento de UI e integração com contexts.'
  if (p === 'src/services') return 'Camada HTTP e de integração com backend, um arquivo por recurso.'
  if (p === 'src/types') return 'Tipos TypeScript de domínio, respostas e contratos internos.'
  if (p === 'src/validators') return 'Validações e schemas dos formulários, filtros e payloads.'
  if (p === 'src/enums') return 'Enums e constantes estruturais do domínio.'
  if (p === 'src/configurations') return 'Configurações globais de cores, Zod e outros defaults do frontend.'
  if (p === 'src/styles') return 'Estilos globais e tokens do frontend.'
  if (p === 'lib') return 'Infraestrutura leve e utilitários compartilhados fora de src/.'

  const base = path.basename(p)
  if (base.startsWith('(') && base.endsWith(')')) {
    return 'Route group do Next.js usado para organizar layouts sem alterar a URL.'
  }
  if (base.startsWith('[') && base.endsWith(']')) {
    return 'Segmento dinâmico do App Router.'
  }

  if (p.startsWith('src/components/')) {
    return 'Subdiretório de componentes React agrupados por domínio ou responsabilidade visual.'
  }
  if (p.startsWith('src/app/')) {
    return 'Subdiretório de rota, segmento ou fluxo do App Router.'
  }
  if (p.startsWith('src/hooks/')) {
    return 'Subdiretório de hooks especializados.'
  }
  if (p.startsWith('src/types/')) {
    return 'Subdiretório de tipos especializados.'
  }
  if (p.startsWith('src/validators/')) {
    return 'Subdiretório de validações especializadas.'
  }

  return 'Diretório relevante para a arquitetura da aplicação.'
}

function inferFileDescription(relPath) {
  const p = normalizeSlashes(relPath)
  if (rootDescriptionMap[p]) return rootDescriptionMap[p]

  const ext = path.extname(p)
  const base = path.basename(p, ext)

  if (p === 'src/services/http-client.ts') {
    return 'Wrapper HTTP central baseado em fetch; ponto canônico para chamadas HTTP diretas.'
  }
  if (p === 'src/services/http-status.ts') {
    return 'Mapa/constantes de status HTTP usados pela camada de serviços.'
  }
  if (p === 'src/services/api.ts') {
    return 'Cliente HTTP autenticado principal usado pelos services do app.'
  }
  if (p === 'src/services/apiOptions.ts') {
    return 'Cliente HTTP alternativo para fluxos com autenticação especial e aprovações.'
  }
  if (p === 'src/services/apiShared.ts') {
    return 'Cliente HTTP voltado aos fluxos compartilhados/públicos.'
  }
  if (p === 'src/components/Providers.tsx') {
    return 'Provider raiz da aplicação para sessão, React Query e infraestrutura compartilhada.'
  }
  if (p === 'src/app/api/auth/[...nextauth]/route.ts') {
    return 'Route handler do NextAuth que implementa o fluxo de login por credenciais.'
  }
  if (p === 'src/configurations/globalZodConfig.ts') {
    return 'Configuração global do Zod com mensagens e defaults de validação.'
  }
  if (p === 'src/styles/globals.css') {
    return 'Folha global de estilos com Tailwind 4, tokens e animações do projeto.'
  }
  if (p === 'lib/react-query.ts') {
    return 'Infraestrutura base do React Query usada pelo frontend.'
  }
  if (p === 'lib/utils.ts') {
    return 'Utilitários compartilhados, incluindo helpers de composição de classes.'
  }

  if (p.startsWith('src/app/')) {
    if (base === 'page') return 'Página do App Router para uma rota da aplicação.'
    if (base === 'layout') return 'Layout do App Router para o segmento correspondente.'
    if (base === 'loading') return 'Estado de loading do App Router.'
    if (base === 'route') return 'Route handler server-side do Next.js.'
    if (base === 'head') return 'Metadados/head específicos de uma rota legada do App Router.'
    return 'Arquivo relacionado a roteamento, composição de página ou fluxo do Next.js.'
  }

  if (p.startsWith('src/components/')) {
    if (base.toLowerCase().includes('table')) return 'Componente React de tabela, grade ou linha de listagem.'
    if (base.toLowerCase().includes('form')) return 'Componente React de formulário ou seção de entrada de dados.'
    if (base.toLowerCase().includes('modal')) return 'Componente React de modal, diálogo ou confirmação.'
    if (base.toLowerCase().includes('chart') || base.toLowerCase().includes('graph')) return 'Componente React de visualização gráfica.'
    if (base.toLowerCase().includes('filter')) return 'Componente React de filtros de busca ou relatório.'
    if (base === 'consts' || base === 'const' || base === 'Index' || base === 'index') return 'Arquivo auxiliar de composição, constantes ou agregação do módulo de componentes.'
    return 'Componente React da camada de interface do frontend.'
  }

  if (p.startsWith('src/contexts/')) return 'Context React para estado compartilhado por feature.'
  if (p.startsWith('src/hooks/')) return 'Hook customizado para integração de dados, UI ou composição de comportamento.'
  if (p.startsWith('src/services/')) return 'Service de integração com um recurso externo ou endpoint do backend.'
  if (p.startsWith('src/types/')) return 'Definições de tipos TypeScript para contratos de dados e estruturas internas.'
  if (p.startsWith('src/validators/')) return 'Schema ou regra de validação de dados/formulário.'
  if (p.startsWith('src/enums/')) return 'Enum ou conjunto de constantes de domínio.'
  if (p.startsWith('src/configurations/')) return 'Arquivo de configuração global do frontend.'
  if (p.startsWith('src/styles/')) return 'Arquivo de estilos relevante para a arquitetura visual.'

  if (ext === '.tsx') return 'Componente ou módulo React em TSX.'
  if (ext === '.ts') return 'Módulo TypeScript da aplicação.'
  if (ext === '.js' || ext === '.mjs') return 'Script ou configuração JavaScript relevante para o projeto.'
  if (ext === '.md') return 'Documento Markdown relevante para regras ou contexto da aplicação.'
  if (ext === '.json') return 'Arquivo JSON de configuração do projeto.'
  return 'Arquivo relevante para a arquitetura do projeto.'
}

async function buildNode(absPath, relPath = '') {
  const stat = await fs.stat(absPath)
  const name = path.basename(absPath)
  const normalizedPath = relPath ? normalizeSlashes(relPath) : '.'

  if (stat.isDirectory()) {
    const entries = await fs.readdir(absPath, { withFileTypes: true })
    const filtered = entries
      .filter((entry) => shouldInclude(relPath ? path.join(relPath, entry.name) : entry.name, entry.isDirectory()))
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1
        if (!a.isDirectory() && b.isDirectory()) return 1
        return a.name.localeCompare(b.name)
      })

    const children = []
    for (const entry of filtered) {
      const childAbsPath = path.join(absPath, entry.name)
      const childRelPath = relPath ? path.join(relPath, entry.name) : entry.name
      const childNode = await buildNode(childAbsPath, childRelPath)
      if (childNode) {
        children.push(childNode)
      }
    }

    if (relPath && children.length === 0 && !includeDirPrefixes.includes(normalizedPath)) {
      return null
    }

    return {
      type: 'directory',
      name,
      path: normalizedPath,
      description: getDirDescription(normalizedPath),
      children,
    }
  }

  return {
    type: 'file',
    name,
    path: normalizedPath,
    extension: path.extname(name) || null,
    description: inferFileDescription(normalizedPath),
  }
}

function countNodes(node) {
  if (node.type === 'file') return { files: 1, directories: 0 }
  let files = 0
  let directories = 1
  for (const child of node.children) {
    const c = countNodes(child)
    files += c.files
    directories += c.directories
  }
  return { files, directories }
}

const tree = await buildNode(rootDir)
const counts = countNodes(tree)

const document = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  project_name: path.basename(rootDir),
  root_path: rootDir,
  architecture_focus: architecturalFocus,
  summary: {
    files: counts.files,
    directories: counts.directories - 1,
  },
  tree,
}

await fs.writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
console.log(`Generated ${path.relative(rootDir, outputPath)} with ${counts.files} architecture files.`)
