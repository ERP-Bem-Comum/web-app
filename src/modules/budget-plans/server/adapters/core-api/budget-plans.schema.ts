/**
 * Schemas Zod da BORDA (§IX) — espelham os DTOs REAIS do core-api novo (`/api/v2/budget-plans`, Fatia 1 #315
 * + detalhe #316). Fonte: `core-api origin/go-live` (os endpoints ainda não estão em `dev`; sobem no go-live
 * coordenado). A resposta do core é validada por estes schemas antes de qualquer mapeamento (anti-corrupção).
 */
import * as z from 'zod'

const coreStatusSchema = z.enum(['RASCUNHO', 'EM_CALIBRACAO', 'APROVADO'])

/**
 * Item de `GET /budget-plans` (envelope `{ items, total }`). `id`/`programRef` UUID; `version` string.
 * #372: `partnersCount` + `networkKind` projetados no item (fim do fan-out interino). #373: `updatedByRef`
 * (uuid nullable) → o BFF resolve o nome cross-módulo. `networkKind` inclui `mixed` (rede mista, que o
 * interino não detectava) e pode vir `null` (plano sem rede).
 */
export const coreListItemSchema = z.object({
  id: z.uuid(),
  year: z.int(),
  status: coreStatusSchema,
  version: z.string().trim(),
  programRef: z.uuid(),
  programName: z.string().trim(),
  totalInCents: z.int(),
  updatedAt: z.string().trim(),
  updatedByRef: z.uuid().nullable(),
  partnersCount: z.int().nonnegative(),
  networkKind: z.enum(['state', 'municipality', 'mixed']).nullable(),
  // #423: `parentId` (null = plano-raiz; uuid = cenário/calibração) + `scenarioName`. NULLISH + `.catch(null)`
  // DE PROPÓSITO: se o core-api de produção estiver atrás da `dev`, campo obrigatório faria o `safeParse`
  // falhar e derrubaria a LISTA INTEIRA. Ausente → tudo vira raiz (o comportamento flat de antes).
  parentId: z.uuid().nullish().catch(null),
  scenarioName: z.string().trim().nullish().catch(null),
})

export const coreListResponseSchema = z.object({
  items: z.array(coreListItemSchema),
  total: z.int().nonnegative(),
})

/** `POST /budget-plans` — 201 do plano recém-criado (feature 058). `version` string; `programRef`/`id` UUID. */
export const coreCreateResponseSchema = z.object({
  id: z.uuid(),
  year: z.int(),
  programRef: z.uuid(),
  status: coreStatusSchema,
  version: z.string().trim(),
  totalInCents: z.int(),
})

/** `GET /budget-plans/options` — insumos da criação (programas c/ abreviação, anos, redes). */
export const coreOptionsSchema = z.object({
  programs: z.array(z.object({ ref: z.uuid(), name: z.string().trim(), abbreviation: z.string().trim() })),
  years: z.array(z.int()),
  redes: z.array(
    z.object({
      kind: z.enum(['state', 'municipality']),
      ref: z.string().trim(), // #394: chave natural (UF/IBGE), não uuid
      name: z.string().trim(),
      uf: z.string().trim(),
    }),
  ),
})

/**
 * `GET /budget-plans/:id/cost-structure` (feature 059) — SÓ a árvore Centro → Categoria → Subcategoria
 * (nomes/estrutura, SEM valores). `direction`/`launchType` validados como STRING tolerante (fail-soft: os
 * literais exatos do backend NÃO estão pinados — o MAPPER faz o lookup, com fallback). Anti-corrupção: valida
 * antes de mapear. `budgetPlanId`/`id` UUID.
 */
/**
 * Árvore de custo do core — resposta do `GET /:id/cost-structure` E do eco dos POSTs/PATCH (é o mesmo schema
 * lá). `active` (feature 075 — #454 gap 3) é o estado EFETIVO (nó ∧ ancestrais), derivado na leitura do core.
 */
export const coreCostStructureSchema = z.object({
  budgetPlanId: z.uuid(),
  costCenters: z.array(
    z.object({
      id: z.uuid(),
      name: z.string().trim(),
      direction: z.string().trim(),
      active: z.boolean(),
      categories: z.array(
        z.object({
          id: z.uuid(),
          name: z.string().trim(),
          active: z.boolean(),
          subcategories: z.array(
            z.object({
              id: z.uuid(),
              name: z.string().trim(),
              launchType: z.string().trim(),
              active: z.boolean(),
            }),
          ),
        }),
      ),
    }),
  ),
})

/**
 * `POST /budget-plans/:id/approve` e `.../start-calibration` (feature 060) — plano atualizado após a transição
 * de ciclo de vida (`lifecyclePlanResponseSchema` do core). `version` string; `id`/`programRef` UUID.
 */
export const coreLifecyclePlanSchema = z.object({
  id: z.uuid(),
  year: z.int(),
  status: coreStatusSchema,
  version: z.string().trim(),
  totalInCents: z.int(),
})

/**
 * `POST /budget-plans/:id/scenery` (feature 060) — cenário recém-criado. O core responde a forma de transição
 * (`lifecyclePlanResponseSchema`): o nome do cenário vem em **`scenarioName`** (nullable), NÃO em `name` — o
 * schema antigo exigia `name` e falhava o parse (→ erro genérico "unexpected"). `version` string ("major.minor").
 */
export const coreScenerySchema = z.object({
  id: z.uuid(),
  scenarioName: z.string().trim().nullable(),
  status: coreStatusSchema,
  version: z.string().trim(),
})

/**
 * `GET /budget-plans/:id/insights` (feature 060) — comparativo do ano atual × anteriores. Campos extras do
 * core são tolerados. `previousYears` pode vir vazio.
 *
 * #416 (core-api): `realizedInCents` (Σ conciliado do ano) e `networksCount` (nº de Redes do plano) são
 * NULLISH + `.catch(null)` DE PROPÓSITO: o core-api de produção pode estar atrás da `dev`, e um campo
 * obrigatório faria o `safeParse` falhar → o modal INTEIRO viraria erro por um número a mais. Ausente
 * vira `null` e a UI mostra "—" (honesto) em vez de `R$ 0,00` (mentira: "nada foi realizado").
 */
const coreInsightsYearSchema = z.object({
  year: z.int(),
  totalInCents: z.int(),
  realizedInCents: z.int().nullish().catch(null),
})
export const coreInsightsSchema = z.object({
  current: coreInsightsYearSchema,
  previousYears: z.array(coreInsightsYearSchema),
  networksCount: z.int().nonnegative().nullish().catch(null),
})

/** `GET /budget-plans/:id` — detalhe c/ `budgets[]` (fonte INTERINA de partnersCount/networkKind, core-api#372). */
export const coreDetailSchema = z.object({
  id: z.uuid(),
  year: z.int(),
  status: coreStatusSchema,
  version: z.string().trim(),
  programRef: z.uuid(),
  programName: z.string().trim(),
  budgets: z.array(
    z.object({
      id: z.uuid(),
      // #394: ref da rede = chave natural (UF 2 letras | IBGE 7 dígitos), NÃO uuid.
      partner: z.object({ kind: z.enum(['state', 'municipality']), ref: z.string().trim() }),
      valueInCents: z.int(),
    }),
  ),
  totalInCents: z.int(),
  createdAt: z.string().trim(),
  updatedAt: z.string().trim(),
})

/**
 * `GET /budget-plans/budget-results/by-budget/:budgetId` (#C2) — resultados por subcategoria **e MÊS** daquela
 * rede. Desde o core-api#413 vêm **12 itens por subcategoria** (um por mês do exercício).
 *
 * `month` é NULLISH + `.catch(1)`: o core-api de produção pode estar atrás da `dev`, e um campo obrigatório
 * faria o `safeParse` falhar — derrubando o DETALHE inteiro por um número a mais. Ausente → 1 (janeiro):
 * o comportamento antigo era "um valor por subcategoria", que equivale a um único mês.
 */
export const coreBudgetResultsSchema = z.object({
  items: z.array(
    z.object({
      subcategoryId: z.string().trim(),
      month: z.int().min(1).max(12).nullish().catch(1),
      valueInCents: z.int(),
    }),
  ),
  totalInCents: z.int(),
})
