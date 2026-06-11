/**
 * Schemas Zod de I/O de Act — vivem na BORDA (adapters), não no domínio (C2 do review). Os tipos
 * correspondentes são escritos à mão em `../domain/act/act.io.ts`; guards travam o drift. Defesa em
 * profundidade (D3): a UI bloqueia + estes schemas validam (repasse⇒conta|pix; endDate>startDate) + o
 * core-api é o árbitro final (DV do cnpj, unicidade do actNumber).
 */
import * as z from 'zod'

import type * as D from '../domain/act/act.io.ts'

const OccupationAreaSchema = z.enum(['PARC', 'DDI', 'DCE', 'EPV'])

const BankAccountSchema = z.object({
  bank: z.string().trim().min(1).max(20),
  agency: z.string().trim().min(1).max(20),
  accountNumber: z.string().trim().min(1).max(30),
  checkDigit: z.string().trim().max(5),
})

const PixKeySchema = z.object({
  keyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random-key']),
  key: z.string().trim().min(1).max(140),
})

export const ListActsInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  hasFinancialTransfer: z.boolean().optional(),
  occupationArea: OccupationAreaSchema.optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.int().min(1).default(1),
  limit: z.int().min(1).max(100).default(5),
})

export const GetActInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

// Regra de repasse + vigência. U2: comparação de datas como string ISO `YYYY-MM-DD` (lexicográfico =
// cronológico); MESMA forma usada no controller da UI.
const refineAct = (
  data: {
    hasFinancialTransfer: boolean
    bankAccount: D.CreateActInput['bankAccount']
    pixKey: D.CreateActInput['pixKey']
    startDate: string
    endDate: string
  },
  ctx: z.RefinementCtx,
): void => {
  if (data.hasFinancialTransfer && data.bankAccount === null && data.pixKey === null) {
    ctx.addIssue({ code: 'custom', message: 'act-payment-target-required', path: ['hasFinancialTransfer'] })
  }
  if (data.endDate <= data.startDate) {
    ctx.addIssue({ code: 'custom', message: 'invalid-act-period', path: ['endDate'] })
  }
}

export const CreateActInputSchema = z
  .object({
    actNumber: z.string().trim().min(1).max(120),
    name: z.string().trim().min(1).max(200),
    email: z.email(),
    cnpj: z.string().trim().min(14).max(18), // aceita máscara; o client normaliza p/ 14 dígitos
    corporateName: z.string().trim().min(1).max(200),
    fantasyName: z.string().trim().min(1).max(200),
    occupationArea: OccupationAreaSchema,
    legalRepresentative: z.string().trim().min(1).max(200),
    startDate: z.iso.date(), // YYYY-MM-DD
    endDate: z.iso.date(), // YYYY-MM-DD
    hasFinancialTransfer: z.boolean(),
    bankAccount: BankAccountSchema.nullable().default(null),
    pixKey: PixKeySchema.nullable().default(null),
  })
  .superRefine(refineAct)

export const UpdateActInputSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    actNumber: z.string().trim().min(1).max(120),
    name: z.string().trim().min(1).max(200),
    email: z.email(),
    cnpj: z.string().trim().min(14).max(18),
    corporateName: z.string().trim().min(1).max(200),
    fantasyName: z.string().trim().min(1).max(200),
    occupationArea: OccupationAreaSchema,
    legalRepresentative: z.string().trim().min(1).max(200),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    hasFinancialTransfer: z.boolean(),
    bankAccount: BankAccountSchema.nullable().default(null),
    pixKey: PixKeySchema.nullable().default(null),
  })
  .superRefine(refineAct)

export const DeactivateActInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

export const ReactivateActInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

type AssertEqual<A, B> = [A] extends [B] ? true : never

const _g_list: AssertEqual<z.infer<typeof ListActsInputSchema>, D.ListActsInput> = true
const _g_get: AssertEqual<z.infer<typeof GetActInputSchema>, D.GetActInput> = true
const _g_create: AssertEqual<z.infer<typeof CreateActInputSchema>, D.CreateActInput> = true
const _g_update: AssertEqual<z.infer<typeof UpdateActInputSchema>, D.UpdateActInput> = true
const _g_deact: AssertEqual<z.infer<typeof DeactivateActInputSchema>, D.DeactivateActInput> = true
const _g_react: AssertEqual<z.infer<typeof ReactivateActInputSchema>, D.ReactivateActInput> = true

void [_g_list, _g_get, _g_create, _g_update, _g_deact, _g_react]
