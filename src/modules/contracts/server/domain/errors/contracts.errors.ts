/**
 * ContractsError — união discriminada de falhas do domínio de contratos.
 * Mapeada para tags i18n na borda do client.
 */
export type ContractsError =
  | 'invalid-code'           // código/sequentialNumber inválido
  | 'invalid-value'          // valor <= 0 ou teto de OS excedido
  | 'invalid-period'         // período de vigência inválido
  | 'missing-contractor'     // contratante obrigatório não informado
  | 'contract-not-found'     // 404
  | 'amendment-not-found'    // 404 aditivo
  | 'invalid-amendment-type' // tipo de aditivo inválido
  | 'connectivity'           // backend fora / timeout
  | 'server'                 // 5xx / inesperado
  | 'unauthorized'           // 401 / 403
  | 'not-implemented'        // operação ainda não existe no core-api (sem rota)
