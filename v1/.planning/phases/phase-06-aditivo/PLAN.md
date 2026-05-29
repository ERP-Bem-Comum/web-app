# PLAN — Phase 6: Adicionar Aditivo (US5)

## Goal
Criar aditivos vinculados a um contrato pai com regras de validação e status.

## Tasks

### T049 — Teste de adapter: createAditive happy path
- Arquivo: `tests/features/contracts/adapters/http/contracts.test.ts`
- Mock POST /contracts/aditive, assert response shape

### T050 — Application: use-case create-aditive
- Arquivo: `src/features/contracts/application/use-cases/create-aditive.ts`
- Input: `AditiveCreateInput` (parentId obrigatório, tipo, datas, resumo, valor condicional)
- Regras:
  - tipo === 'valor' → totalValue obrigatório
  - tipo === 'prazo' → contractPeriod.end obrigatório (nova data fim)
  - signedContractUrl + dataAssinatura → aditivoStatus = 'Homologado'
  - !signedContractUrl → aditivoStatus = 'Pendente'

### T051 — Adapters HTTP: createAditive
- Arquivo: `src/features/contracts/adapters/http/contracts.ts`
- POST /contracts/aditive

### T052 — Server Function: createAditive
- Arquivo: `src/server/contracts.ts`
- Substituir schema genérico `ContractCreateInputSchema` por `AditiveCreateInputSchema`

### T053 — Views: AditiveForm funcional
- Arquivo: `src/features/contracts/views/components/AditiveForm.tsx` (ou refatorar modal existente)
- Tipo: prazo, valor, escopo, outro, distrato
- Campos condicionais por tipo
- Upload de documento
- Integrar com mutation hook

### T054 — Route: /contratos/aditivo/$id
- Arquivo: `src/routes/_authenticated/contratos/aditivo.$id.tsx`
- Recebe id do contrato pai
- Renderiza AditiveForm

## Schema AditiveCreateInput

```ts
export const AditiveCreateInputSchema = z.object({
  parentId: z.number(),
  aditivoType: z.enum(['prazo', 'valor', 'escopo', 'outro', 'distrato']),
  object: z.string().min(1, 'Resumo é obrigatório'),
  totalValue: z.number().optional(),
  contractPeriod: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
  dataAssinatura: z.string().nullish(),
  signedContractUrl: z.string().nullish(),
  observations: z.string().nullish(),
})
```

## Decisões
- Reutilizar modal existente em ContractDetail.tsx como ponto de entrada (clique "+ Novo Aditivo")
- Form pode ser inline no modal ou página separada — avaliar durante execução
- Após criar aditivo, invalidar query do contrato pai para refresh automático

## Checkpoints
- [ ] Schema criado e validado
- [ ] Use-case implementado
- [ ] Adapter + Server Function funcionando
- [ ] Form funcional integrado à UI
- [ ] Build passando
