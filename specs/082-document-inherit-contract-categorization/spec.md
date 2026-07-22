# 082 — Lançar Documento herda a categorização do contrato ativo (follow-up da S3, épico #502)

> Escala **M**. Fonte da verdade: ADR-0051. Follow-up direto da **S3** (`specs/081`): agora que o contrato guarda
> os refs da árvore do plano, o Lançar Documento **pré-preenche** a categorização a partir do contrato ativo
> vinculado ao favorecido — a "herança editável" do épico #502.

## Pedido (P.O.)

Quando o favorecido selecionado no Lançar Documento tem **contrato ATIVO vinculado**, a categorização
(**Programa → Plano Orçamentário → Centro de Custo → Categoria → Subcategoria**) deve ser **herdada** do contrato —
**assim como os dados bancários** já são.

## Antes

O documento mostrava um **chip** do contrato e mandava `contractRef` + `budgetPlanRef` no create (o backend deriva).
A cascata de categorização era preenchida **pelo operador** — a herança não aparecia em tela.

## Decisão

**Pré-preenchimento (herança editável)**: quando há contrato ativo vinculado (`selectedContract`), a cascata do
documento é preenchida com os refs do contrato. Editável; o operador pode sobrepor.

- **Hidratação** (`partner-hydration`): `ContractCategoView` + `toContract` passam a carregar
  `costCenterRef`/`categoryRef`/`subcategoryRef` do contrato (S3 os expõe no read model).
- **Controller**: nova ação `hydrateCategorization` (reducer) sobrepõe **SÓ** a cascata (Programa/Plano/Centro/
  Categoria/Subcategoria), deixando o resto do form intacto. Exposta com **identidade estável** (useCallback) p/ o
  efeito da page não re-disparar.
- **Page** (`lancar-documento`): efeito que aplica a herança **uma vez por contrato** (guard por `ref`), só em
  **create/draft** (edição/consulta hidratam do próprio documento). Trocar de contrato → re-herda; editar depois →
  não é clobrado.

Como o Plano vira o UUID do contrato (`budgetPlanRef`), a cascata (Fatia 1) busca a MESMA árvore e os refs herdados
resolvem nos dropdowns. Vale p/ qualquer tipo de favorecido (fornecedor/financiador/colaborador/ato) — o match do
contrato já é por tipo.

## Fora de escopo

- Resolver refs→nome no chip do contrato / detalhe (mesma pendência do drawer de Contas a Pagar).
- A derivação no backend por `contractRef` (#48) continua — a herança de tela é aditiva a ela.

## Verificação

`pnpm typecheck` + `pnpm verify` (1577 puros) + `pnpm test:dom` (578, +3 do controller: herança sobrepõe só a
cascata, edição do operador prevalece, identidade estável). Lint 0 erros nos tocados. Validado em tela (contrato
ativo 0013/2026 → cascata pré-preenchida). Stacka sobre a S3 (#265).
