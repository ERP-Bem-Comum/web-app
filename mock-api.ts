import { createServer } from 'node:http'
import {
  createApp,
  createRouter,
  defineEventHandler,
  readBody,
  getQuery,
  getRouterParams,
  setCookie,
  deleteCookie,
  getCookie,
  toNodeListener,
  setResponseStatus,
  setResponseHeader,
} from 'h3'

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
  token: 'mock-jwt-token-static',
}

const SUPPLIERS = Array.from({ length: 8 }, (_, i) => ({
  id: 100 + i,
  name: `Fornecedor ${i + 1} Ltda`,
  cnpj: `12.345.678/000${i + 1}-90`,
  corporateName: `FORNECEDOR ${i + 1} LTDA`,
  fantasyName: `Fornecedor ${i + 1}`,
  serviceCategory: [
    'Tecnologia',
    'Limpeza',
    'Consultoria',
    'Construção',
    'Alimentação',
    'Transporte',
    'Saúde',
    'Educação',
  ][i],
  email: `fornecedor${i + 1}@email.com`,
  telephone: `(11) 9${String(1000 + i).padStart(4, '0')}-${String(1000 + i).padStart(4, '0')}`,
  bancaryInfo: {
    bank: ['Banco do Brasil', 'Itaú', 'Bradesco', 'Santander', 'Caixa', 'Inter', 'Nubank', 'C6'][i],
    agency: `${1000 + i}`,
    accountNumber: `${50000 + i}-0`,
    dv: `${i + 1}`,
  },
  pixInfo: { key_type: 'CNPJ', key: `12.345.678/000${i + 1}-90` },
}))

const FINANCIERS = Array.from({ length: 5 }, (_, i) => ({
  id: 200 + i,
  name: `Financiador ${i + 1} SA`,
  cnpj: `98.765.432/000${i + 1}-10`,
  corporateName: `FINANCIADOR ${i + 1} SA`,
  email: `financiador${i + 1}@email.com`,
  telephone: `(21) 9${String(2000 + i).padStart(4, '0')}-${String(2000 + i).padStart(4, '0')}`,
  bancaryInfo: {
    bank: ['Itaú', 'Bradesco', 'Santander', 'Caixa', 'Banco do Brasil'][i],
    agency: `${2000 + i}`,
    accountNumber: `${60000 + i}-0`,
    dv: `${i + 1}`,
  },
  pixInfo: { key_type: 'CNPJ', key: `98.765.432/000${i + 1}-10` },
}))

const COLLABORATORS = Array.from({ length: 6 }, (_, i) => ({
  id: 300 + i,
  name: `Colaborador ${i + 1}`,
  cpf: `123.456.789-${String(10 + i).padStart(2, '0')}`,
  role: ['Analista', 'Coordenador', 'Gerente', 'Assistente', 'Consultor', 'Especialista'][i],
  email: `colaborador${i + 1}@email.com`,
  telephone: `(31) 9${String(3000 + i).padStart(4, '0')}-${String(3000 + i).padStart(4, '0')}`,
  bancaryInfo: {
    bank: ['Caixa', 'Banco do Brasil', 'Itaú', 'Bradesco', 'Inter', 'Nubank'][i],
    agency: `${3000 + i}`,
    accountNumber: `${70000 + i}-0`,
    dv: `${i + 1}`,
  },
  pixInfo: { key_type: 'CPF', key: `123.456.789-${String(10 + i).padStart(2, '0')}` },
}))

const BUDGET_PLANS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  scenarioName: [
    'Otimista',
    'Pessimista',
    'Realista',
    'Emergencial',
    'Expansão',
    'Contingência',
    'Padrão',
    'Mínimo',
    'Máximo',
    'Revisado',
  ][i],
  year: 2024 + (i % 3),
  version: 1 + (i % 2),
}))

const PROGRAMS = [
  { id: 1, name: 'Educação' },
  { id: 2, name: 'Saúde' },
  { id: 3, name: 'Assistência Social' },
  { id: 4, name: 'Cultura' },
  { id: 5, name: 'Esporte' },
]

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
    supplier:
      type === 'Fornecedor'
        ? {
            id: 100 + i,
            name: `Fornecedor ${i + 1} Ltda`,
            cnpj: '12.345.678/0001-90',
            corporateName: `FORNECEDOR ${i + 1} LTDA`,
            fantasyName: `Fornecedor ${i + 1}`,
            serviceCategory: 'Tecnologia',
            bancaryInfo: {
              bank: 'Banco do Brasil',
              agency: '1234',
              accountNumber: '56789-0',
              dv: '1',
            },
            pixInfo: { key_type: 'CNPJ', key: '12.345.678/0001-90' },
          }
        : null,
    financier:
      type === 'Financiador'
        ? {
            id: 200 + i,
            name: `Financiador ${i + 1} SA`,
            cnpj: '98.765.432/0001-10',
            corporateName: `FINANCIADOR ${i + 1} SA`,
            bancaryInfo: { bank: 'Itaú', agency: '5678', accountNumber: '12345-6', dv: '2' },
            pixInfo: { key_type: 'CNPJ', key: '98.765.432/0001-10' },
          }
        : null,
    collaborator:
      type === 'Colaborador'
        ? {
            id: 300 + i,
            name: `Colaborador ${i + 1}`,
            cpf: '123.456.789-00',
            role: 'Analista',
            bancaryInfo: { bank: 'Caixa', agency: '9012', accountNumber: '34567-8', dv: '3' },
            pixInfo: { key_type: 'CPF', key: '123.456.789-00' },
          }
        : null,
    program: {
      id: (i % 5) + 1,
      name: ['Educação', 'Saúde', 'Assistência Social', 'Cultura', 'Esporte'][i % 5],
    },
    budgetPlan:
      i % 5 === 0
        ? null
        : {
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
    originalContractPeriod: {
      start: `${year}-${month}-${day}T00:00:00.000Z`,
      end: `${year + 1}-${month}-${day}T00:00:00.000Z`,
      isIndefinite: false,
    },
    children:
      i % 7 === 0
        ? [
            {
              id: 1000 + id,
              classification: 'Contrato',
              contractType: type,
              object: 'Aditivo de prazo',
              contractPeriod: {
                start: `${year}-${month}-${day}T00:00:00.000Z`,
                end: `${year + 2}-${month}-${day}T00:00:00.000Z`,
              },
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
          ]
        : [],
    bancaryInfo: { bank: 'Banco do Brasil', agency: '1234', accountNumber: '56789-0', dv: '1' },
    pixInfo: { key_type: 'CNPJ', key: '12.345.678/0001-90' },
    dataAssinatura: i % 2 === 0 ? `${day}/${month}/${year}` : null,
    observations: i % 3 === 0 ? 'Contrato prioritário para o primeiro semestre' : null,
  }
})

// Migração: limpa URLs fictícias e converte data URLs antigas para URLs servidas
CONTRACTS.forEach((c) => {
  if (
    c.signedContractUrl &&
    (c.signedContractUrl.startsWith('file://mock-uploads/') ||
      c.signedContractUrl.startsWith('https://mock-storage/'))
  ) {
    c.signedContractUrl = null
  }
  // Converte data URLs antigas para URLs servidas pelo mock
  if (c.signedContractUrl && c.signedContractUrl.startsWith('data:')) {
    const fileKey = `contract:${c.id}`
    c.signedContractUrl = storeDataUrl(fileKey, c.signedContractUrl)
  }
  if (c.children) {
    c.children.forEach((child: any) => {
      if (
        child.signedContractUrl &&
        (child.signedContractUrl.startsWith('file://mock-uploads/') ||
          child.signedContractUrl.startsWith('https://mock-storage/'))
      ) {
        child.signedContractUrl = null
      }
      if (child.signedContractUrl && child.signedContractUrl.startsWith('data:')) {
        const fileKey = `aditive:${child.id}`
        child.signedContractUrl = storeDataUrl(fileKey, child.signedContractUrl)
      }
    })
  }
})

// ─── File Store (data URLs → servidos pelo mock) ───
const FILE_STORE = new Map<string, { contentType: string; buffer: Buffer }>()

function storeDataUrl(key: string, dataUrl: string | null | undefined): string | null {
  if (!dataUrl) return null
  if (!dataUrl.startsWith('data:')) return dataUrl // já é URL remota
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    // eslint-disable-next-line no-console
    console.log('[storeDataUrl] data URL não corresponde ao regex, retornando original')
    return dataUrl
  }
  const [, contentType, base64] = match
  const buffer = Buffer.from(base64, 'base64')
  FILE_STORE.set(key, { contentType, buffer })
  // eslint-disable-next-line no-console
  console.log('[storeDataUrl] arquivo armazenado:', key, 'tipo:', contentType, 'tamanho:', buffer.length)
  const port = process.env.PORT || 4010
  return `http://localhost:${port}/mock-files/${encodeURIComponent(key)}`
}

function getFileUrl(entity: 'contract' | 'aditive', id: number | string): string {
  const port = process.env.PORT || 4010
  return `http://localhost:${port}/mock-files/${encodeURIComponent(`${entity}:${id}`)}`
}

// ─── Helpers ───
function createSessionToken(session: Session): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      user: session,
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
    }),
  ).toString('base64url')
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

function getSession(event: any): Session | null {
  // Tenta pelo cookie (navegador) — cookie contém JWT de sessão do frontend
  const cookieToken = getCookie(event, 'session-token')
  if (cookieToken) {
    const session = parseSessionToken(cookieToken)
    if (session) return session
  }
  // Tenta pelo header Authorization (server-to-server)
  const authHeader = event.node.req.headers.authorization || ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (bearerToken) {
    // Primeiro: tenta parsear como JWT de sessão (cookie format)
    const session = parseSessionToken(bearerToken)
    if (session) return session
    // Segundo: aceita token raw do backend (ex: mock-jwt-token-...)
    if (bearerToken === MOCK_USER.token) {
      return {
        userId: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
        token: MOCK_USER.token,
      }
    }
  }
  return null
}

// ─── Router ───
const router = createRouter()

// Auth: Login
router.post(
  '/auth/login',
  defineEventHandler(async (event) => {
    const body = await readBody(event)
    if (!body?.email || !body?.password) {
      setResponseStatus(event, 400)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Email and password required' })
    }

    if (body.email !== MOCK_USER.email || body.password !== '123456') {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Invalid credentials' })
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

    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({
      user: { id: MOCK_USER.id, email: MOCK_USER.email, name: MOCK_USER.name },
      token: MOCK_USER.token,
    })
  }),
)

// Auth: Logout
router.post(
  '/auth/logout',
  defineEventHandler(async (event) => {
    deleteCookie(event, 'session-token', { path: '/' })
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ success: true })
  }),
)

// Auth: Session
router.get(
  '/auth/session',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({
      user: { id: session.userId, email: session.email, name: session.name },
    })
  }),
)

// Contratos: Listar
router.get(
  '/contracts',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10))
    const search = String(query.search || '').toLowerCase()
    const contractType = query.contractType as string | undefined
    const contractStatus = query.contractStatus as string | undefined
    const contractPeriodStart = query.contractPeriodStart as string | undefined
    const contractPeriodEnd = query.contractPeriodEnd as string | undefined
    const minValue = query.minValue ? Number(query.minValue) : undefined
    const maxValue = query.maxValue ? Number(query.maxValue) : undefined

    let results = [...CONTRACTS]

    if (search) {
      results = results.filter(
        (c) =>
          c.object.toLowerCase().includes(search) ||
          c.contractCode.toLowerCase().includes(search) ||
          (c.supplier?.name || '').toLowerCase().includes(search) ||
          (c.financier?.name || '').toLowerCase().includes(search) ||
          (c.collaborator?.name || '').toLowerCase().includes(search),
      )
    }

    if (contractType) {
      results = results.filter((c) => c.contractType === contractType)
    }

    if (contractStatus) {
      results = results.filter((c) => c.contractStatus === contractStatus)
    }

    if (contractPeriodStart) {
      const start = new Date(contractPeriodStart)
      start.setHours(0, 0, 0, 0)
      results = results.filter((c) => {
        if (!c.contractPeriod?.end) return false
        const end = new Date(c.contractPeriod.end)
        return end >= start
      })
    }

    if (contractPeriodEnd) {
      const end = new Date(contractPeriodEnd)
      end.setHours(23, 59, 59, 999)
      results = results.filter((c) => {
        if (!c.contractPeriod?.start) return false
        const s = new Date(c.contractPeriod.start)
        return s <= end
      })
    }

    if (minValue !== undefined && !isNaN(minValue)) {
      results = results.filter((c) => c.totalValue >= minValue)
    }

    if (maxValue !== undefined && !isNaN(maxValue)) {
      results = results.filter((c) => c.totalValue <= maxValue)
    }

    const total = results.length
    const start = (page - 1) * limit
    const paginated = results.slice(start, start + limit)

    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    event.node.res.end(
      JSON.stringify({
        data: paginated.map((c) => ({
          id: c.id,
          contractCode: c.contractCode,
          object: c.object,
          contractType: c.contractType,
          contractStatus: c.contractStatus,
          totalValue: c.totalValue,
          contractPeriod: c.contractPeriod,
          supplier: c.supplier
            ? { id: c.supplier.id, name: c.supplier.name, cnpj: c.supplier.cnpj }
            : null,
          financier: c.financier
            ? { id: c.financier.id, name: c.financier.name, cnpj: c.financier.cnpj }
            : null,
          collaborator: c.collaborator
            ? { id: c.collaborator.id, name: c.collaborator.name, cpf: c.collaborator.cpf }
            : null,
          budgetPlan: c.budgetPlan,
          program: c.program,
          childrenCount: (c.children || []).length,
        })),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      }),
    )
  }),
)

// Contratos: Obter por ID
router.get(
  '/contracts/:id',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    const { id } = getRouterParams(event)
    const contract = CONTRACTS.find((c) => c.id === Number(id))
    if (!contract) {
      setResponseStatus(event, 404)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Contract not found' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify(contract)
  }),
)

// Contratos: Criar
router.post(
  '/contracts',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    const body = await readBody(event)
    // eslint-disable-next-line no-console
    console.log('[MOCK API] POST /contracts — signedContractUrl recebido:', body.signedContractUrl ? body.signedContractUrl.slice(0, 60) + '...' : null)
    const newId = Math.max(...CONTRACTS.map((c) => c.id)) + 1
    const year = new Date().getFullYear()
    const prefix = body.classification === 'Ordem de Serviço' ? 'OS' : 'C'

    // Buscar objetos relacionados pelos IDs
    const supplier = body.supplierId
      ? SUPPLIERS.find((s) => s.id === Number(body.supplierId)) || null
      : null
    const financier = body.financierId
      ? FINANCIERS.find((f) => f.id === Number(body.financierId)) || null
      : null
    const collaborator = body.collaboratorId
      ? COLLABORATORS.find((c) => c.id === Number(body.collaboratorId)) || null
      : null
    const program = body.programId
      ? PROGRAMS.find((p) => p.id === Number(body.programId)) || null
      : null
    const budgetPlan = body.budgetPlanId
      ? BUDGET_PLANS.find((b) => b.id === Number(body.budgetPlanId)) || null
      : null

    const fileKey = `contract:${newId}`
    const signedContractUrl = storeDataUrl(fileKey, body.signedContractUrl)

    const newContract: Contract = {
      ...body,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contractCode: `${prefix}-${year}-${String(newId).padStart(4, '0')}`,
      contractStatus: body.contractStatus || 'Pendente',
      children: [],
      files: [],
      bancaryInfo: body.bancaryInfo || null,
      pixInfo: body.pixInfo || null,
      supplier,
      financier,
      collaborator,
      program,
      budgetPlan,
      signedContractUrl,
      originalContractPeriod: body.contractPeriod ? { ...body.contractPeriod } : null,
    }
    CONTRACTS.unshift(newContract)
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify(newContract)
  }),
)

// Contratos: Atualizar
router.put(
  '/contracts/:id',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    const { id } = getRouterParams(event)
    const body = await readBody(event)
    const idx = CONTRACTS.findIndex((c) => c.id === Number(id))
    if (idx === -1) {
      setResponseStatus(event, 404)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Contract not found' })
    }
    const fileKey = `contract:${CONTRACTS[idx].id}`
    const signedContractUrl = body.signedContractUrl !== undefined
      ? storeDataUrl(fileKey, body.signedContractUrl)
      : CONTRACTS[idx].signedContractUrl
    CONTRACTS[idx] = {
      ...CONTRACTS[idx],
      ...body,
      updatedAt: new Date().toISOString(),
      signedContractUrl,
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ success: true })
  }),
)

// Contratos: Deletar
router.delete(
  '/contracts/:id',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    const { id } = getRouterParams(event)
    const idx = CONTRACTS.findIndex((c) => c.id === Number(id))
    if (idx === -1) {
      setResponseStatus(event, 404)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Contract not found' })
    }
    if (CONTRACTS[idx].contractStatus !== 'Pendente') {
      setResponseStatus(event, 403)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Only pending contracts can be deleted' })
    }
    CONTRACTS.splice(idx, 1)
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ success: true })
  }),
)

// Contratos: Aditivo
router.post(
  '/contracts/aditive',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    const body = await readBody(event)
    const parentId = body.parentId
    const parent = CONTRACTS.find((c) => c.id === Number(parentId))
    if (!parent) {
      setResponseStatus(event, 404)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Parent contract not found' })
    }
    const newId = Math.max(...CONTRACTS.map((c) => c.id), 0) + 1
    const fileKey = `aditive:${newId}`
    const signedContractUrl = storeDataUrl(fileKey, body.signedContractUrl)

    const aditivo = {
      ...body,
      id: newId,
      contractCode: `A-2025-${String(newId).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contractStatus: 'Em andamento',
      signedContractUrl,
    }
    parent.children = parent.children || []
    parent.children.push(aditivo)

    // Efeitos de aditivos homologados no contrato pai
    if (aditivo.aditivoStatus === 'Homologado') {
      // Prazo: atualiza vigência atual (preservando original)
      if (
        aditivo.aditivoType === 'prazo' &&
        aditivo.contractPeriod?.end
      ) {
        if (!parent.originalContractPeriod && parent.contractPeriod) {
          parent.originalContractPeriod = { ...parent.contractPeriod }
        }
        parent.contractPeriod = {
          ...parent.contractPeriod,
          end: aditivo.contractPeriod.end,
        }
      }
      // Distrato: encerra o contrato
      if (aditivo.aditivoType === 'distrato') {
        parent.contractStatus = 'Distrato'
      }
    }

    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ id: newId })
  }),
)

// Contratos: Aditivo — Atualizar
router.put(
  '/contracts/aditive/:id',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    const { id } = getRouterParams(event)
    const body = await readBody(event)
    let updated = false
    for (const contract of CONTRACTS) {
      if (!contract.children) continue
      const idx = contract.children.findIndex((c: any) => c.id === Number(id))
      if (idx >= 0) {
        const fileKey = `aditive:${contract.children[idx].id}`
        const signedContractUrl = body.signedContractUrl !== undefined
          ? storeDataUrl(fileKey, body.signedContractUrl)
          : contract.children[idx].signedContractUrl
        const updatedAditivo = {
          ...contract.children[idx],
          ...body,
          id: contract.children[idx].id,
          updatedAt: new Date().toISOString(),
          signedContractUrl,
        }
        contract.children[idx] = updatedAditivo

        // Efeitos de aditivos homologados no contrato pai
        if (updatedAditivo.aditivoStatus === 'Homologado') {
          // Prazo: atualiza vigência atual (preservando original)
          if (
            updatedAditivo.aditivoType === 'prazo' &&
            updatedAditivo.contractPeriod?.end
          ) {
            if (!contract.originalContractPeriod && contract.contractPeriod) {
              contract.originalContractPeriod = { ...contract.contractPeriod }
            }
            contract.contractPeriod = {
              ...contract.contractPeriod,
              end: updatedAditivo.contractPeriod.end,
            }
          }
          // Distrato: encerra o contrato
          if (updatedAditivo.aditivoType === 'distrato') {
            contract.contractStatus = 'Distrato'
          }
        }

        updated = true
        break
      }
    }
    if (!updated) {
      setResponseStatus(event, 404)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Aditive not found' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ success: true })
  }),
)

// Contratos: Histórico
router.get(
  '/contracts/history/:id',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    const { id } = getRouterParams(event)
    const contract = CONTRACTS.find((c) => c.id === Number(id))
    if (!contract) {
      setResponseStatus(event, 404)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Contract not found' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    event.node.res.end(
      JSON.stringify({
        contractId: Number(id),
        payables: [],
        receivables: [],
        actions: [
          { date: contract.createdAt, action: 'Contrato criado', user: 'Administrador' },
          ...(contract.children || []).map((child) => ({
            date: child.createdAt,
            action: `Aditivo criado: ${child.aditivoType}`,
            user: 'Administrador',
          })),
        ],
      }),
    )
  }),
)

// Contratos: CSV
router.get(
  '/contracts/csv',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseHeader(event, 'content-type', 'text/csv')
    setResponseHeader(event, 'content-disposition', 'attachment; filename="contratos.csv"')
    const headers = 'ID,Código,Objeto,Tipo,Status,Valor\n'
    const rows = CONTRACTS.map(
      (c) =>
        `${c.id},${c.contractCode},"${c.object}",${c.contractType},${c.contractStatus},${c.totalValue}`,
    ).join('\n')
    return headers + rows
  }),
)

// Contratos: PDF
router.get(
  '/contracts/pdf',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseHeader(event, 'content-type', 'application/pdf')
    setResponseHeader(event, 'content-disposition', 'attachment; filename="contratos.pdf"')
    return Buffer.from(
      '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Relatorio de Contratos) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000214 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n298\n%%EOF\n',
    )
  }),
)

// Arquivos: Upload mock
router.post(
  '/files/contracts',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ uploaded: true, files: [] })
  }),
)

router.put(
  '/files/contracts',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ updated: true, files: [] })
  }),
)

router.post(
  '/files/contracts/signed',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ uploaded: true, url: '/mock/signed.pdf' })
  }),
)

router.post(
  '/files/contracts/settle',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ uploaded: true, url: '/mock/settle.pdf' })
  }),
)

router.post(
  '/files/contracts/withdrawal',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ uploaded: true, url: '/mock/withdrawal.pdf' })
  }),
)

// Partners: Suppliers
router.get(
  '/suppliers',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ items: SUPPLIERS, meta: { total: SUPPLIERS.length } })
  }),
)

// Partners: Financiers
router.get(
  '/financiers',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ items: FINANCIERS, meta: { total: FINANCIERS.length } })
  }),
)

// Partners: Collaborators
router.get(
  '/collaborators',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ items: COLLABORATORS, meta: { total: COLLABORATORS.length } })
  }),
)

// Budget Plans
router.get(
  '/budget-plans',
  defineEventHandler(async (event) => {
    const session = getSession(event)
    if (!session) {
      setResponseStatus(event, 401)
      setResponseHeader(event, 'content-type', 'application/json')
      return JSON.stringify({ message: 'Unauthorized' })
    }
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ items: BUDGET_PLANS, meta: { total: BUDGET_PLANS.length } })
  }),
)

// Servir arquivos armazenados (data URLs convertidos)
router.get(
  '/mock-files/:key',
  defineEventHandler(async (event) => {
    const { key } = getRouterParams(event)
    const decodedKey = decodeURIComponent(key)
    // eslint-disable-next-line no-console
    console.log('[MOCK API] GET /mock-files/:key — raw key:', key, '| decoded:', decodedKey)
    // eslint-disable-next-line no-console
    console.log('[MOCK API] FILE_STORE keys:', Array.from(FILE_STORE.keys()))
    const file = FILE_STORE.get(decodedKey)
    if (!file) {
      setResponseStatus(event, 404)
      setResponseHeader(event, 'content-type', 'text/plain')
      setResponseHeader(event, 'access-control-allow-origin', '*')
      return 'Arquivo não encontrado'
    }
    setResponseHeader(event, 'content-type', file.contentType)
    setResponseHeader(event, 'content-disposition', 'inline')
    setResponseHeader(event, 'access-control-allow-origin', '*')
    return file.buffer
  }),
)

// ─── App ───
const app = createApp({
  onRequest: (event) => {
    const origin = event.node.req.headers.origin || ''
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin || 'http://localhost:3000')
    setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
  },
  onError: (error, event) => {
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return
    }
    const statusCode = (error as any).statusCode || 500
    const statusMessage = (error as any).statusMessage || 'Internal Server Error'
    setResponseStatus(event, statusCode)
    setResponseHeader(event, 'content-type', 'application/json')
    return JSON.stringify({ message: statusMessage, statusCode })
  },
})

app.use(router.handler)

// Handler direto para mock-files (workaround para h3 router)
app.use(
  defineEventHandler(async (event) => {
    const url = event.node.req.url || ''
    if (!url.startsWith('/mock-files/')) {
      // Não é nossa rota, deixa passar (mas como é o último handler, vai dar 404)
      setResponseStatus(event, 404)
      setResponseHeader(event, 'content-type', 'text/plain')
      return 'Not found'
    }
    const key = url.replace('/mock-files/', '').split('?')[0]
    const decodedKey = decodeURIComponent(key)
    const file = FILE_STORE.get(decodedKey)
    if (!file) {
      setResponseStatus(event, 404)
      setResponseHeader(event, 'content-type', 'text/plain')
      setResponseHeader(event, 'access-control-allow-origin', '*')
      return 'Arquivo não encontrado'
    }
    setResponseHeader(event, 'content-type', file.contentType)
    setResponseHeader(event, 'content-disposition', 'inline')
    setResponseHeader(event, 'access-control-allow-origin', '*')
    return file.buffer
  }),
)

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
  console.log('   PUT  /contracts/aditive/:id')
  console.log('   GET  /contracts/history/:id')
  console.log('   GET  /contracts/csv')
  console.log('   GET  /contracts/pdf')
  console.log('   GET  /mock-files/:key')
})
