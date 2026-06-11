# Research — 025 Integração Parceiros × Contratos

> Frontend-only, módulos `contracts` + `partners`. Sem core-api. Investigação read-only em 2026-06-11.
> Ajuste crítico: banco/PIX no contrato **permanecem somente-leitura**; só Contato (e-mail/telefone) edita.

## Achados que mudam o plano (vs spec)

1. **US1 já tem o padrão pronto para Fornecedor.** `contract-create.page.tsx` → `handleSelectPartner` já
   chama `getSupplierFn({data:{id}})` e faz `form.update('bancaryInfo'|'pixInfo', …)` ao selecionar um
   fornecedor. Falta **estender** para ACT/Financiador/Colaborador. Os campos do controller
   (`bancaryInfo`, `pixInfo`, `email`, `telephone`) já existem; banco/PIX já são **disabled** na UI.
2. **Detalhe do contrato NÃO precisa mudar (US1 exibição).** `contract-bank-info` e `contract-contato`
   já exibem do **contrato persistido** (`contract.bancaryInfo/pixInfo/email/telephone`) — que passam a
   vir pré-preenchidos do create. Sem refetch do parceiro no detalhe.
3. **US2: ACT já vem do backend.** `CoreApiContractorSchema.type` inclui `'act'`; o mapper server
   (`core-api-contracts.ts` `CONTRACTOR_TYPE.act='ACT'`, `mapContractorToDomain`) popula o contratado.
   Gap é só **client**: `Contract`/`ContractRow` sem `act`; model sem snapshot `act`; view-model não
   mapeia; `getContractorFromRow` ACT→supplier (bug); `contract-info` sem `act`.
4. **US5: Fornecedor/ACT só coletam `cnpj` e `email`** (não há `telephone` nesses forms). Logo a chave
   PIX derivável é **cpf/cnpj→cnpj** e **email→email**; **phone/random-key → não deriva** (sem fonte).

## Shapes do detalhe de parceiro (server fns já no public-api)

| Tipo | server fn | banco/PIX | email | telephone | exportado public-api |
|------|-----------|-----------|-------|-----------|----------------------|
| Fornecedor | `getSupplierFn` | ✅ bankAccount+pixKey | ✅ | ❌ | ✅ |
| ACT | `getActFn` | ✅ bankAccount+pixKey | ✅ | ❌ | ✅ |
| Financiador | `getFinancierFn` | ❌ (gated) | ❌ | ✅ | ✅ |
| Colaborador | `getCollaboratorFn` | ❌ (gated) | ✅ | ❌ | **❌ falta exportar** |

`bankAccount = { bank, agency, accountNumber, checkDigit }`; `pixKey = { keyType, key }`.
Mapeamento p/ o contrato: `bancaryInfo = { bank, agency, accountNumber, dv: checkDigit }`,
`pixInfo = { keyType, key }`.

## Decisões

### D1 (US1) — Pré-preencher por tipo, banco/PIX só-leitura, contato editável
- **Decisão**: estender `handleSelectPartner` para os 4 tipos chamando a server fn de detalhe por tipo e
  pré-preenchendo só o que cada tipo tem: Fornecedor/ACT → `bancaryInfo`+`pixInfo`+`email`;
  Financiador → `telephone`; Colaborador → `email`. Banco/PIX continuam **disabled** (não destravar);
  e-mail/telefone editáveis.
- **Extrair PURO**: `partnerDetailToContractFields(kind, detail)` → `{ bancaryInfo?, pixInfo?, email?, telephone? }`
  (sem I/O), testável por node:test. A page faz `getXxxFn` (por tipo) → mapper → `form.update`.
- **Erro/degrade**: se a server fn falhar (`!res.ok`), não preencher e não travar (a seleção do contratado
  permanece) — igual ao supplier hoje (`if (!res.ok) return`).
- **Exportar `getCollaboratorFn`** (+ tipo) no `partners/public-api` (hoje ausente).
- **Boundaries OK**: `contract-create.page.tsx` (client-ui) já importa `getSupplierFn` de
  `#modules/partners/public-api` — permitido pelo eslint (client-ui/binding → public-api).
- **Detalhe**: nenhuma mudança de exibição (já mostra do contrato persistido). US1 cobre só o create.
- **Alternativas rejeitadas**: alterar o agregador de busca (fora de escopo); buscar no detalhe (desnecessário).

### D2 (US2) — Propagar ACT no client (aditivo)
- **Decisão**: adicionar `actId?`/`act?` (snapshot) ao `Contract` (domain types) e `act?` ao `ContractSchema`
  (model; `actId` já existe); mapear `act`/`actId` em `mapModelToContractRow` e `buildContractDocData`;
  corrigir `getContractorFromRow` (`case 'ACT' → contractRow.act`); `contract-info` `?? contract.act` +
  `typeLabel` tratar 'ACT'. `avatarVariant`/`tipoVariant` já suportam 'ACT'.
- **Confirmar na impl**: o server fn de contrato já entrega o snapshot do contratado ACT no mesmo formato
  dos demais (supplier/financier/collaborator). Se o model client não recebe `act` hoje, garantir que o
  schema passe a aceitá-lo (e que o server o inclua — provável que já inclua, só faltando o campo no Zod).
- **Switch exaustivo**: discriminador = `contractType` ('Fornecedor'|'Financiador'|'Colaborador'|'ACT').
  Tratar 'ACT' em TODOS os switches (getContractorFromRow, typeLabel) com guard `never`.

### D3 (US3) — Máscara de telefone via componente Input compartilhado
- **Decisão**: trocar os `<input type="text">` crus de telefone por `<Input mask="phone">` (shared) na
  section Contato do `contract-form.component.tsx` e no modo edição do `contract-contato.component.tsx`.
  O `Input` formata na exibição e **emite dígitos** (`unmask`) no `onChange` → o valor salvo são dígitos
  (consistente). Sem CSS novo.
- **Rationale**: reusa o helper/component existente; não duplica máscara; salva dígitos crus.

### D4 (US4) — Navegar in-app com returnTo + voltar no sucesso
- **Decisão**: `handleCreateNewPartner` → `navigate({ to: '/parceiros/fornecedores/criar', search: { returnTo: '/contratos/criar' } })`
  (mesma aba; default fornecedores, conforme stakeholder). Adicionar `validateSearch` (`{ returnTo?: string }`)
  nas 4 rotas de criação de parceiro. Nos 4 bindings de criação, no `onSuccess` (sucesso), navegar para
  `safeRedirect(search.returnTo, '<lista do tipo>')` (reusar `safeRedirect` de `auth/public-api`).
- **Voltar simples**: sem preservar rascunho do contrato (form em branco ao voltar). O parceiro novo já
  fica disponível no dropdown (a busca refaz a query).
- **Rationale**: reusa exatamente o padrão do login (`?redirect=` + `safeRedirect`). `safeRedirect` evita
  open-redirect.
- **Nota**: se o usuário navegar para OUTRO tipo dentro do módulo, o `returnTo` precisa ser propagado pelos
  links internos para sobreviver — fora do "voltar simples"; o retorno é garantido quando ele cria pelo
  destino linkado (fornecedores). Registrado como limitação aceita.

### D5 (US5) — derivePixKey puro GENÉRICO, desenhado para os 4 forms (ativo onde PIX habilitado)
- **Decisão**: função PURA **genérica** `derivePixKey(keyType, src: { document?: string; email?: string; telephone?: string }): string`:
  `cpf|cnpj → document`; `email → email`; `phone → telephone`; `random-key → ''`; campo ausente/vazio → `''`.
  Cada form passa seus campos: Fornecedor/ACT `{ document: cnpj, email }` (não coletam telefone);
  Colaborador `{ document: cpf, email }`; Financiador `{ document: cnpj, telephone }` — estes dois **quando
  o backend liberar** (hoje gated). Aplicar no `onChange` do select de tipo de chave:
  `setField('pixKeyType', t)` **e** `setField('pixKey', derivePixKey(t, src))`.
- **Escopo ATIVO agora**: **Fornecedor + ACT** (PIX habilitado). Colaborador/Financiador: o helper já cobre,
  mas **NÃO** ligamos nesta fatia (banco/PIX gated; campos não existem nos controllers; evita enviar campo
  que o backend rejeita). Ao destravar (ticket `PAR-FINANCIER-COLLAB-BANK`), é só plugar o mesmo helper.
- **Regra fina (cenário 4)**: ao TROCAR o tipo, a chave é re-derivada para o novo tipo (ação explícita).
  `random-key`/sem-fonte → limpa (`''`). Previsível e testável; edição manual posterior permanece.
- **Local**: `src/modules/partners/client/domain/derive-pix-key.ts` (puro, sem React).

## TDD (RED antes da impl)
- **node:test** (`*.test.ts`, imports RELATIVOS):
  - `partnerDetailToContractFields` (US1): por tipo, mapeia banco/pix/email/telefone corretos; tipos sem
    dado não preenchem.
  - `getContractorFromRow`/derivação ACT (US2): ACT retorna o snapshot `act` (não supplier).
  - `derivePixKey` (US5): cpf/cnpj→cnpj, email→email, phone/random→'' .
  - `safeRedirect` (US4): já existe; reusar (test só se faltar cobertura do returnTo).
- **vitest** (`*.spec.tsx`): auto-PIX no form (select tipo → chave preenchida/limpa); máscara no input de
  telefone (exibe formatado); grid mostrando ACT (se viável sem mock pesado). Deferir frágil com justificativa.

## Invariantes v2 (lint cobra)
`Result<T,E>` sem throw fora da borda; sem any/class/this; imutabilidade; só-tokens (sem CSS novo);
i18n (novos textos do fluxo; section Contato); views burras (data-hooks no binding; a chamada de detalhe
ao selecionar segue o padrão já existente na page do create); boundaries por public-api (contracts→partners
só via `partners/public-api`); Zod na borda; naming postfix; switch exaustivo `never` (contractType + pixKeyType).

## Coordenação de branch
025 ← 024 ← 023 ← 022 ← develop. Toca `contracts` (023 também tocou contracts) e `partners` (022/023/024
tocaram partners) — mas como 025 está empilhada sobre 024 (que inclui os anteriores), não há conflito.
Catálogo i18n compartilhado pode receber poucos textos novos (fluxo novo parceiro / labels) — empilhado, sem conflito.
