import { promises as fs } from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const outputPath = path.join(rootDir, 'PROJECT_TREE.json')

const excludedDirs = new Set([
  '.git',
  '.next',
  'node_modules',
  'dist',
  'build',
  'coverage',
])

const rootDescriptionMap = {
  'AGENTS.md': 'Instrucoes persistentes do repositório para agentes de IA e CLIs que consomem contexto automaticamente.',
  'CLAUDE.md': 'Contexto arquitetural e operacional detalhado do projeto, usado como referência canônica complementar.',
  'GEMINI.md': 'Arquivo de integração e contexto para Gemini CLI.',
  'README.md': 'Resumo geral do projeto, setup e comandos principais.',
  'DOCUMENTACAO_TECNICA.md': 'Documentação técnica extensa do projeto; parte do conteúdo está defasada em relação às versões reais.',
  'Dockerfile': 'Definição da imagem Docker do frontend com build e runtime do Next.js.',
  'docker-compose.yml': 'Orquestração local do container do frontend com variáveis e portas.',
  'package.json': 'Manifesto do projeto com scripts, dependências e versões oficiais da stack.',
  'pnpm-lock.yaml': 'Lockfile oficial do pnpm com a resolução exata das dependências.',
  'package-lock.json': 'Lockfile legado do npm mantido no repositório.',
  'tsconfig.json': 'Configuração do TypeScript e aliases do projeto.',
  'next.config.js': 'Configuração do Next.js, incluindo output standalone e tolerâncias de build.',
  'tailwind.config.ts': 'Configuração complementar do Tailwind para keyframes, plugins e utilitários customizados.',
  'postcss.config.js': 'Configuração do PostCSS usada pelo Tailwind no projeto.',
  'eslint.config.mjs': 'Configuração flat do ESLint adotada pelo frontend.',
  'components.json': 'Configuração do shadcn/ui para geração e resolução de aliases.',
  'firebase.json': 'Configuração de hosting/deploy via Firebase.',
}

const dirHints = [
  ['src/app', 'Rotas, layouts, loading states e endpoints do App Router do Next.js.'],
  ['src/components/ui', 'Componentes base do shadcn/ui reutilizados em todo o frontend.'],
  ['src/components/layout', 'Componentes de layout, campos compartilhados e blocos reutilizáveis de interface.'],
  ['src/components/reports', 'Componentes de relatórios, filtros, tabelas, gráficos e exportações.'],
  ['src/components', 'Camada principal de componentes React organizada por domínio funcional.'],
  ['src/contexts', 'Contexts React para estado compartilhado por feature.'],
  ['src/hooks/reports', 'Hooks especializados para filtros e consultas de relatórios.'],
  ['src/hooks', 'Hooks customizados do projeto para estado, integração e utilidades de UI.'],
  ['src/services', 'Camada HTTP e integração com a API, um arquivo por recurso.'],
  ['src/types/reports', 'Tipos de dados específicos dos relatórios.'],
  ['src/types', 'Tipos TypeScript e contratos de dados usados pelo frontend.'],
  ['src/validators/reports', 'Schemas e validações dos filtros e formulários de relatórios.'],
  ['src/validators', 'Validações Zod e regras de formulário do projeto.'],
  ['src/enums', 'Enums e listas de constantes de domínio.'],
  ['src/configurations', 'Configurações globais do frontend, como Zod e tokens de cor.'],
  ['src/styles', 'Arquivos globais de estilo do frontend.'],
  ['src/asset', 'Assets estáticos locais usados pela aplicação.'],
  ['public/images', 'Imagens públicas servidas diretamente pelo Next.js.'],
  ['public', 'Assets públicos expostos pelo Next.js sem processamento.'],
  ['lib', 'Utilitários e singletons compartilhados fora de src/.'],
  ['handbook/references', 'Espelho local de documentação e referências técnicas para agentes e manutenção.'],
  ['handbook', 'Materiais auxiliares, referências e utilitários de apoio ao projeto.'],
  ['.claude/agents', 'Agentes especializados definidos para o ecossistema Claude Code neste repositório.'],
  ['.claude/skills', 'Skills locais originalmente criadas para workflows recorrentes com Claude.'],
  ['.claude', 'Configurações, agentes e skills específicos do Claude Code.'],
  ['.codex/agents', 'Subagents customizados no formato nativo do Codex.'],
  ['.codex', 'Camada de configuração repo-scoped do Codex.'],
  ['.agents/skills', 'Skills repo-scoped no formato nativo do Codex para workflows repetíveis.'],
  ['.agents', 'Diretório raiz de skills e recursos de agente no padrão do Codex.'],
  ['scripts', 'Scripts auxiliares mantidos no repositório para automação e geração de artefatos.'],
]

const fileHints = [
  ['src/app/api/auth/[...nextauth]/route.ts', 'Route handler do NextAuth responsável pelo fluxo de autenticação por credenciais.'],
  ['src/components/Providers.tsx', 'Provider raiz que registra contexto global, sessão e infraestrutura compartilhada de runtime.'],
  ['src/services/http-client.ts', 'Wrapper HTTP central baseado em fetch; único ponto permitido para chamadas HTTP diretas.'],
  ['src/services/http-status.ts', 'Constantes e utilitários de status HTTP usados pelos services.'],
  ['src/services/api.ts', 'Cliente autenticado principal para chamadas à API do backend.'],
  ['src/services/apiOptions.ts', 'Cliente HTTP com estratégia alternativa de autenticação para fluxos de aprovação/opções.'],
  ['src/services/apiShared.ts', 'Cliente HTTP voltado a fluxos compartilhados e públicos com credenciais próprias.'],
  ['src/configurations/globalZodConfig.ts', 'Configuração global das mensagens e defaults do Zod para formulários.'],
  ['src/styles/globals.css', 'Folha global de estilos, tokens Tailwind 4 e import de animações.'],
]

function normalizeSlashes(value) {
  return value.split(path.sep).join('/')
}

function startsWithPath(filePath, prefix) {
  return filePath === prefix || filePath.startsWith(`${prefix}/`)
}

function getDirDescription(relPath) {
  for (const [prefix, description] of dirHints) {
    if (startsWithPath(relPath, prefix)) {
      return description
    }
  }

  const base = path.basename(relPath)

  if (base.startsWith('(') && base.endsWith(')')) {
    return 'Route group do Next.js usado para agrupar páginas e layouts sem afetar a URL.'
  }

  if (base.startsWith('[') && base.endsWith(']')) {
    return 'Segmento dinâmico do App Router do Next.js.'
  }

  return 'Diretório do projeto contendo arquivos relacionados por domínio, framework ou responsabilidade técnica.'
}

function describeFileByExtension(ext) {
  switch (ext) {
    case '.tsx':
      return 'Componente React em TSX.'
    case '.ts':
      return 'Módulo TypeScript do projeto.'
    case '.js':
    case '.mjs':
      return 'Script ou configuração JavaScript do projeto.'
    case '.json':
      return 'Arquivo JSON de configuração ou dados.'
    case '.md':
      return 'Documento Markdown com contexto, guia ou documentação.'
    case '.css':
      return 'Arquivo de estilos CSS.'
    case '.svg':
      return 'Asset vetorial SVG.'
    case '.png':
      return 'Imagem PNG usada como asset estático.'
    case '.ico':
      return 'Ícone usado pela aplicação ou navegador.'
    case '.yaml':
    case '.yml':
      return 'Arquivo YAML de configuração.'
    case '.d.ts':
      return 'Declaração de tipos TypeScript.'
    default:
      return 'Arquivo do projeto.'
  }
}

function inferFileDescription(relPath) {
  if (rootDescriptionMap[relPath]) {
    return rootDescriptionMap[relPath]
  }

  for (const [prefix, description] of fileHints) {
    if (relPath === prefix) {
      return description
    }
  }

  const ext = path.extname(relPath)
  const base = path.basename(relPath, ext)
  const parent = normalizeSlashes(path.dirname(relPath))
  const fallback = describeFileByExtension(ext)

  if (parent === '.') {
    return `${fallback} Mantido na raiz do repositório.`
  }

  if (startsWithPath(relPath, 'src/app')) {
    if (base === 'page') return 'Página do App Router do Next.js para uma rota da aplicação.'
    if (base === 'layout') return 'Layout do App Router que compõe a estrutura visual e providers de um segmento.'
    if (base === 'loading') return 'Estado de carregamento do App Router para o segmento correspondente.'
    if (base === 'route') return 'Route handler do Next.js para endpoint server-side.'
    return `${fallback} Relacionado a uma rota, segmento ou fluxo do App Router.`
  }

  if (startsWithPath(relPath, 'src/components')) {
    if (base.toLowerCase().includes('modal')) return 'Componente React de modal ou diálogo de interação.'
    if (base.toLowerCase().includes('table')) return 'Componente React de tabela, listagem ou linha de tabela.'
    if (base.toLowerCase().includes('form')) return 'Componente React de formulário ou bloco de entrada de dados.'
    if (base.toLowerCase().includes('chart') || base.toLowerCase().includes('graph')) return 'Componente React de visualização gráfica ou chart.'
    if (base.toLowerCase().includes('filter')) return 'Componente React de filtros e parâmetros de busca.'
    if (base === 'consts' || base === 'const') return 'Constantes auxiliares do conjunto de componentes deste diretório.'
    if (base === 'index') return 'Ponto de agregação ou reexportação de componentes do diretório.'
    return `${fallback} Pertence à camada de componentes React do frontend.`
  }

  if (startsWithPath(relPath, 'src/services')) {
    return 'Service responsável por integrar um recurso do frontend com a API ou outra infraestrutura externa.'
  }

  if (startsWithPath(relPath, 'src/hooks')) {
    return 'Hook customizado usado para encapsular estado, comportamento ou integração de dados.'
  }

  if (startsWithPath(relPath, 'src/contexts')) {
    return 'Context React para compartilhamento de estado entre múltiplos componentes.'
  }

  if (startsWithPath(relPath, 'src/validators')) {
    return 'Schema ou regra de validação para formulários, filtros ou payloads do frontend.'
  }

  if (startsWithPath(relPath, 'src/types')) {
    return 'Definições de tipos TypeScript para dados, contratos e estruturas internas.'
  }

  if (startsWithPath(relPath, 'src/enums')) {
    return 'Enum ou conjunto de constantes de domínio usado pela aplicação.'
  }

  if (startsWithPath(relPath, 'src/configurations')) {
    return 'Arquivo de configuração global do frontend.'
  }

  if (startsWithPath(relPath, 'src/styles')) {
    return 'Arquivo de estilo global ou compartilhado.'
  }

  if (startsWithPath(relPath, 'public')) {
    return 'Asset estático público servido diretamente pelo Next.js.'
  }

  if (startsWithPath(relPath, '.claude')) {
    return 'Arquivo de suporte à configuração de agentes, experts ou skills para Claude.'
  }

  if (startsWithPath(relPath, '.codex')) {
    return 'Arquivo de configuração ou especialização para uso do Codex no repositório.'
  }

  if (startsWithPath(relPath, '.agents/skills')) {
    return 'Arquivo pertencente a uma skill repo-scoped do Codex.'
  }

  if (startsWithPath(relPath, 'handbook')) {
    return 'Arquivo de apoio, referência ou utilitário mantido no handbook do projeto.'
  }

  if (startsWithPath(relPath, 'scripts')) {
    return 'Script utilitário para automação, geração ou manutenção do repositório.'
  }

  if (startsWithPath(relPath, 'lib')) {
    return 'Utilitário compartilhado ou infraestrutura leve usada por múltiplas partes do projeto.'
  }

  return `${fallback} Localizado em ${parent}.`
}

async function buildNode(absPath, relPath = '') {
  const stat = await fs.stat(absPath)
  const name = path.basename(absPath)
  const normalizedPath = relPath ? normalizeSlashes(relPath) : '.'

  if (stat.isDirectory()) {
    const entries = await fs.readdir(absPath, { withFileTypes: true })
    const filtered = entries
      .filter((entry) => !excludedDirs.has(entry.name))
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1
        if (!a.isDirectory() && b.isDirectory()) return 1
        return a.name.localeCompare(b.name)
      })

    const children = []
    for (const entry of filtered) {
      const childAbsPath = path.join(absPath, entry.name)
      const childRelPath = relPath ? path.join(relPath, entry.name) : entry.name
      children.push(await buildNode(childAbsPath, childRelPath))
    }

    return {
      type: 'directory',
      name,
      path: normalizedPath,
      description: relPath ? getDirDescription(normalizedPath) : 'Raiz útil do repositório, excluindo dependências e artefatos gerados.',
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
  if (node.type === 'file') {
    return { files: 1, directories: 0 }
  }

  let files = 0
  let directories = 1
  for (const child of node.children) {
    const childCount = countNodes(child)
    files += childCount.files
    directories += childCount.directories
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
  format_note: 'Inventário do repositório voltado a consumo por outras IAs. Diretórios de dependências e build artifacts foram excluídos.',
  exclusions: Array.from(excludedDirs),
  summary: {
    files: counts.files,
    directories: counts.directories - 1,
  },
  tree,
}

await fs.writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
console.log(`Generated ${path.relative(rootDir, outputPath)} with ${counts.files} files.`)
