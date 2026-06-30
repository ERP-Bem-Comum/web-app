/**
 * Schemas Zod de I/O de Colaborador — vivem na BORDA (adapters), não no domínio (C2 do review). Os tipos
 * correspondentes são escritos à mão em `../domain/collaborator/collaborator.io.ts`; guards travam o drift.
 */
import * as z from 'zod'

import type * as D from '../domain/collaborator/collaborator.io.ts'

const OccupationAreaSchema = z.enum(['PARC', 'DDI', 'DCE', 'EPV'])
const EmploymentRelationshipSchema = z.enum(['CLT', 'PJ'])
const RegistrationStatusSchema = z.enum(['pre-registration', 'complete'])
// Valores REAIS do enum `disableBy` do core-api (códigos legados). A UI mapeia para labels via i18n.
const DeactivationReasonSchema = z.enum([
  'DESLIGAMENTO_ABC',
  'FALECIMENTO',
  'TEMPO_CONTRATO_FINALIZADO',
  'SOLICITACAO_RESCISAO_CONTRATUAL',
])

export const ListCollaboratorsInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  status: RegistrationStatusSchema.optional(),
  occupationAreas: z.array(OccupationAreaSchema).optional(),
  employmentRelationships: z.array(EmploymentRelationshipSchema).optional(),
  roles: z.array(z.string().trim().max(120)).optional(),
  yearOfContract: z.int().min(1900).max(2100).optional(),
  page: z.int().min(1).default(1),
  limit: z.union([z.literal(5), z.literal(10), z.literal(25)]).default(5),
})

export const GetCollaboratorInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

// Território (#42) — UF (sigla) + município (texto livre); ambos opcionais. O objeto pode ser null.
const TerritoryInputSchema = z.object({
  uf: z.string().trim().max(2).nullable(),
  municipality: z.string().trim().max(120).nullable(),
})

// Payment-target (banco/PIX) — opcionais (#40), mesmo shape do Fornecedor.
const BankAccountInputSchema = z.object({
  bank: z.string().trim().min(1).max(20),
  agency: z.string().trim().min(1).max(20),
  accountNumber: z.string().trim().min(1).max(30),
  checkDigit: z.string().trim().max(5),
})
const PixKeyInputSchema = z.object({
  keyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random-key']),
  key: z.string().trim().min(1).max(140),
})

export const CreateCollaboratorInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  cpf: z.string().trim().min(11).max(14),
  occupationArea: OccupationAreaSchema,
  role: z.string().trim().min(1).max(120),
  startOfContract: z.iso.date(), // YYYY-MM-DD (validado na borda)
  employmentRelationship: EmploymentRelationshipSchema,
  territory: TerritoryInputSchema.nullable(),
  bankAccount: BankAccountInputSchema.nullable(),
  pixKey: PixKeyInputSchema.nullable(),
})

// Cadastro completo (Seção 2). Nomes alinhados ao core-api. PATCH /collaborators/:id/complete-registration.
export const CompleteCollaboratorRegistrationInputSchema = z.object({
  id: z.string().trim().min(1).max(64),
  rg: z.string().trim().max(20).optional(),
  dateOfBirth: z.iso.date().optional(),
  genderIdentity: z.string().trim().max(60).optional(),
  race: z.string().trim().max(60).optional(),
  education: z.string().trim().max(80).optional(),
  foodCategory: z.string().trim().max(60).optional(),
  foodCategoryDescription: z.string().trim().max(200).optional(),
  completeAddress: z.string().trim().max(300).optional(),
  telephone: z.string().trim().max(20).optional(),
  emergencyContactName: z.string().trim().max(200).optional(),
  emergencyContactTelephone: z.string().trim().max(20).optional(),
  allergies: z.string().trim().max(300).optional(),
  biography: z.string().trim().max(500).optional(),
  experienceInThePublicSector: z.boolean().optional(),
})

// Edição dos dados cadastrais. PUT /collaborators/:id — OMITE território (#42) e banco/PIX (#40).
export const UpdateCollaboratorInputSchema = CreateCollaboratorInputSchema.omit({
  territory: true,
  bankAccount: true,
  pixKey: true,
}).extend({
  id: z.string().trim().min(1).max(64),
})

export const DeactivateCollaboratorInputSchema = z.object({
  id: z.string().trim().min(1).max(64),
  reason: DeactivationReasonSchema, // obrigatório (FR-006); valores reais de `disableBy`.
})

// Reativar: Inactive → Active. Sem motivo (idempotente). Backend: POST /collaborators/:id/reactivate.
export const ReactivateCollaboratorInputSchema = z.object({
  id: z.string().trim().min(1).max(64),
})

// Import em lote (CSV-only). O client lê `File.text()` e envia a STRING; a server fn repassa `text/csv`.
// Teto de 2 MiB validado em BYTES (UTF-8), alinhado ao `bodyLimit` do core-api. FR-007.
export const ImportCollaboratorsInputSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  csv: z
    .string()
    .trim()
    .min(1)
    .max(4 * 1024 * 1024) // guarda barata em chars antes do refine (cap ~2x bytes)
    .refine((s) => new TextEncoder().encode(s).byteLength <= 2 * 1024 * 1024, { error: 'csv-too-large' }),
})

type AssertEqual<A, B> = [A] extends [B] ? true : never

const _g_list: AssertEqual<z.infer<typeof ListCollaboratorsInputSchema>, D.ListCollaboratorsInput> = true
const _g_get: AssertEqual<z.infer<typeof GetCollaboratorInputSchema>, D.GetCollaboratorInput> = true
const _g_create: AssertEqual<z.infer<typeof CreateCollaboratorInputSchema>, D.CreateCollaboratorInput> = true
const _g_complete: AssertEqual<
  z.infer<typeof CompleteCollaboratorRegistrationInputSchema>,
  D.CompleteCollaboratorRegistrationInput
> = true
const _g_update: AssertEqual<z.infer<typeof UpdateCollaboratorInputSchema>, D.UpdateCollaboratorInput> = true
const _g_deact: AssertEqual<
  z.infer<typeof DeactivateCollaboratorInputSchema>,
  D.DeactivateCollaboratorInput
> = true
const _g_react: AssertEqual<
  z.infer<typeof ReactivateCollaboratorInputSchema>,
  D.ReactivateCollaboratorInput
> = true
const _g_import: AssertEqual<
  z.infer<typeof ImportCollaboratorsInputSchema>,
  D.ImportCollaboratorsInput
> = true

void [_g_list, _g_get, _g_create, _g_complete, _g_update, _g_deact, _g_react, _g_import]
