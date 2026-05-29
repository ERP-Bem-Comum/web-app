export enum ReceivableType {
  CONTRACT = 'CONTRATO',
  DONATION = 'DOAÇÃO',
  DISTRATO = 'DISTRATO',
  TERMO = 'TERMO DE QUITAÇÃO',
}
export enum ReceiptMethod {
  TED = 'TED',
  DOC = 'DOC',
  PIX = 'PIX',
  BILL = 'BOLETO',
}

export enum DOCType {
  NF = 'NOTA FISCAL',
  FATURA = 'FATURA',
  RECIBO = 'RECIBO',
  RPA = 'RPA',
  BOLETO = 'BOLETO BANCÁRIO',
  REEMBOLSO = 'REEMBOLSO',
  OS = 'ORDEM DE SERVIÇO',
  PEDIDO = 'PEDIDO DE COMPRA',
  OUTROS = 'OUTROS',
}

export enum RecurrenceType {
  MONTHLY = 'MENSAL',
  BIMONTLY = 'BIMESTRAL',
  QUARTERLY = 'TRIMESTRAL',
  BIANNUAL = 'SEMESTRAL',
  ANNUALLY = 'ANUAL',
}

export enum ReceivableStatus {
  PENDING = 'PENDENTE',
  APPROVED = 'APROVADO',
  RECEIVED = 'RECEBIDO',
  DUE = 'ATRASADO',
  CONCLUDED = 'CONCLUIDO',
}
