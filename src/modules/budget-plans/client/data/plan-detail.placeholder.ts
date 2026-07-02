/**
 * ⚠️ DADOS PLACEHOLDER (front-first) — NÃO é mock de teste (ADR-0011). Detalhe consolidado do plano
 * enquanto o core-api não tem `GET /budget-plans/:id`. Valores FIÉIS ao mapa/frames (ETI 1.2 > Consultoria:
 * Fev/Mar R$ 16.219,36 cada → total R$ 32.438,72; visão Por Rede = coluna ACRE). Centavos.
 * 🔁 TODO(#113): trocar pela server fn.
 */
import type { PlanDetail, MonthlyCents } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

/** Monta os 12 meses (Jan…Dez) a partir de pares {mês(1-12): centavos}; resto = 0. */
const months = (values: Readonly<Record<number, number>>): MonthlyCents =>
  Array.from({ length: 12 }, (_, i) => values[i + 1] ?? 0)

const zero = months({})

const consultoriaMonthly = months({ 2: 1_621_936, 3: 1_621_936 }) // Fev/Mar

// 1 rede (Acre) — HANDBOOK §1.4: "Consolidado dos parceiros" tinha só a coluna ACRE.
const NET_ALL = [3_243_872] as const
const NET_ZERO = [0] as const

const PLAN_3: PlanDetail = {
  id: 3,
  year: 2026,
  programName: 'Ensino de Tempo Integral',
  programAbbreviation: 'ETI',
  version: 1.2,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 3_243_872,
  networks: [{ id: 1, name: 'Acre' }],
  costCenters: [
    {
      id: 1,
      name: 'Consultoria',
      type: 'A PAGAR',
      totalInCents: 3_243_872,
      monthlyInCents: consultoriaMonthly,
      networkInCents: [...NET_ALL],
      categories: [
        {
          id: 11,
          name: 'Consultoria Educacional',
          totalInCents: 3_243_872,
          monthlyInCents: consultoriaMonthly,
          networkInCents: [...NET_ALL],
          subCategories: [
            {
              id: 111,
              name: 'Formação de professores',
              totalInCents: 3_243_872,
              monthlyInCents: consultoriaMonthly,
              networkInCents: [...NET_ALL],
            },
            {
              id: 112,
              name: 'Logística',
              totalInCents: 0,
              monthlyInCents: zero,
              networkInCents: [...NET_ZERO],
            },
            {
              id: 113,
              name: 'Formação de formadores',
              totalInCents: 0,
              monthlyInCents: zero,
              networkInCents: [...NET_ZERO],
            },
          ],
        },
        {
          id: 12,
          name: 'Outras consultorias',
          totalInCents: 0,
          monthlyInCents: zero,
          networkInCents: [...NET_ZERO],
          subCategories: [],
        },
      ],
    },
    {
      id: 2,
      name: 'Comunicação',
      type: 'A PAGAR',
      totalInCents: 0,
      monthlyInCents: zero,
      networkInCents: [...NET_ZERO],
      categories: [],
    },
    {
      id: 3,
      name: 'Produção De Conteúdo',
      type: 'A PAGAR',
      totalInCents: 0,
      monthlyInCents: zero,
      networkInCents: [...NET_ZERO],
      categories: [],
    },
    {
      id: 4,
      name: 'Avaliação Externa',
      type: 'A PAGAR',
      totalInCents: 0,
      monthlyInCents: zero,
      networkInCents: [...NET_ZERO],
      categories: [],
    },
  ],
}

const BY_ID: ReadonlyMap<number, PlanDetail> = new Map([[PLAN_3.id, PLAN_3]])

/** Detalhe placeholder por id (null se não houver — a page mostra estado "não encontrado"). */
export const planDetailPlaceholder = (id: number): PlanDetail | null => BY_ID.get(id) ?? null
