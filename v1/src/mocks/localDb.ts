/**
 * Local Database — persistência em localStorage para desenvolvimento offline.
 * Quando o backend retorna 403/erro, o frontend opera sobre essa "base local".
 */

import { ContractClassification, ContractModel, ContractStatus, ContractType } from '@/enums/contracts'
import { ContractRow, IContract } from '@/types/contracts'
import { ISupplier } from '@/types/supplier'
import { ICollaborator } from '@/services/collaborator'
import { Options } from '@/types/global'

/** Tipo interno que inclui pending (presente no grid/ContractRow) */
export type LocalContract = IContract & { pending: number; paidValue?: number; children?: LocalContract[] }

const KEYS = {
  contracts: 'erp_local_contracts',
  suppliers: 'erp_local_suppliers',
  collaborators: 'erp_local_collaborators',
  nextContractSeq: 'erp_local_next_contract_seq',
  nextServiceOrderSeq: 'erp_local_next_service_order_seq',
}

/* ═════════════════════════════════════
   HELPERS
   ═════════════════════════════════════ */

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('[LOCAL DB] Falha ao salvar no localStorage:', err)
  }
}

function generateContractCode(
  year: number,
  seq: number,
  classification: ContractClassification = ContractClassification.CONTRACT
): string {
  const prefix = classification === ContractClassification.SERVICE_ORDER ? 'OS' : 'CT'
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`
}

function getNextSeq(year: number, classification: ContractClassification = ContractClassification.CONTRACT): number {
  const key = classification === ContractClassification.SERVICE_ORDER ? KEYS.nextServiceOrderSeq : KEYS.nextContractSeq
  const map = read<Record<string, number>>(key, {})
  const current = map[String(year)] ?? 0
  map[String(year)] = current + 1
  write(key, map)
  return current + 1
}

/* ═════════════════════════════════════
   SEED DATA
   ═════════════════════════════════════ */

const seedSuppliers: ISupplier[] = [
  {
    id: 1,
    name: 'TechSoluções Consultoria LTDA',
    cnpj: '12345678000199',
    corporateName: 'TechSoluções Consultoria LTDA',
    fantasyName: 'TechSoluções',
    serviceCategory: 'Tecnologia da Informação',
    serviceEvaluation: 5,
    commentEvaluation: '',
    active: true,
    email: 'contato@techsolucoes.com.br',
    telephone: '(31) 98765-4321',
    bancaryInfo: { accountNumber: '12345', agency: '0001', bank: '001', dv: '6' },
    pixInfo: { key: '12.345.678/0001-99', key_type: 'CNPJ' },
  },
  {
    id: 2,
    name: 'Construtora Horizonte S.A.',
    cnpj: '98765432000188',
    corporateName: 'Construtora Horizonte S.A.',
    fantasyName: 'Horizonte Construções',
    serviceCategory: 'Construção Civil',
    serviceEvaluation: 4,
    commentEvaluation: '',
    active: true,
    email: 'obra@horizonte.com.br',
    telephone: '(31) 91234-5678',
    bancaryInfo: { accountNumber: '98765', agency: '4321', bank: '237', dv: '1' },
    pixInfo: { key: 'obra@horizonte.com.br', key_type: 'Email' },
  },
  {
    id: 3,
    name: 'Fundação Educar para o Futuro',
    cnpj: '98765432000111',
    corporateName: 'Fundação Educar para o Futuro',
    fantasyName: 'Educar Futuro',
    serviceCategory: 'Educação',
    serviceEvaluation: 5,
    commentEvaluation: '',
    active: true,
    email: 'doacoes@educarfuturo.org.br',
    telephone: '(31) 99876-5432',
    bancaryInfo: { accountNumber: '55555', agency: '7777', bank: '104', dv: '2' },
    pixInfo: { key: '98765432000111', key_type: 'CNPJ' },
  },
  {
    id: 4,
    name: 'Limpar Tudo Serviços LTDA',
    cnpj: '11222333000144',
    corporateName: 'Limpar Tudo Serviços LTDA',
    fantasyName: 'Limpar Tudo',
    serviceCategory: 'Limpeza',
    serviceEvaluation: 4,
    commentEvaluation: '',
    active: true,
    email: 'atendimento@limpartudo.com.br',
    telephone: '(31) 93456-7890',
    bancaryInfo: { accountNumber: '44444', agency: '3333', bank: '341', dv: '9' },
    pixInfo: { key: '11222333000144', key_type: 'CNPJ' },
  },
  {
    id: 5,
    name: 'Transporte Rápido Express LTDA',
    cnpj: '55667788000122',
    corporateName: 'Transporte Rápido Express LTDA',
    fantasyName: 'Rápido Express',
    serviceCategory: 'Transporte e Logística',
    serviceEvaluation: 3,
    commentEvaluation: '',
    active: true,
    email: 'logistica@rapidoexpress.com.br',
    telephone: '(31) 94567-8901',
    bancaryInfo: { accountNumber: '77777', agency: '5555', bank: '033', dv: '3' },
    pixInfo: { key: '55667788000122', key_type: 'CNPJ' },
  },
  {
    id: 6,
    name: 'Alimentos Naturais Brasil S.A.',
    cnpj: '33445566000177',
    corporateName: 'Alimentos Naturais Brasil S.A.',
    fantasyName: 'Naturais Brasil',
    serviceCategory: 'Alimentação',
    serviceEvaluation: 5,
    commentEvaluation: '',
    active: true,
    email: 'vendas@naturaisbrasil.com.br',
    telephone: '(31) 95678-9012',
    bancaryInfo: { accountNumber: '88888', agency: '1111', bank: '070', dv: '4' },
    pixInfo: { key: '33445566000177', key_type: 'CNPJ' },
  },
  {
    id: 7,
    name: 'Associação Comunitária Vida Nova',
    cnpj: '66777888000133',
    corporateName: 'Associação Comunitária Vida Nova',
    fantasyName: 'Vida Nova',
    serviceCategory: 'Assistência Social',
    serviceEvaluation: 5,
    commentEvaluation: '',
    active: true,
    email: 'contato@vidanova.org.br',
    telephone: '(31) 96789-0123',
    bancaryInfo: { accountNumber: '22222', agency: '3333', bank: '077', dv: '9' },
    pixInfo: { key: '66777888000133', key_type: 'CNPJ' },
  },
  {
    id: 8,
    name: 'Cooperativa Mão Amiga LTDA',
    cnpj: '22333444000155',
    corporateName: 'Cooperativa Mão Amiga LTDA',
    fantasyName: 'Mão Amiga',
    serviceCategory: 'Cooperativa',
    serviceEvaluation: 4,
    commentEvaluation: '',
    active: true,
    email: 'admin@maoamiga.coop.br',
    telephone: '(31) 97890-1234',
    bancaryInfo: { accountNumber: '33333', agency: '4444', bank: '756', dv: '7' },
    pixInfo: { key: '22333444000155', key_type: 'CNPJ' },
  },
]

const seedCollaborators: ICollaborator[] = [
  {
    id: 5,
    name: 'Ana Carolina Mendes',
    email: 'ana.mendes@email.com',
    occupationArea: 'Tecnologia',
    role: 'Analista de Dados',
    startOfContract: new Date('2024-01-15'),
    employmentRelationship: 'PJ',
    cpf: '12345678900',
    telephone: '(31) 98765-4321',
    active: true,
  },
  {
    id: 10,
    name: 'Bruno Henrique Oliveira',
    email: 'bruno.oliveira@email.com',
    occupationArea: 'Educação',
    role: 'Instrutor de Capacitação',
    startOfContract: new Date('2024-03-01'),
    employmentRelationship: 'PJ',
    cpf: '98765432100',
    telephone: '(31) 91234-5678',
    active: true,
  },
  {
    id: 14,
    name: 'Fernanda Lima Costa',
    email: 'fernanda.costa@email.com',
    occupationArea: 'Saúde',
    role: 'Assistente Social',
    startOfContract: new Date('2025-02-10'),
    employmentRelationship: 'CLT',
    cpf: '45612378900',
    telephone: '(31) 99876-5432',
    active: true,
  },
  {
    id: 15,
    name: 'Gabriel Souza Martins',
    email: 'gabriel.martins@email.com',
    occupationArea: 'Administração',
    role: 'Consultor de Processos',
    startOfContract: new Date('2025-06-01'),
    employmentRelationship: 'PJ',
    cpf: '78945612300',
    telephone: '(31) 93456-7890',
    active: true,
  },
]

function buildSeedContracts(): LocalContract[] {
  const now = new Date().toISOString()
  return [
    {
      id: 1,
      createdAt: '2026-01-15T10:30:00.000Z',
      updatedAt: now,
      contractType: ContractType.SUPPLIER,
      object:
        'Prestação de serviços de consultoria em TI e desenvolvimento de software customizado para o ERP institucional',
      totalValue: 15000000,
      contractPeriod: {
        start: new Date('2026-01-15T00:00:00.000Z'),
        end: new Date('2026-12-31T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 1,
        name: 'TechSoluções Consultoria LTDA',
        cnpj: '12.345.678/0001-99',
        serviceCategory: 'Tecnologia da Informação',
        fantasyName: 'TechSoluções',
        bancaryInfo: { accountNumber: '12345', agency: '0001', bank: '001', dv: '6' },
        pixInfo: { key: '12.345.678/0001-99', key_type: 'CNPJ' },
      },
      financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
      program: { id: 1, name: 'Programa de Modernização Administrativa' },
      collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
      budgetPlan: { id: 1, scenarioName: 'Orçamento Principal', year: 2026, version: 1 },
      contractStatus: ContractStatus.ONGOING,
      pixInfo: { key: '12.345.678/0001-99', key_type: 'CNPJ' },
      bancaryInfo: { accountNumber: '12345', agency: '0001', bank: '001', dv: '6' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2026-0001',
      observations:
        'Contrato prioritário para modernização do ERP. Reuniões de acompanhamento toda segunda-feira.',
      categorizacao: ["Avaliação", "Operacional"],
      centroDeCusto: ["RH", "Serviços Gerais"],
      pending: 0,
      children: [
        {
          id: 101,
          createdAt: '2026-03-01T09:00:00.000Z',
          updatedAt: now,
          contractType: ContractType.SUPPLIER,
          object: 'Aditivo 1 - Ampliação do escopo para incluir módulo de relatórios avançados',
          totalValue: 4500000,
          contractPeriod: {
            start: new Date('2026-03-01T00:00:00.000Z'),
            end: new Date('2027-03-31T00:00:00.000Z'),
          },
          contractModel: ContractModel.SERVICE,
          supplier: {
            id: 1,
            name: 'TechSoluções Consultoria LTDA',
            cnpj: '12.345.678/0001-99',
            serviceCategory: 'Tecnologia da Informação',
            fantasyName: 'TechSoluções',
            bancaryInfo: { accountNumber: '12345', agency: '0001', bank: '001', dv: '6' },
            pixInfo: { key: '12.345.678/0001-99', key_type: 'CNPJ' },
          },
          financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
          program: { id: 1, name: 'Programa de Modernização Administrativa' },
          collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
          budgetPlan: { id: 1, scenarioName: 'Orçamento Principal', year: 2026, version: 1 },
          contractStatus: ContractStatus.SIGNED,
          pixInfo: { key: '12.345.678/0001-99', key_type: 'CNPJ' },
          bancaryInfo: { accountNumber: '12345', agency: '0001', bank: '001', dv: '6' },
          files: [],
          currentFiles: [],
          payable: { id: 0 },
          receivable: { id: 0 },
          contractCode: 'CNT-2026-0001-A1',
          aditivoType: 'valor',
          aditivoStatus: 'Homologado',
          dataAssinatura: '01/03/2026',
          pending: 0,
        } as LocalContract,
      ],
    } as LocalContract,
    {
      id: 2,
      createdAt: '2026-03-10T08:15:00.000Z',
      updatedAt: now,
      contractType: ContractType.COLLABORATOR,
      object: 'Contrato de prestação de serviços do analista de dados para o programa PARC',
      totalValue: 9600000,
      contractPeriod: {
        start: new Date('2026-03-01T00:00:00.000Z'),
        end: new Date('2027-02-28T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 0,
        name: '',
        cnpj: '',
        serviceCategory: '',
        fantasyName: '',
        bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
        pixInfo: { key: null, key_type: null },
      },
      financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
      program: { id: 2, name: 'PARC - Programa de Atenção e Referência Comunitária' },
      collaborator: {
        id: 5,
        cpf: '123.456.789-00',
        name: 'Ana Carolina Mendes',
        email: 'ana.mendes@email.com',
        role: 'Analista de Dados',
      },
      budgetPlan: { id: 2, scenarioName: 'Orçamento PARC 2026', year: 2026, version: 1 },
      contractStatus: ContractStatus.PENDING,
      pixInfo: { key: '123.456.789-00', key_type: 'CPF' },
      bancaryInfo: { accountNumber: '54321', agency: '1234', bank: '104', dv: '7' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2026-0002',
      observations: 'Aguardando assinatura do termo de colaboração.',
      categorizacao: ["Processo"],
      centroDeCusto: ["Eventos"],
      pending: 3,
      children: null,
    } as LocalContract,
    {
      id: 3,
      createdAt: '2026-02-20T13:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.FINANCIER,
      object:
        'Termo de doação para execução do projeto de capacitação profissional no âmbito do programa EPV',
      totalValue: 50000000,
      contractPeriod: {
        start: new Date('2026-02-20T00:00:00.000Z'),
        end: new Date('2026-04-15T00:00:00.000Z'),
      },
      contractModel: ContractModel.DONATION,
      supplier: {
        id: 0,
        name: '',
        cnpj: '',
        serviceCategory: '',
        fantasyName: '',
        bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
        pixInfo: { key: null, key_type: null },
      },
      financier: {
        id: 3,
        name: 'Fundação Educar para o Futuro',
        cnpj: '98.765.432/0001-11',
        corporateName: 'Fundação Educar para o Futuro',
        address: 'Rua das Flores, 123',
        telephone: '(31) 99876-5432',
      },
      program: { id: 3, name: 'EPV - Escola de Profissões Vinculadas' },
      collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
      budgetPlan: { id: 3, scenarioName: 'Orçamento EPV 2026', year: 2026, version: 2 },
      contractStatus: ContractStatus.DISTRATO,
      pixInfo: { key: null, key_type: null },
      bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2026-0003',
      observations: 'Doação encerrada por distrato em 15/04/2026.',
      categorizacao: ["Avaliação"],
      centroDeCusto: ["Serviços Gerais"],
      pending: 0,
      withdrawalUrl: 'https://exemplo.com/distrato_0003.pdf',
      children: [
        {
          id: 301,
          createdAt: '2026-04-10T09:00:00.000Z',
          updatedAt: now,
          contractType: ContractType.FINANCIER,
          object: 'Distrato / Rescisão do termo de doação',
          totalValue: 0,
          contractPeriod: {
            start: new Date('2026-02-20T00:00:00.000Z'),
            end: new Date('2026-04-15T00:00:00.000Z'),
          },
          contractModel: ContractModel.DONATION,
          supplier: {
            id: 0,
            name: '',
            cnpj: '',
            serviceCategory: '',
            fantasyName: '',
            bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
            pixInfo: { key: null, key_type: null },
          },
          financier: {
            id: 3,
            name: 'Fundação Educar para o Futuro',
            cnpj: '98.765.432/0001-11',
            corporateName: 'Fundação Educar para o Futuro',
            address: 'Rua das Flores, 123',
            telephone: '(31) 99876-5432',
          },
          program: { id: 3, name: 'EPV - Escola de Profissões Vinculadas' },
          collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
          budgetPlan: { id: 3, scenarioName: 'Orçamento EPV 2026', year: 2026, version: 2 },
          contractStatus: ContractStatus.FINISHED,
          pixInfo: { key: null, key_type: null },
          bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
          files: [],
          currentFiles: [],
          payable: { id: 0 },
          receivable: { id: 0 },
          contractCode: 'CNT-2026-0003-A1',
          aditivoType: 'distrato',
          aditivoStatus: 'Homologado',
          dataAssinatura: '15/04/2026',
          pending: 0,
          withdrawalUrl: 'https://exemplo.com/distrato_0003.pdf',
          signedContractUrl: '',
        } as LocalContract,
      ],
    } as LocalContract,
    {
      id: 4,
      createdAt: '2025-01-10T08:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.SUPPLIER,
      object: 'Serviços de limpeza e conservação para a sede administrativa',
      totalValue: 3600000,
      contractPeriod: {
        start: new Date('2025-01-10T00:00:00.000Z'),
        end: new Date('2025-12-10T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 4,
        name: 'Limpar Tudo Serviços LTDA',
        cnpj: '11.222.333/0001-44',
        serviceCategory: 'Limpeza',
        fantasyName: 'Limpar Tudo',
        bancaryInfo: { accountNumber: '98765', agency: '4321', bank: '237', dv: '1' },
        pixInfo: { key: '11.222.333/0001-44', key_type: 'CNPJ' },
      },
      financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
      program: { id: 1, name: 'Programa de Modernização Administrativa' },
      collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
      budgetPlan: { id: 1, scenarioName: 'Orçamento Principal', year: 2025, version: 1 },
      contractStatus: ContractStatus.FINISHED,
      pixInfo: { key: '11.222.333/0001-44', key_type: 'CNPJ' },
      bancaryInfo: { accountNumber: '98765', agency: '4321', bank: '237', dv: '1' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2025-0004',
      observations: 'Contrato encerrado após término da vigência.',
      categorizacao: ["Operacional"],
      centroDeCusto: ["Serviços Gerais", "Eventos"],
      pending: 0,
      signedContractUrl: 'https://exemplo.com/contrato_0004_assinado.pdf',
      children: null,
    } as LocalContract,
    {
      id: 5,
      createdAt: '2026-04-01T09:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.SUPPLIER,
      object: 'Construção do novo almoxarifado central e reforma do estacionamento',
      totalValue: 280000000,
      contractPeriod: {
        start: new Date('2026-04-01T00:00:00.000Z'),
        end: new Date('2027-06-30T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 2,
        name: 'Construtora Horizonte S.A.',
        cnpj: '98.765.432/0001-88',
        serviceCategory: 'Construção Civil',
        fantasyName: 'Horizonte Construções',
        bancaryInfo: { accountNumber: '98765', agency: '4321', bank: '237', dv: '1' },
        pixInfo: { key: 'obra@horizonte.com.br', key_type: 'Email' },
      },
      financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
      program: { id: 4, name: 'Programa de Infraestrutura e Obras' },
      collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
      budgetPlan: { id: 4, scenarioName: 'Orçamento Infraestrutura', year: 2026, version: 1 },
      contractStatus: ContractStatus.PENDING,
      pixInfo: { key: 'obra@horizonte.com.br', key_type: 'Email' },
      bancaryInfo: { accountNumber: '98765', agency: '4321', bank: '237', dv: '1' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2026-0005',
      observations: 'Aguardando assinatura do contrato. Orçamento aprovado em março/2026.',
      categorizacao: ["Processo", "Operacional"],
      centroDeCusto: ["RH"],
      pending: 2,
      signedContractUrl: '',
      children: null,
    } as LocalContract,
    {
      id: 6,
      createdAt: '2026-01-20T10:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.SUPPLIER,
      object: 'Serviços de transporte e logística para distribuição de cestas básicas',
      totalValue: 7200000,
      contractPeriod: {
        start: new Date('2026-01-20T00:00:00.000Z'),
        end: new Date('2026-12-20T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 5,
        name: 'Transporte Rápido Express LTDA',
        cnpj: '55.667.788/0001-22',
        serviceCategory: 'Transporte e Logística',
        fantasyName: 'Rápido Express',
        bancaryInfo: { accountNumber: '77777', agency: '5555', bank: '033', dv: '3' },
        pixInfo: { key: '55.667.788/0001-22', key_type: 'CNPJ' },
      },
      financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
      program: { id: 5, name: 'Programa de Alimentação e Nutrição' },
      collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
      budgetPlan: { id: 5, scenarioName: 'Orçamento Alimentação', year: 2026, version: 1 },
      contractStatus: ContractStatus.ONGOING,
      pixInfo: { key: '55.667.788/0001-22', key_type: 'CNPJ' },
      bancaryInfo: { accountNumber: '77777', agency: '5555', bank: '033', dv: '3' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2026-0006',
      observations: 'Aditivo de prazo homologado em abril. Serviço em execução.',
      categorizacao: ["Avaliação", "Processo"],
      centroDeCusto: ["Eventos"],
      pending: 0,
      signedContractUrl: 'https://exemplo.com/contrato_0006_assinado.pdf',
      children: [
        {
          id: 601,
          createdAt: '2026-04-10T08:00:00.000Z',
          updatedAt: now,
          contractType: ContractType.SUPPLIER,
          object: 'Aditivo 1 - Prorrogação de prazo por mais 6 meses',
          totalValue: 0,
          contractPeriod: {
            start: new Date('2026-01-20T00:00:00.000Z'),
            end: new Date('2027-06-20T00:00:00.000Z'),
          },
          contractModel: ContractModel.SERVICE,
          supplier: {
            id: 5,
            name: 'Transporte Rápido Express LTDA',
            cnpj: '55.667.788/0001-22',
            serviceCategory: 'Transporte e Logística',
            fantasyName: 'Rápido Express',
            bancaryInfo: { accountNumber: '77777', agency: '5555', bank: '033', dv: '3' },
            pixInfo: { key: '55.667.788/0001-22', key_type: 'CNPJ' },
          },
          financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
          program: { id: 5, name: 'Programa de Alimentação e Nutrição' },
          collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
          budgetPlan: { id: 5, scenarioName: 'Orçamento Alimentação', year: 2026, version: 1 },
          contractStatus: ContractStatus.SIGNED,
          pixInfo: { key: '55.667.788/0001-22', key_type: 'CNPJ' },
          bancaryInfo: { accountNumber: '77777', agency: '5555', bank: '033', dv: '3' },
          files: [],
          currentFiles: [],
          payable: { id: 0 },
          receivable: { id: 0 },
          contractCode: 'CNT-2026-0006-A1',
          aditivoType: 'prazo',
          aditivoStatus: 'Homologado',
          dataAssinatura: '10/04/2026',
          pending: 0,
        } as LocalContract,
        {
          id: 602,
          createdAt: '2026-05-05T14:00:00.000Z',
          updatedAt: now,
          contractType: ContractType.SUPPLIER,
          object: 'Aditivo 2 - Acréscimo de valor para nova rota de entrega',
          totalValue: 1800000,
          contractPeriod: {
            start: new Date('2026-01-20T00:00:00.000Z'),
            end: new Date('2027-06-20T00:00:00.000Z'),
          },
          contractModel: ContractModel.SERVICE,
          supplier: {
            id: 5,
            name: 'Transporte Rápido Express LTDA',
            cnpj: '55.667.788/0001-22',
            serviceCategory: 'Transporte e Logística',
            fantasyName: 'Rápido Express',
            bancaryInfo: { accountNumber: '77777', agency: '5555', bank: '033', dv: '3' },
            pixInfo: { key: '55.667.788/0001-22', key_type: 'CNPJ' },
          },
          financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
          program: { id: 5, name: 'Programa de Alimentação e Nutrição' },
          collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
          budgetPlan: { id: 5, scenarioName: 'Orçamento Alimentação', year: 2026, version: 1 },
          contractStatus: ContractStatus.SIGNED,
          pixInfo: { key: '55.667.788/0001-22', key_type: 'CNPJ' },
          bancaryInfo: { accountNumber: '77777', agency: '5555', bank: '033', dv: '3' },
          files: [],
          currentFiles: [],
          payable: { id: 0 },
          receivable: { id: 0 },
          contractCode: 'CNT-2026-0006-A2',
          aditivoType: 'valor',
          aditivoStatus: 'Homologado',
          dataAssinatura: '05/05/2026',
          pending: 0,
        } as LocalContract,
      ],
    } as LocalContract,
    {
      id: 7,
      createdAt: '2026-05-01T08:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.FINANCIER,
      object: 'Doação de alimentos orgânicos para os centros comunitários',
      totalValue: 15000000,
      contractPeriod: {
        start: new Date('2026-05-01T00:00:00.000Z'),
        end: new Date('2026-11-30T00:00:00.000Z'),
      },
      contractModel: ContractModel.DONATION,
      supplier: {
        id: 0,
        name: '',
        cnpj: '',
        serviceCategory: '',
        fantasyName: '',
        bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
        pixInfo: { key: null, key_type: null },
      },
      financier: {
        id: 6,
        name: 'Alimentos Naturais Brasil S.A.',
        cnpj: '33.445.566/0001-77',
        corporateName: 'Alimentos Naturais Brasil S.A.',
        address: 'Setor Comercial Sul, Quadra 5, Brasília - DF',
        telephone: '(61) 98888-7777',
      },
      program: { id: 5, name: 'Programa de Alimentação e Nutrição' },
      collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
      budgetPlan: { id: 5, scenarioName: 'Orçamento Alimentação', year: 2026, version: 1 },
      contractStatus: ContractStatus.ONGOING,
      pixInfo: { key: null, key_type: null },
      bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2026-0007',
      observations: 'Doação em andamento. Entregas mensais previstas.',
      categorizacao: ["Operacional"],
      centroDeCusto: ["Serviços Gerais"],
      pending: 0,
      signedContractUrl: 'https://exemplo.com/contrato_0007_assinado.pdf',
      children: null,
    } as LocalContract,
    {
      id: 8,
      createdAt: '2025-06-01T10:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.SUPPLIER,
      object: 'Fornecimento de equipamentos de informática para laboratórios',
      totalValue: 8500000,
      contractPeriod: {
        start: new Date('2025-06-01T00:00:00.000Z'),
        end: new Date('2025-12-01T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 1,
        name: 'TechSoluções Consultoria LTDA',
        cnpj: '12.345.678/0001-99',
        serviceCategory: 'Tecnologia da Informação',
        fantasyName: 'TechSoluções',
        bancaryInfo: { accountNumber: '12345', agency: '0001', bank: '001', dv: '6' },
        pixInfo: { key: '12.345.678/0001-99', key_type: 'CNPJ' },
      },
      financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
      program: { id: 1, name: 'Programa de Modernização Administrativa' },
      collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
      budgetPlan: { id: 1, scenarioName: 'Orçamento Principal', year: 2025, version: 1 },
      contractStatus: ContractStatus.FINISHED,
      pixInfo: { key: '12.345.678/0001-99', key_type: 'CNPJ' },
      bancaryInfo: { accountNumber: '12345', agency: '0001', bank: '001', dv: '6' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2025-0008',
      observations: 'Contrato encerrado. Equipamentos entregues e instalados.',
      categorizacao: ["Avaliação"],
      centroDeCusto: ["RH", "Eventos"],
      pending: 0,
      signedContractUrl: 'https://exemplo.com/contrato_0008_assinado.pdf',
      children: [
        {
          id: 801,
          createdAt: '2025-09-15T09:00:00.000Z',
          updatedAt: now,
          contractType: ContractType.SUPPLIER,
          object: 'Aditivo 1 - Acréscimo de 10 notebooks adicionais',
          totalValue: 2500000,
          contractPeriod: {
            start: new Date('2025-06-01T00:00:00.000Z'),
            end: new Date('2025-12-01T00:00:00.000Z'),
          },
          contractModel: ContractModel.SERVICE,
          supplier: {
            id: 1,
            name: 'TechSoluções Consultoria LTDA',
            cnpj: '12.345.678/0001-99',
            serviceCategory: 'Tecnologia da Informação',
            fantasyName: 'TechSoluções',
            bancaryInfo: { accountNumber: '12345', agency: '0001', bank: '001', dv: '6' },
            pixInfo: { key: '12.345.678/0001-99', key_type: 'CNPJ' },
          },
          financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
          program: { id: 1, name: 'Programa de Modernização Administrativa' },
          collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
          budgetPlan: { id: 1, scenarioName: 'Orçamento Principal', year: 2025, version: 1 },
          contractStatus: ContractStatus.SIGNED,
          pixInfo: { key: '12.345.678/0001-99', key_type: 'CNPJ' },
          bancaryInfo: { accountNumber: '12345', agency: '0001', bank: '001', dv: '6' },
          files: [],
          currentFiles: [],
          payable: { id: 0 },
          receivable: { id: 0 },
          contractCode: 'CNT-2025-0008-A1',
          aditivoType: 'valor',
          aditivoStatus: 'Homologado',
          dataAssinatura: '15/09/2025',
          pending: 0,
        } as LocalContract,
      ],
    } as LocalContract,
    {
      id: 9,
      createdAt: '2026-06-01T09:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.ACT,
      object: 'Acordo de Cooperação Técnica para execução conjunta do projeto de inclusão digital',
      totalValue: 12000000,
      contractPeriod: {
        start: new Date('2026-06-01T00:00:00.000Z'),
        end: new Date('2027-05-31T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 6,
        name: 'Associação Comunitária Vida Nova',
        cnpj: '66.777.888/0001-33',
        serviceCategory: 'Assistência Social',
        fantasyName: 'Vida Nova',
        bancaryInfo: { accountNumber: '22222', agency: '3333', bank: '077', dv: '9' },
        pixInfo: { key: '66.777.888/0001-33', key_type: 'CNPJ' },
      },
      financier: { id: 0, name: '', cnpj: '', corporateName: '', address: '', telephone: '' },
      program: { id: 2, name: 'PARC - Programa de Atenção e Referência Comunitária' },
      collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
      budgetPlan: { id: 2, scenarioName: 'Orçamento PARC 2026', year: 2026, version: 1 },
      contractStatus: ContractStatus.ONGOING,
      pixInfo: { key: '66.777.888/0001-33', key_type: 'CNPJ' },
      bancaryInfo: { accountNumber: '22222', agency: '3333', bank: '077', dv: '9' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2026-0009',
      observations: 'ACT firmado com a Associação Vida Nova para execução conjunta de atividades de inclusão digital.',
      categorizacao: ['Operacional'],
      centroDeCusto: ['RH', 'Eventos'],
      pending: 0,
      signedContractUrl: 'https://exemplo.com/act_0009_assinado.pdf',
      children: null,
    } as LocalContract,
    {
      id: 10,
      createdAt: '2025-08-01T10:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.COLLABORATOR,
      object:
        'Prestação de serviços técnicos em análise de dados e business intelligence para a diretoria de operações',
      totalValue: 2400000,
      contractPeriod: {
        start: new Date('2025-08-01T00:00:00.000Z'),
        end: new Date('2026-07-31T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 0,
        name: '',
        cnpj: '',
        serviceCategory: '',
        fantasyName: '',
        bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
        pixInfo: { key: null, key_type: null },
      },
      financier: {
        id: 0,
        name: '',
        cnpj: '',
        corporateName: '',
        address: '',
        telephone: '',
      },
      program: { id: 5, name: 'Projetos Estratégicos' },
      collaborator: {
        id: 14,
        name: 'Fernanda Lima Costa',
        cpf: '456.123.789-00',
        email: 'fernanda.costa@email.com',
        role: 'Assistente Social',
      },
      budgetPlan: { id: 5, scenarioName: 'Orçamento Projetos 2025', year: 2025, version: 1 },
      contractStatus: ContractStatus.ONGOING,
      pixInfo: { key: '456.123.789-00', key_type: 'CPF' },
      bancaryInfo: { accountNumber: '77777', agency: '5555', bank: '237', dv: '3' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2025-0010',
      observations: 'Contrato de colaboração para projeto de análise de dados sociais.',
      categorizacao: ['Avaliação'],
      centroDeCusto: ['Serviços Gerais'],
      pending: 0,
      children: null,
    } as LocalContract,
    {
      id: 11,
      createdAt: '2025-09-15T14:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.COLLABORATOR,
      object:
        'Consultoria especializada em mapeamento de processos administrativos e otimização de fluxos de trabalho',
      totalValue: 1800000,
      contractPeriod: {
        start: new Date('2025-09-15T00:00:00.000Z'),
        end: new Date('2025-12-15T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 0,
        name: '',
        cnpj: '',
        serviceCategory: '',
        fantasyName: '',
        bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
        pixInfo: { key: null, key_type: null },
      },
      financier: {
        id: 0,
        name: '',
        cnpj: '',
        corporateName: '',
        address: '',
        telephone: '',
      },
      program: { id: 6, name: 'Melhoria Contínua' },
      collaborator: {
        id: 15,
        name: 'Gabriel Souza Martins',
        cpf: '789.456.123-00',
        email: 'gabriel.martins@email.com',
        role: 'Consultor de Processos',
      },
      budgetPlan: { id: 6, scenarioName: 'Orçamento Melhoria 2025', year: 2025, version: 1 },
      contractStatus: ContractStatus.ONGOING,
      pixInfo: { key: '789.456.123-00', key_type: 'CPF' },
      bancaryInfo: { accountNumber: '99999', agency: '6666', bank: '341', dv: '1' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2025-0011',
      observations: 'Consultoria de processos administrativos em andamento.',
      categorizacao: ['Processo'],
      centroDeCusto: ['RH'],
      pending: 0,
      children: null,
    } as LocalContract,
    {
      id: 12,
      createdAt: '2025-05-10T09:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.ACT,
      object:
        'Termo de Cooperação Técnica para execução conjunta do projeto de educação ambiental em comunidades rurais',
      totalValue: 1500000,
      contractPeriod: {
        start: new Date('2025-05-10T00:00:00.000Z'),
        end: new Date('2025-11-10T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 8,
        name: 'Cooperativa Mão Amiga LTDA',
        cnpj: '22.333.444/0001-55',
        serviceCategory: 'Cooperativa',
        fantasyName: 'Mão Amiga',
        bancaryInfo: { accountNumber: '33333', agency: '4444', bank: '756', dv: '7' },
        pixInfo: { key: '22333444000155', key_type: 'CNPJ' },
      },
      financier: {
        id: 0,
        name: '',
        cnpj: '',
        corporateName: '',
        address: '',
        telephone: '',
      },
      program: { id: 7, name: 'Educação Ambiental' },
      collaborator: { id: 0, cpf: '', name: '', email: '', role: '' },
      budgetPlan: { id: 7, scenarioName: 'Orçamento Educação Ambiental 2025', year: 2025, version: 1 },
      contractStatus: ContractStatus.ONGOING,
      pixInfo: { key: '22333444000155', key_type: 'CNPJ' },
      bancaryInfo: { accountNumber: '33333', agency: '4444', bank: '756', dv: '7' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2025-0012',
      observations: 'ACT (PJ) com a Cooperativa Mão Amiga para projetos de educação ambiental.',
      categorizacao: ['Avaliação'],
      centroDeCusto: ['Eventos'],
      pending: 0,
      children: null,
    } as LocalContract,
    {
      id: 13,
      createdAt: '2026-01-05T11:00:00.000Z',
      updatedAt: now,
      contractType: ContractType.ACT,
      object:
        'Termo de Cooperação para prestação de serviços de consultoria em inclusão digital por profissional autônomo',
      totalValue: 800000,
      contractPeriod: {
        start: new Date('2026-01-05T00:00:00.000Z'),
        end: new Date('2026-06-05T00:00:00.000Z'),
      },
      contractModel: ContractModel.SERVICE,
      supplier: {
        id: 0,
        name: '',
        cnpj: '',
        serviceCategory: '',
        fantasyName: '',
        bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
        pixInfo: { key: null, key_type: null },
      },
      financier: {
        id: 0,
        name: '',
        cnpj: '',
        corporateName: '',
        address: '',
        telephone: '',
      },
      program: { id: 8, name: 'Inclusão Digital' },
      collaborator: {
        id: 15,
        name: 'Gabriel Souza Martins',
        cpf: '789.456.123-00',
        email: 'gabriel.martins@email.com',
        role: 'Consultor de Processos',
      },
      budgetPlan: { id: 8, scenarioName: 'Orçamento Inclusão Digital 2026', year: 2026, version: 1 },
      contractStatus: ContractStatus.ONGOING,
      pixInfo: { key: '789.456.123-00', key_type: 'CPF' },
      bancaryInfo: { accountNumber: '99999', agency: '6666', bank: '341', dv: '1' },
      files: [],
      currentFiles: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      contractCode: 'CNT-2026-0013',
      observations: 'ACT (PF) com Gabriel Souza Martins para consultoria em inclusão digital.',
      categorizacao: ['Avaliação'],
      centroDeCusto: ['RH'],
      pending: 0,
      children: null,
    } as LocalContract,
  ]
}

/* ═════════════════════════════════════
   SEED
   ═════════════════════════════════════ */

export function seedLocalDb() {
  if (typeof window === 'undefined') return

  const existingContracts = read<LocalContract[]>(KEYS.contracts, [])
  if (existingContracts.length === 0) {
    write(KEYS.contracts, buildSeedContracts())
  }

  const existingSuppliers = read<ISupplier[]>(KEYS.suppliers, [])
  if (existingSuppliers.length === 0) {
    write(KEYS.suppliers, seedSuppliers)
  }

  const existingCollaborators = read<ICollaborator[]>(KEYS.collaborators, [])
  if (existingCollaborators.length === 0) {
    write(KEYS.collaborators, seedCollaborators)
  }

  // Garante que o contador de sequência respeite os contratos já existentes
  // (inclui CNT legado, CT e OS)
  const allContracts = read<LocalContract[]>(KEYS.contracts, [])
  const ctSeqMap = read<Record<string, number>>(KEYS.nextContractSeq, {})
  const osSeqMap = read<Record<string, number>>(KEYS.nextServiceOrderSeq, {})
  allContracts.forEach((c) => {
    const ctMatch = c.contractCode.match(/(?:CT|CNT)-(\d{4})-(\d{4})/)
    if (ctMatch) {
      const year = ctMatch[1]
      const num = parseInt(ctMatch[2], 10)
      ctSeqMap[year] = Math.max(ctSeqMap[year] ?? 0, num)
    }
    const osMatch = c.contractCode.match(/OS-(\d{4})-(\d{4})/)
    if (osMatch) {
      const year = osMatch[1]
      const num = parseInt(osMatch[2], 10)
      osSeqMap[year] = Math.max(osSeqMap[year] ?? 0, num)
    }
  })
  write(KEYS.nextContractSeq, ctSeqMap)
  write(KEYS.nextServiceOrderSeq, osSeqMap)
}

/* ═════════════════════════════════════
   CONTRACTS
   ═════════════════════════════════════ */

export function localDbGetContracts(): LocalContract[] {
  return read<LocalContract[]>(KEYS.contracts, [])
}

export function localDbGetContractById(id: number): LocalContract | undefined {
  return localDbGetContracts().find((c) => c.id === id)
}

function getProgramMock(id: number) {
  const programs: Record<number, { id: number; name: string }> = {
    1: { id: 1, name: 'Programa de Modernização Administrativa' },
    2: { id: 2, name: 'PARC - Programa de Atenção e Referência Comunitária' },
    3: { id: 3, name: 'EPV - Escola de Profissões Vinculadas' },
    4: { id: 4, name: 'Programa de Infraestrutura e Obras' },
    5: { id: 5, name: 'Programa de Alimentação e Nutrição' },
  }
  return programs[id] ?? { id, name: `Programa ${id}` }
}

export function localDbGetProgramOptions(): Options[] {
  return [
    { id: 1, name: 'PARC' },
    { id: 2, name: 'ECC' },
    { id: 3, name: 'JCD' },
  ]
}

function getBudgetPlanMock(id: number) {
  const year = new Date().getFullYear()
  const plans: Record<number, { id: number; scenarioName: string; year: number; version: number }> = {
    1: { id: 1, scenarioName: 'Orçamento Principal', year, version: 1 },
    2: { id: 2, scenarioName: 'Orçamento PARC 2026', year: 2026, version: 1 },
    3: { id: 3, scenarioName: 'Orçamento EPV 2026', year: 2026, version: 2 },
    4: { id: 4, scenarioName: 'Orçamento Infraestrutura', year, version: 1 },
    5: { id: 5, scenarioName: 'Orçamento Alimentação', year, version: 1 },
  }
  return plans[id] ?? { id, scenarioName: `Orçamento ${id}`, year, version: 1 }
}

export function localDbGetBudgetPlanOptions(): Options[] {
  return [
    { id: 1, name: 'teste 1', parentId: 1 },
    { id: 2, name: 'teste 2', parentId: 1 },
    { id: 3, name: 'teste 1', parentId: 2 },
    { id: 4, name: 'teste 2', parentId: 2 },
    { id: 5, name: 'teste 1', parentId: 3 },
    { id: 6, name: 'teste 2', parentId: 3 },
  ]
}

function enrichContractPayload(payload: any): Partial<LocalContract> {
  const enriched: any = { ...payload }

  // Fornecedor
  if (payload.supplierId && !payload.supplier) {
    const supplier = localDbGetSupplierById(Number(payload.supplierId))
    if (supplier) {
      enriched.supplier = {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email ?? '',
        telephone: supplier.telephone ?? '',
        cnpj: supplier.cnpj,
        serviceCategory: supplier.serviceCategory,
        fantasyName: supplier.fantasyName,
        bancaryInfo: supplier.bancaryInfo ?? { accountNumber: null, agency: null, bank: null, dv: null },
        pixInfo: supplier.pixInfo ?? { key: null, key_type: null },
      }
    }
  }

  // Financiador
  if (payload.financierId && !payload.financier) {
    const financierId = Number(payload.financierId)
    enriched.financier = {
      id: financierId,
      name: `Financiador ${financierId}`,
      cnpj: '',
      corporateName: '',
      address: '',
      telephone: '',
    }
  }

  // Colaborador
  if (payload.collaboratorId && !payload.collaborator) {
    const collabId = Number(payload.collaboratorId)
    enriched.collaborator = {
      id: collabId,
      name: `Colaborador ${collabId}`,
      cpf: '',
      email: '',
      telephone: '',
      role: '',
    }
  }

  // Programa
  if (payload.programId && !payload.program) {
    enriched.program = getProgramMock(Number(payload.programId))
  }

  // Budget Plan
  if (payload.budgetPlanId && !payload.budgetPlan) {
    enriched.budgetPlan = getBudgetPlanMock(Number(payload.budgetPlanId))
  }

  // Dados bancários / PIX no nível do contrato
  if (!payload.pixInfo && enriched.supplier?.pixInfo) {
    enriched.pixInfo = enriched.supplier.pixInfo
  }
  if (!payload.bancaryInfo && enriched.supplier?.bancaryInfo) {
    enriched.bancaryInfo = enriched.supplier.bancaryInfo
  }

  return enriched
}

export function localDbSaveContract(payload: Partial<LocalContract>): LocalContract {
  // Debug removido — dados persistidos com sucesso
  const contracts = localDbGetContracts()
  const enriched = enrichContractPayload(payload)
  const year = enriched.contractPeriod
    ? new Date(enriched.contractPeriod.start as unknown as string).getFullYear()
    : new Date().getFullYear()
  const classification = enriched.classification ?? ContractClassification.CONTRACT
  const seq = getNextSeq(year, classification)

  const newContract: LocalContract = {
    ...(enriched as LocalContract),
    id: Date.now() + Math.floor(Math.random() * 1000),
    contractCode: generateContractCode(year, seq, classification),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contractStatus: enriched.contractStatus ?? ContractStatus.PENDING,
    children: enriched.children ?? null,
    files: enriched.files ?? [],
    currentFiles: enriched.currentFiles ?? [],
    observations: enriched.observations ?? '',
    withdrawalUrl: enriched.withdrawalUrl ?? '',
    settleTermUrl: enriched.settleTermUrl ?? '',
    signedContractUrl: enriched.signedContractUrl ?? '',
    dataAssinatura: enriched.dataAssinatura ?? '',
    pending: enriched.pending ?? 0,
    paidValue: enriched.paidValue ?? 0,
  }

  contracts.push(newContract)
  write(KEYS.contracts, contracts)
  return newContract
}

export function localDbUpdateContract(
  id: number,
  payload: Partial<LocalContract>,
): LocalContract | undefined {
  const contracts = localDbGetContracts()
  const idx = contracts.findIndex((c) => c.id === id)
  if (idx === -1) return undefined

  contracts[idx] = {
    ...contracts[idx],
    ...payload,
    updatedAt: new Date().toISOString(),
  }
  write(KEYS.contracts, contracts)
  return contracts[idx]
}

export function localDbDeleteContract(id: number): boolean {
  const contracts = localDbGetContracts()
  const filtered = contracts.filter((c) => c.id !== id)
  if (filtered.length === contracts.length) return false
  write(KEYS.contracts, filtered)
  return true
}

export function localDbAddAditive(
  parentId: number,
  payload: Partial<LocalContract>,
): LocalContract | undefined {
  const contracts = localDbGetContracts()
  const parentIdx = contracts.findIndex((c) => c.id === parentId)
  if (parentIdx === -1) return undefined

  const parent = contracts[parentIdx]
  const siblings = parent.children ?? []
  const seq = siblings.length + 1
  const yearMatch = parent.contractCode.match(/(?:CT|OS|CNT)-(\d{4})-/)
  const year = yearMatch ? yearMatch[1] : String(new Date().getFullYear())

  const aditive: LocalContract = {
    ...(payload as LocalContract),
    id: Date.now() + Math.floor(Math.random() * 1000),
    parentId,
    contractCode: `${parent.contractCode}-A${seq}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: null,
    files: payload.files ?? [],
    currentFiles: payload.currentFiles ?? [],
    pending: payload.pending ?? 0,
    paidValue: payload.paidValue ?? 0,
  }

  siblings.push(aditive)
  parent.children = siblings
  parent.updatedAt = new Date().toISOString()

  write(KEYS.contracts, contracts)
  return aditive
}

/* ═════════════════════════════════════
   SUPPLIERS
   ═════════════════════════════════════ */

export function localDbGetSuppliers(): ISupplier[] {
  return read<ISupplier[]>(KEYS.suppliers, [])
}

export function localDbGetSupplierOptions(): Options[] {
  return localDbGetSuppliers().map((s) => ({
    id: s.id,
    name: `${s.name} - ${s.cnpj}`,
  }))
}

export function localDbGetSupplierByCNPJ(cnpjRaw: string): ISupplier | undefined {
  const clean = cnpjRaw.replace(/\D/g, '')
  return localDbGetSuppliers().find((s) => s.cnpj.replace(/\D/g, '') === clean)
}

export function localDbGetSupplierById(id: number): ISupplier | undefined {
  return localDbGetSuppliers().find((s) => s.id === id)
}

/* ═════════════════════════════════════
   FINANCIERS
   ═════════════════════════════════════ */

export function localDbGetFinancierOptions(): Options[] {
  return [
    { id: 3, name: 'Fundação Educar para o Futuro - 98.765.432/0001-11' },
    { id: 6, name: 'Alimentos Naturais Brasil S.A. - 33.445.566/0001-77' },
    { id: 7, name: 'Instituto Desenvolvimento Social - 11.222.333/0001-44' },
    { id: 8, name: 'Banco Comunitário Horizonte - 55.666.777/0001-88' },
    { id: 9, name: 'Fundo de Investimento Cultural - 22.333.444/0001-55' },
  ]
}

/* ═════════════════════════════════════
   COLLABORATORS
   ═════════════════════════════════════ */

export function localDbGetCollaborators(): ICollaborator[] {
  return read<ICollaborator[]>(KEYS.collaborators, [])
}

export function localDbGetCollaboratorOptions(): Options[] {
  return localDbGetCollaborators().map((c) => ({
    id: c.id,
    name: `${c.name} - ${c.cpf}`,
  }))
}

export function localDbGetCollaboratorByCPF(cpfRaw: string): ICollaborator | undefined {
  const clean = cpfRaw.replace(/\D/g, '')
  return localDbGetCollaborators().find((c) => c.cpf.replace(/\D/g, '') === clean)
}

export function localDbGetCollaboratorById(id: number): ICollaborator | undefined {
  return localDbGetCollaborators().find((c) => c.id === id)
}

/* ═════════════════════════════════════
   UTILS
   ═════════════════════════════════════ */

export function localDbReset() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEYS.contracts)
  localStorage.removeItem(KEYS.suppliers)
  localStorage.removeItem(KEYS.nextContractSeq)
  seedLocalDb()
}

export function localDbClear() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEYS.contracts)
  localStorage.removeItem(KEYS.suppliers)
  localStorage.removeItem(KEYS.nextContractSeq)
}
