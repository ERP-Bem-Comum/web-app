/**
 * Zod dos responses do core-api `/api/v1/collaborators/*` (boundary §VI). Valida o que entra do backend
 * antes de virar Model. Shapes alinhados ao contrato REAL (schemas.ts do core-api): `occupationArea` é
 * string (valores legados possíveis), paginação é a meta legada nestjs-typeorm-paginate. `.strip()` (default
 * Zod) descarta extras — não usar `.loose()` (vazaria PII não validada).
 */
import * as z from 'zod'

export const CoreApiCollaboratorItemSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  // RESPONSE tolerante (Bc): a base legada tem e-mails malformados; um único item inválido NÃO pode
  // derrubar a lista inteira. A validação estrita de e-mail vive nos formulários, não na leitura.
  email: z.string().trim(),
  occupationArea: z.string().trim(),
  role: z.string().trim(),
  status: z.enum(['PreRegistration', 'Complete']),
  active: z.boolean(),
  // Contratos ativos do parceiro (#46). `.catch(0)` tolera resposta sem o campo (fallback → 0).
  contractCount: z.int().nonnegative().catch(0),
})
export type CoreApiCollaboratorItem = z.infer<typeof CoreApiCollaboratorItemSchema>

// Paginação legada do core-api (nestjs-typeorm-paginate) — mapeada p/ { page, limit, total } no Model.
export const CoreApiPaginationMetaSchema = z.object({
  itemCount: z.int(),
  totalItems: z.int(),
  itemsPerPage: z.int(),
  totalPages: z.int(),
  currentPage: z.int(),
})

export const CoreApiCollaboratorListSchema = z.object({
  items: z.array(CoreApiCollaboratorItemSchema),
  meta: CoreApiPaginationMetaSchema,
})

// Payment-target (banco/PIX) no detalhe do Colaborador (#40) — mesmo shape do Fornecedor.
const BankAccountDtoSchema = z.object({
  bank: z.string().trim(),
  agency: z.string().trim(),
  accountNumber: z.string().trim(),
  checkDigit: z.string().trim(),
})
const PixKeyDtoSchema = z.object({
  keyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random-key']),
  key: z.string().trim(),
})

// Detalhe: pré-cadastro (7) + dados do cadastro completo (2ª etapa). Campos completos são `nullish`
// (a base legada/pré-cadastro pode trazê-los null/ausentes). Extras não listados são descartados (strip).
export const CoreApiCollaboratorDetailSchema = CoreApiCollaboratorItemSchema.extend({
  cpf: z.string().trim(),
  startOfContract: z.string().trim(),
  employmentRelationship: z.enum(['CLT', 'PJ']),
  rg: z.string().trim().nullish(),
  dateOfBirth: z.string().trim().nullish(),
  completeAddress: z.string().trim().nullish(),
  telephone: z.string().trim().nullish(),
  emergencyContactName: z.string().trim().nullish(),
  emergencyContactTelephone: z.string().trim().nullish(),
  genderIdentity: z.string().trim().nullish(),
  race: z.string().trim().nullish(),
  allergies: z.string().trim().nullish(),
  foodCategory: z.string().trim().nullish(),
  foodCategoryDescription: z.string().trim().nullish(),
  education: z.string().trim().nullish(),
  biography: z.string().trim().nullish(),
  experienceInThePublicSector: z.boolean().nullish(),
  // Perfil completo (US2). Todos nullish (pré-cadastro/legado pode trazê-los null/ausentes).
  sex: z.string().trim().nullish(),
  maritalStatus: z.string().trim().nullish(),
  hasChildren: z.boolean().nullish(),
  childrenCount: z.int().nullish(),
  childrenAges: z.array(z.int()).nullish(),
  isPwd: z.boolean().nullish(),
  pwdDescription: z.string().trim().nullish(),
  isOnLeave: z.boolean().nullish(),
  leaveDuration: z.string().trim().nullish(),
  leaveRenewable: z.boolean().nullish(),
  leaveRenewalDuration: z.string().trim().nullish(),
  publicSectorExperienceDuration: z.string().trim().nullish(),
  // Território (#42) — UF + município (texto livre). `.catch(null)` tolera ausência/legado.
  territory: z
    .object({ uf: z.string().trim().nullable(), municipality: z.string().trim().nullable() })
    .nullable()
    .catch(null),
  // Banco/PIX (#40) — create-only; lidos no detalhe. `.catch(null)` tolera ausência/legado.
  bankAccount: BankAccountDtoSchema.nullable().catch(null),
  pixKey: PixKeyDtoSchema.nullable().catch(null),
})
export type CoreApiCollaboratorDetail = z.infer<typeof CoreApiCollaboratorDetailSchema>

// Resposta do import em lote: relatório parcial (sempre 200).
export const CoreApiImportResultSchema = z.object({
  created: z.int(),
  failed: z.array(z.object({ line: z.int(), error: z.string().trim() })),
})
