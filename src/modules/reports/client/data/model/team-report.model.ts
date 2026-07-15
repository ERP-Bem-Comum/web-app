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
}>
