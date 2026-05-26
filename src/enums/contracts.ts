export enum ContractType {
  SUPPLIER = 'Fornecedor',
  FINANCIER = 'Financiador',
  COLLABORATOR = 'Colaborador',
  ACT = 'ACT',
}

export enum ContractModel {
  SERVICE = 'Serviço',
  DONATION = 'Doação',
}

export enum ContractStatus {
  RASCUNHO = 'Rascunho',
  PENDING = 'Pendente',
  SIGNED = 'Assinado',
  ONGOING = 'Em andamento',
  FINISHED = 'Finalizado',
  DISTRATO = 'Distrato',
}

export enum AditivoStatus {
  RASCUNHO = 'Rascunho',
  PENDENTE = 'Pendente',
  HOMOLOGADO = 'Homologado',
}

export enum TranslatedFields {
  object = 'objeto',
  identifierCode = 'código identificador',
  contractType = 'tipo',
  contractModel = 'modelo',
  contractStatus = 'status',
  financier = 'financiador',
  supplier = 'fornecedor',
  collaborator = 'colaborador',
  bancaryInfo = 'informações bancárias',
  pixInfo = 'dados PIX',
  contractPeriod = 'periodo',
  program = 'programa',
  totalValue = 'valor',
}
