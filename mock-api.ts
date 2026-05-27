import { createServer } from 'node:http'
import { createApp, createRouter, defineEventHandler, readBody, getQuery, getRouterParams, setCookie, deleteCookie, getCookie, toNodeListener, createError } from 'h3'

// ─── Tipos ───
interface User {
  id: number
  name: string
  email: string
  token: string
}

interface Session {
  userId: number
  email: string
  name: string
  token: string
}

interface Contract {
  id: number
  classification: string
  contractModel: string
  object: string
  totalValue: number
  contractPeriod: { start: string; end: string; isIndefinite?: boolean }
  contractType: string
  contractStatus: string
  supplierId?: number | null
  financierId?: number | null
  collaboratorId?: number | null
  budgetPlanId?: number | null
  programId?: number | null
  supplier?: any
  financier?: any
  collaborator?: any
  program?: any
  budgetPlan?: any
  parentId?: number | null
  createdAt: string
  updatedAt: string
  contractCode: string
  files?: any[]
  children?: any[]
  bancaryInfo?: any
  pixInfo?: any
  dataAssinatura?: string | null
  observations?: string | null
  signedContractUrl?: string | null
  settleTermUrl?: string | null
  withdrawalUrl?: string | null
}

// ─── Dados Mock ───
const MOCK_USER: User = {
  id: 1,
  name: 'Administrador',
  email: 'admin@bemcomum.org.br',
  token: 'mock-jwt-token-' + Date.now(),
}

const CONTRACTS: Contract[] = Array.from({ length: 35 }, (_, i) => {
  const id = i + 1
  const types = ['Fornecedor', 'Financiador', 'Colaborador', 'ACT']
  const statuses = ['Pendente', 'Assinado', 'Em andamento', 'Finalizado', 'Distrato']
  const models = ['Serviço', 'Doação']
  const type = types[i % types.length]
  const status = statuses[i % statuses.length]
  const year = 2024 + (i % 3)
  const month = String((i % 12) + 1).padStart(2, '0')
  const day = String((i % 28) + 1).padStart(2, '0')

  return {
    id,
    classification: i % 3 === 0 ? 'Ordem de Serviço' : 'Contrato',
    contractModel: models[i % models.length],
    object: [
      'Prestação de serviços de consultoria em gestão financeira',
      'Aquisição de equipamentos de informática',
      'Contratação de serviços de limpeza e conservação',
      'Prestação de serviços de assessoria jurídica',
      'Fornecimento de material de escritório',
      'Serviços de desenvolvimento de software',
      'Consultoria em planejamento estratégico',
      'Manutenção predial e reformas',
      'Serviços de contabilidade e auditoria',
      'Fornecimento de uniformes e EPIs',
    ][i % 10],
    totalValue: (i + 1) * 1500.5,
    contractPeriod: {
      start: `${year}-${month}-${day}T00:00:00.000Z`,
      end: `${year + 1}-${month}-${day}T00:00:00.000Z`,
      isIndefinite: false,
    },
    contractType: type,
    contractStatus: status,
    supplierId: type === 'Fornecedor' ? 100 + i : null,
    financierId: type === 'Financiador' ? 200 + i : null,
    collaboratorId: type === 'Colaborador' ? 300 + i : null,
    budgetPlanId: i % 5 === 0 ? null : (i % 10) + 1,
    programId: (i % 5) + 1,
    supplier: type === 'Fornecedor' ? {
      id: 100 + i,
      name: `Fornecedor ${i + 1} Ltda`,
      cnpj: '12.345.678/0001-90',
      corporateName: `FORNECEDOR ${i + 1} LTDA`,
      fantasyName: `Fornecedor ${i + 1}`,
      serviceCategory: 'Tecnologia',
      bancaryInfo: { bank: 'Banco do Brasil', agency: '1234', accountNumber: '56789-0', dv: '1' },
      pixInfo: { key_type: 'CNPJ', key: '12.345.678/0001-90' },
    } : null,
    financier: type === 'Financiador' ? {
      id: 200 + i,
      name: `Financiador ${i + 1} SA`,
      cnpj: '98.765.432/0001-10',
      corporateName: `FINANCIADOR ${i + 1} SA`,
      bancaryInfo: { bank: 'Itaú', agency: '5678', accountNumber: '12345-6', dv: '2' },
      pixInfo: { key_type: 'CNPJ', key: '98.765.432/0001-10' },
    } : null,
    collaborator: type === 'Colaborador' ? {
      id: 300 + i,
      name: `Colaborador ${i + 1}`,
      cpf: '123.456.789-00',
      role: 'Analista',
      bancaryInfo: { bank: 'Caixa', agency: '9012', accountNumber: '34567-8', dv: '3' },
      pixInfo: { key_type: 'CPF', key: '123.456.789-00' },
    } : null,
    program: { id: (i % 5) + 1, name: ['Educação', 'Saúde', 'Assistência Social', 'Cultura', 'Esporte'][i % 5] },
    budgetPlan: i % 5 === 0 ? null : {
      id: (i % 10) + 1,
      scenarioName: ['Otimista', 'Pessimista', 'Realista', 'Emergencial', 'Expansão'][i % 5],
      year: 2024 + (i % 2),
      version: 1,
    },
    parentId: null,
    createdAt: `${year}-01-01T00:00:00.000Z`,
    updatedAt: `${year}-06-15T00:00:00.000Z`,
    contractCode: `C-${year}-${String(id).padStart(4, '0')}`,
    files: [],
    children: i % 7 === 0 ? [
      {
        id: 1000 + id,
        classification: 'Contrato',
        contractType: type,
        object: 'Aditivo de prazo',
        contractPeriod: { start: `${year}-${month}-${day}T00:00:00.000Z`, end: `${year + 2}-${month}-${day}T00:00:00.000Z` },
        totalValue: 0,
        contractModel: 'Serviço',
        contractStatus: 'Em andamento',
        aditivoType: 'prazo',
        aditivoStatus: 'Homologado',
        parentId: id,
        createdAt: `${year}-03-01T00:00:00.000Z`,
        updatedAt: `${year}-03-01T00:00:00.000Z`,
        contractCode: `A-${year}-${String(id).padStart(4, '0')}`,
      },
    ] : [],
    bancaryInfo: { bank: 'Banco do Brasil', agency: '1234', accountNumber: '56789-0', dv: '1' },
    pixInfo: { key_type: 'CNPJ', key: '12.345.678/0001-90' },
    dataAssinatura: i % 2 === 0 ? `${day}/${month}/${year}` : null,
    observations: i % 3 === 0 ? 'Contrato prioritário para o primeiro semestre' : null,
  }
})

// ─── Helpers ───
function createSessionToken(session: Session): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    user: session,
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
  })).toString('base64url')
  return `${header}.${payload}.`
}

function parseSessionToken(token: string): Session | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload.user as Session
  } catch {
    return null
  }
}

function getSessionFromCookie(event: any): Session | null {
  const token = getCookie(event, 'session-token')
  if (!token) return null
  return parseSessionToken(token)
}

function requireAuth(event: any): Session {
  const session = getSessionFromCookie(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return session
}

// ─── Router ───
const router = createRouter()

// Auth: Login
router.post('/auth/login', defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password required' })
  }

  const session: Session = {
    userId: MOCK_USER.id,
    email: MOCK_USER.email,
    name: MOCK_USER.name,
    token: MOCK_USER.token,
  }
  const token = createSessionToken(session)

  setCookie(event, 'session-token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60,
  })

  return { user: { id: MOCK_USER.id, email: MOCK_USER.email, name: MOCK_USER.name } }
}))

// Auth: Logout
router.post('/auth/logout', defineEventHandler(async (event) => {
  deleteCookie(event, 'session-token', { path: '/' })
  return { success: true }
}))

// Auth: Session
router.get('/auth/session', defineEventHandler(async (event) => {
  const session = getSessionFromCookie(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return { user: { id: session.userId, email: session.email, name: session.name } }
}))

// Contratos: Listar
router.get('/contracts', defineEventHandler(async (event) => {
  requireAuth(event)
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10))
  const search = String(query.search || '').toLowerCase()
  const contractType = query.contractType as string | undefined
  const contractStatus = query.contractStatus as string | undefined

  let results = [...CONTRACTS]

  if (search) {
    results = results.filter(c =>
      c.object.toLowerCase().includes(search) ||
      c.contractCode.toLowerCase().includes(search) ||
      (c.supplier?.name || '').toLowerCase().includes(search) ||
      (c.financier?.name || '').toLowerCase().includes(search) ||
      (c.collaborator?.name || '').toLowerCase().includes(search)
    )
  }

  if (contractType) {
    results = results.filter(c => c.contractType === contractType)
  }

  if (contractStatus) {
    results = results.filter(c => c.contractStatus === contractStatus)
  }

  const total = results.length
  const start = (page - 1) * limit
  const paginated = results.slice(start, start + limit)

  return {
    data: paginated.map(c => ({
      id: c.id,
      contractCode: c.contractCode,
      object: c.object,
      contractType: c.contractType,
      contractStatus: c.contractStatus,
      totalValue: c.totalValue,
      contractPeriod: c.contractPeriod,
      supplier: c.supplier ? { id: c.supplier.id, name: c.supplier.name, cnpj: c.supplier.cnpj } : null,
      financier: c.financier ? { id: c.financier.id, name: c.financier.name, cnpj: c.financier.cnpj } : null,
      collaborator: c.collaborator ? { id: c.collaborator.id, name: c.collaborator.name, cpf: c.collaborator.cpf } : null,
      budgetPlan: c.budgetPlan,
      program: c.program,
      childrenCount: (c.children || []).length,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  }
}))

// Contratos: Obter por ID
router.get('/contracts/:id', defineEventHandler(async (event) => {
  requireAuth(event)
  const { id } = getRouterParams(event)
  const contract = CONTRACTS.find(c => c.id === Number(id))
  if (!contract) {
    throw createError({ statusCode: 404, statusMessage: 'Contract not found' })
  }
  return contract
}))

// Contratos: Criar
router.post('/contracts', defineEventHandler(async (event) => {
  requireAuth(event)
  const body = await readBody(event)
  const newId = Math.max(...CONTRACTS.map(c => c.id)) + 1
  const newContract: Contract = {
    ...body,
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contractCode: `C-2025-${String(newId).padStart(4, '0')}`,
    contractStatus: body.contractStatus || 'Pendente',
    children: [],
    files: [],
  }
  CONTRACTS.unshift(newContract)
  return { id: newId }
}))

// Contratos: Atualizar
router.put('/contracts/:id', defineEventHandler(async (event) => {
  requireAuth(event)
  const { id } = getRouterParams(event)
  const body = await readBody(event)
  const idx = CONTRACTS.findIndex(c => c.id === Number(id))
  if (idx === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Contract not found' })
  }
  CONTRACTS[idx] = { ...CONTRACTS[idx], ...body, updatedAt: new Date().toISOString() }
  return true
}))

// Contratos: Deletar
router.delete('/contracts/:id', defineEventHandler(async (event) => {
  requireAuth(event)
  const { id } = getRouterParams(event)
  const idx = CONTRACTS.findIndex(c => c.id === Number(id))
  if (idx === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Contract not found' })
  }
  if (CONTRACTS[idx].contractStatus !== 'Pendente') {
    throw createError({ statusCode: 403, statusMessage: 'Only pending contracts can be deleted' })
  }
  CONTRACTS.splice(idx, 1)
  return { success: true }
}))

// Contratos: Aditivo
router.post('/contracts/aditive', defineEventHandler(async (event) => {
  requireAuth(event)
  const body = await readBody(event)
  const parentId = body.parentId
  const parent = CONTRACTS.find(c => c.id === Number(parentId))
  if (!parent) {
    throw createError({ statusCode: 404, statusMessage: 'Parent contract not found' })
  }
  const newId = Math.max(...CONTRACTS.map(c => c.id), 0) + 1
  const aditivo = {
    ...body,
    id: newId,
    contractCode: `A-2025-${String(newId).padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contractStatus: 'Em andamento',
  }
  parent.children = parent.children || []
  parent.children.push(aditivo)
  return newId
}))

// Contratos: Histórico
router.get('/contracts/history/:id', defineEventHandler(async (event) => {
  requireAuth(event)
  const { id } = getRouterParams(event)
  const contract = CONTRACTS.find(c => c.id === Number(id))
  if (!contract) {
    throw createError({ statusCode: 404, statusMessage: 'Contract not found' })
  }
  return {
    contractId: Number(id),
    payables: [],
    receivables: [],
    actions: [
      { date: contract.createdAt, action: 'Contrato criado', user: 'Administrador' },
      ...(contract.children || []).map(child => ({
        date: child.createdAt,
        action: `Aditivo criado: ${child.aditivoType}`,
        user: 'Administrador',
      })),
    ],
  }
}))

// Contratos: CSV
router.get('/contracts/csv', defineEventHandler(async (event) => {
  requireAuth(event)
  event.node.res.setHeader('content-type', 'text/csv')
  event.node.res.setHeader('content-disposition', 'attachment; filename="contratos.csv"')
  const headers = 'ID,Código,Objeto,Tipo,Status,Valor\n'
  const rows = CONTRACTS.map(c => `${c.id},${c.contractCode},"${c.object}",${c.contractType},${c.contractStatus},${c.totalValue}`).join('\n')
  return headers + rows
}))

// Contratos: PDF
router.get('/contracts/pdf', defineEventHandler(async (event) => {
  requireAuth(event)
  event.node.res.setHeader('content-type', 'application/pdf')
  event.node.res.setHeader('content-disposition', 'attachment; filename="contratos.pdf"')
  return Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Relatorio de Contratos) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000214 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n298\n%%EOF\n')
}))

// Arquivos: Upload mock
router.post('/files/contracts', defineEventHandler(async (event) => {
  requireAuth(event)
  return { uploaded: true, files: [] }
}))

router.put('/files/contracts', defineEventHandler(async (event) => {
  requireAuth(event)
  return { updated: true, files: [] }
}))

router.post('/files/contracts/signed', defineEventHandler(async (event) => {
  requireAuth(event)
  return { uploaded: true, url: '/mock/signed.pdf' }
}))

router.post('/files/contracts/settle', defineEventHandler(async (event) => {
  requireAuth(event)
  return { uploaded: true, url: '/mock/settle.pdf' }
}))

router.post('/files/contracts/withdrawal', defineEventHandler(async (event) => {
  requireAuth(event)
  return { uploaded: true, url: '/mock/withdrawal.pdf' }
}))

// ─── App ───
const app = createApp({
  onRequest: (event) => {
    const origin = event.node.req.headers.origin || ''
    event.node.res.setHeader('Access-Control-Allow-Origin', origin || 'http://localhost:3000')
    event.node.res.setHeader('Access-Control-Allow-Credentials', 'true')
    event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (event.node.req.method === 'OPTIONS') {
      event.node.res.statusCode = 204
      event.node.res.end()
      return
    }
  },
  onError: (error, event) => {
    const statusCode = (error as any).statusCode || 500
    const statusMessage = (error as any).statusMessage || 'Internal Server Error'
    event.node.res.statusCode = statusCode
    event.node.res.setHeader('content-type', 'application/json')
    event.node.res.end(JSON.stringify({ message: statusMessage, statusCode }))
  },
})

app.use(router.handler)

const PORT = process.env.PORT || 4010
createServer(toNodeListener(app)).listen(PORT, () => {
  console.log(`🟢 Mock API rodando em http://localhost:${PORT}`)
  console.log('   Endpoints:')
  console.log('   POST /auth/login')
  console.log('   POST /auth/logout')
  console.log('   GET  /auth/session')
  console.log('   GET  /contracts')
  console.log('   GET  /contracts/:id')
  console.log('   POST /contracts')
  console.log('   PUT  /contracts/:id')
  console.log('   DELETE /contracts/:id')
  console.log('   POST /contracts/aditive')
  console.log('   GET  /contracts/history/:id')
  console.log('   GET  /contracts/csv')
  console.log('   GET  /contracts/pdf')
})
