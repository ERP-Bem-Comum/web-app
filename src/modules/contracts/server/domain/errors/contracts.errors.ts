/**
 * ContractsError — união discriminada de falhas do domínio de contratos.
 * FONTE ÚNICA (A2): definida em ../contracts.types.ts; aqui só reexportamos para manter o ponto de
 * import semântico (errors/) sem duplicar a união. Mapeada para tags i18n na borda do client.
 */
export type { ContractsError } from '../contracts.types.ts'
