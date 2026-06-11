/**
 * Schemas Zod do CLIENT — filtros da listagem de Financiadores (search params da rota). Validação na
 * fronteira (§IX). O schema do FORMULÁRIO vive em `data/model` (consumido pelo controller, que não pode
 * importar domain). Espelha o `SupplierListFiltersSchema`, sem o filtro de categorias.
 */
import * as z from 'zod'

export const FinancierListFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  // `active` chega como boolean nativo na navegação SPA e como string ('true'/'false') quando vem da
  // URL (reload/link). `z.coerce.boolean()` faria `Boolean('false') === true`. Aceitamos ambos.
  active: z.boolean().or(z.enum(['true', 'false']).transform((v) => v === 'true')).optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  // `.catch()` degrada URL adulterada (?page=abc, vazio) para o default em vez de derrubar a navegação.
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).catch(5).default(5),
})
export type FinancierListFilters = z.infer<typeof FinancierListFiltersSchema>
