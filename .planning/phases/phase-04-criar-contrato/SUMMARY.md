# Phase 4 Summary — Criar Contrato (US3)

**Status**: ✅ Complete
**Date**: 2026-05-27

---

## What was delivered

### Schema & Domain
- `ContractCreateInputSchema` atualizado com regras de negócio:
  - Teto de Ordem de Serviço (`totalValue <= 9999.99`)
  - PIX ou bancário obrigatório para SUPPLIER/COLLABORATOR/ACT
  - Contratante obrigatório conforme tipo
- Campos `bancaryInfo` e `pixInfo` adicionados ao schema e types

### Mock API
- `POST /contracts` gera `contractCode` com prefixo correto (C ou OS) e ano atual
- Retorna contrato completo ao invés de apenas `{ id }`
- Aceita novos campos de dados bancários e PIX

### ContractForm (redesign completo)
- React Hook Form + Zod resolver para validação declarativa
- Auto-save em `sessionStorage` a cada 30s
- Restaura rascunho ao montar componente
- Design institucional alinhado ao handbook:
  - Topbar com navegação de volta e status "Rascunho"
  - Field rows com labels em caixa alta 9.5px
  - Inputs com bordas `#e5ded4` e focus `#8bb0d6`
  - Fonte mono para campos numéricos e datas

### Campos implementados
- **Seleção de contratado**: busca por nome/CNPJ/CPF com dropdown
- **Dados do contrato**: classificação, modelo, tipo, objeto, valor, período, programa, plano
- **Dados bancários**: banco, agência, conta, DV, PIX (habilitados após seleção de contratado)
- **Documento principal**: upload placeholder (PDF até 20MB)

### Sidebar
- Preview de valor formatado em R$
- Preview de vigência (início → fim)
- Checklist de 6 pendências com ícones de status
- Barra de progresso "Concluído X / 6"

### Bottombar
- Status "Rascunho · não salvo"
- Botões: Cancelar, Salvar como rascunho, Salvar contrato
- Botão "Salvar contrato" desabilitado até checklist completo

### Testes
- 5 testes unitários de domain (schema validation)
  - OS dentro do teto ✅
  - OS acima do teto ❌
  - Contrato com valor alto ✅
  - SUPPLIER sem pagamento ❌
  - FINANCIER sem pagamento ✅

---

## Files changed/created

| File | Action |
|---|---|
| `src/features/contracts/domain/schemas.ts` | Updated — regras de negócio + bancaryInfo/pixInfo |
| `src/features/contracts/views/hooks/use-contract-draft.ts` | Created — auto-save sessionStorage |
| `src/features/contracts/views/components/ContractForm.tsx` | Rewritten — RHF + Zod + design institucional |
| `src/routes/_authenticated/contratos/adicionar.tsx` | Updated — layout full-height |
| `mock-api.ts` | Updated — contractCode com prefixo, retorna contrato completo |
| `vitest.config.ts` | Created — configuração básica |
| `tests/features/contracts/domain/schemas.test.ts` | Created — 5 testes de validação |

---

## Quality gates

- `yarn build` ✅
- `npx vitest run` ✅ (5/5)
- Playwright E2E (3/3) ✅
