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
  | 'invalid-pdf'            // arquivo não é PDF assinado válido (magic bytes %PDF)
  | 'file-too-large'         // documento acima do limite (20 MiB)
  | 'invalid-signed-at'      // data de assinatura ausente/inválida/futura
  | 'no-signed-document'     // ativar sem documento assinado anexado
  | 'document-conflict'      // documento já anexado/substituído/removido ou de outro contrato
  | 'storage-unavailable'    // backend de objetos (MinIO/S3) indisponível
