/**
 * coreApiBase — monta a base de um recurso do core-api para a versão dada. FONTE ÚNICA da derivação de
 * versão (antes duplicada como `derive{Partners,Programs,Users}Base` em cada composition).
 *
 * ADR-0033 (Strangler Fig na URL): `/api/v1` = recursos que ESPELHAM o legado (contrato congelado);
 * `/api/v2` = recursos do MODELO NOVO. Ambos coexistem sob a MESMA base URL. O versionamento é POR
 * RECURSO → cada composition declara sua versão explicitamente (`coreApiBase(env.CORE_API_URL, 'v1' | 'v2')`).
 *
 * Tolerante por design: o `CORE_API_URL` pode vir SEM versão (convenção nova: `…/api`) ou COM um sufixo
 * de versão legado (`…/api/v2`) — em ambos os casos normaliza para a base sem versão e anexa a versão
 * pedida. Assim a migração da convenção do env não quebra nenhum ambiente. Server-only (lido via env).
 */
export type CoreApiVersion = 'v1' | 'v2'

export const coreApiBase = (coreApiUrl: string, version: CoreApiVersion): string => {
  // 1) remove barra(s) final(is); 2) remove um sufixo de versão `/v1`|`/v2` se presente (compat).
  const base = coreApiUrl.replace(/\/+$/, '').replace(/\/v[12]$/, '')
  return `${base}/${version}`
}
