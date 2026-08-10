/**
 * TeamMember — model do client p/ o relatório "Equipe ABC" (GET /reports/team, #114). Espelha o
 * `TeamMember` do server (`reports.io.ts`): o BFF entrega a resposta completa; o client só consome
 * (server-state). LGPD-safe (9 colunas; sem idade/gênero/raça-cor). Arquivo NEUTRO da camada `client/data`
 * (boundary §I). `program`/`education`/`experienceInPublicSector` são nullable.
 */
export type TeamMember = Readonly<{
  id: string
  name: string
  program: string | null
  role: string
  employmentRelationship: string
  startOfContract: string
  registrationStatus: string
  active: boolean
  education: string | null
  experienceInPublicSector: boolean | null
  /** Códigos canônicos do domínio de Colaboradores ('MULHER_CIS', 'INDIGENA'); o rótulo PT-BR é do front. */
  genderIdentity: string | null
  race: string | null
  /** Anos completos, derivados no core-api — `dateOfBirth` nunca cruza a borda (LGPD). */
  age: number | null
}>

/**
 * Fatia de distribuição demográfica (core-api#477). `id` = chave CANÔNICA e estável (`MULHER_CIS`,
 * `INDIGENA`, `ATE_29`, `OUTROS`, `NA`); `label` = texto PT-BR pronto para exibir.
 *
 * O rótulo vem da API de propósito: o front NÃO mantém mais mapa id→label. Era esse mapa local que
 * **descartava em silêncio** o `INDIGENA` e 5 das 8 identidades de gênero — a lista canônica daqui só
 * conhecia 3. Categoria nova passa a aparecer sozinha, sem release de front.
 */
export type CategoryCount = Readonly<{
  id: string
  label: string
  count: number
}>

/**
 * Distribuições demográficas AGREGADAS da equipe (`GET /reports/team/demographics`).
 *
 * Só estatística — raça, identidade de gênero e nascimento nunca chegam por pessoa (Opção A da P.O.).
 * Sem k-anonimato (P.O. 2026-07-20): a contagem exibida é a real.
 *
 * **Invariante garantida pelo backend (com teste):** a soma dos `count` de cada dimensão == `totalActive`.
 * Valor fora da lista canônica cai no balde `OUTROS` e continua somando — ninguém some da distribuição.
 */
export type TeamDemographics = Readonly<{
  totalActive: number
  gender: readonly CategoryCount[]
  ageRange: readonly CategoryCount[]
  race: readonly CategoryCount[]
}>
