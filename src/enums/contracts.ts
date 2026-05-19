export enum ContractType {
  SUPPLIER = 'Fornecedor',
  FINANCIER = 'Financiador',
  COLLABORATOR = 'Colaborador',
}

export enum ContractModel {
  SERVICE = 'Serviço',
  DONATION = 'Doação',
}

export enum ContractStatus {
  PENDING = 'Pendente',
  SIGNED = 'Assinado',
  ONGOING = 'Em andamento',
  FINISHED = 'Finalizado',
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
  agreement = 'acordo',
  totalValue = 'valor',
}
