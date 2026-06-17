# Research — CNPJ alfanumérico no frontend

**Feature**: 027-cnpj-alfanumerico · **Date**: 2026-06-17

Contrato do backend confirmado pelo `core-api-consultant` (fonte: `core-api/src/shared/kernel/cnpj.ts`,
ADR-0044). Não há `NEEDS CLARIFICATION` pendente.

## D1 — Helper puro único de CNPJ (onde e qual API)

**Decisão**: criar `src/shared/document/cnpj.ts` (camada `shared`, pura, sem I/O) exportando:

- `normalizeCnpj(raw: string): string` — `raw.replace(/[.\-/\s]/g, '').toUpperCase()` (espelha o backend).
- `isValidCnpjFormat(raw: string): boolean` — normaliza, testa `^[0-9A-Z]{12}[0-9]{2}$` **e** rejeita
  degenerado `^(.)\1{13}$`. Só FORMATO (não DV).
- `maskCnpj(raw: string): string` — normaliza (alfanumérico, uppercase) e agrupa progressivamente
  `XX.XXX.XXX/XXXX-NN` (parcial conforme digitação).
- `maskCpf(raw: string): string` — mantém comportamento numérico atual (11 dígitos).
- `maskCpfCnpj(raw: string): string` — heurística revista (ver D3).
- `isCnpjLength(normalized: string): boolean` — `length === 14` (após normalizar).

**Racional**: hoje existem ~6 cópias de "máscara por dígitos" (DS + 2 em Contratos + Financeiro + models).
Centralizar elimina divergência e dá um único ponto de teste (node:test puro). `shared/` é importável por
todas as camadas (`boundaryRules`), incluindo `server/domain` (que só pode importar `shared`).

**Alternativas rejeitadas**: (a) ajustar cada cópia in-place — multiplica risco e mantém a divergência;
(b) pôr o helper no DS (`ui/`) — `server/domain` não pode importar `ui/` (fere boundaries).

## D2 — Dígito verificador (DV) no front: estender, não remover

**Decisão**: o VO `cnpj.value-object.ts` **continua validando DV**, mas com a fórmula Serpro
(`valor(c) = c.charCodeAt(0) − 48`; `'0'..'9'→0..9`, `'A'..'Z'→17..42`), pesos atuais (módulo 11), sobre os
14 caracteres normalizados. Para CNPJ numérico o resultado é **idêntico** ao atual.

**Racional / divergência registrada**: a spec listou "não calcular DV no front" como _não-objetivo_, mas o
VO **já calcula** DV e é load-bearing (`supplier.use-cases.ts`, `financier.use-cases.ts`,
`pix-key.value-object.ts` validação de chave PIX tipo CNPJ, + 4 suítes). Removê-lo seria **regressão** de
validação (CNPJ numérico com DV inválido deixaria de ser pego localmente). A política de **zero regressão**
prevalece sobre o não-objetivo → estender é a opção correta. O front segue sendo _espelho_ do backend, não
uma segunda fonte de verdade (o backend continua sendo o árbitro final).

**Impacto**: o helper de FORMATO (`isValidCnpjFormat`, D1) é independente do DV — usado por máscara/feedback
imediato e schemas; o DV completo fica só no VO (já é assim hoje). Os schemas Zod dos models validam
**formato + length**, não DV (igual ao comportamento atual, que só checava `length === 14`).

**Alternativas rejeitadas**: (a) remover DV do VO e validar só formato — regressão; (b) duplicar DV no
helper compartilhado — DV é regra de domínio, fica no VO (camada domain), não no utilitário de UI.

## D3 — Heurística CPF × CNPJ em campos combinados (`cpf-cnpj`)

**Decisão**: decidir por **(a) presença de letra → CNPJ**, senão **(b) comprimento normalizado**: `≤ 11` →
CPF, `12–14` → CNPJ. Nunca mais por "contagem de dígitos numéricos".

**Racional**: a heurística atual (`onlyDigits(value).length > 11 ? cnpj : cpf`) quebra para CNPJ
alfanumérico parcial (ex.: `12ABC` tem poucos dígitos numéricos e seria tratado como CPF, apagando as
letras). CPF é estritamente numérico (11), então qualquer letra implica CNPJ.

**Alternativas rejeitadas**: campo separado para CPF e CNPJ — muda UX/telas existentes (fora de escopo).

## D4 — Normalização no envio (adapters core-api do BFF)

**Decisão**: nos 3 adapters (`core-api-suppliers/financiers/acts.ts`), trocar `onlyDigits(input.cnpj)` por
`normalizeCnpj(input.cnpj)` (alfanumérico + uppercase), garantindo exatamente 14 caracteres.

**Racional**: a borda HTTP dos parceiros exige `z.string().length(14)`; enviar com máscara (18) → 400. O
client já normaliza, mas a normalização no adapter é a garantia final na borda.

## D5 — Schemas Zod dos models de parceiro

**Decisão**: `CnpjFieldSchema` (supplier/financier/act models) passa a `.transform(normalizeCnpj)` +
`.refine(isValidCnpjFormat, { error: 'cnpj-invalid' })` (formato, não só length). Os io-schemas do server
mantêm `.min(14).max(18)` (toleram máscara; o client normaliza antes).

**Racional**: alinhar a validação de borda do client ao formato real; manter a mensagem `cnpj-invalid` já
existente. `act.model.ts` hoje só faz `.transform(onlyDigits)` — ganha o mesmo tratamento.

## D6 — Exibição em Contratos e Financeiro

**Decisão**: substituir as formatações locais "por dígitos" por `maskCnpj`/`maskCpf` do helper, decidindo
CPF×CNPJ por comprimento normalizado (14 → CNPJ, 11 → CPF). Pontos: `contract-list.view-model.ts`,
`contract-row.component.tsx`, `contract-info.component.tsx`, `contract-form.component.tsx`,
`amendment-modal.component.tsx`, `contas-a-pagar.view-model.ts`, `document-form.view.ts`.

**Racional**: valores alfanuméricos já armazenados precisam exibir sem perder letras. `document-form.view.ts`
também usa dígitos para a busca de fornecedor por subtitle → passa a normalizar alfanumérico (D7).

## D7 — Busca de fornecedor por CNPJ (Lançar Documento)

**Decisão**: o filtro do picker passa a comparar sobre o CNPJ **normalizado alfanumérico** (não só dígitos),
mantendo a busca por nome inalterada.

**Racional**: `document-form.view.ts:76` hoje compara `digits` do query com `digits` do subtitle; com
alfanumérico isso perde letras. Normalizar ambos os lados resolve.

## D8 — i18n

**Decisão**: adicionar tag para o erro `invalid-cnpj` (422) do backend no catálogo, reaproveitando o
mapeamento de erros de parceiros existente. Texto default em pt-BR (P.O. refina depois).

## D9 — Estratégia de testes (TDD)

**Decisão**:

- **RED primeiro**: `tests/shared/document/cnpj.test.ts` (node:test, imports relativos) com os fixtures do
  contrato — válidos (`11222333000181`, `12ABC34501DE35`, `A1B2C3D4E5F668`, com máscara, minúsculo) e
  inválidos de formato (`12ABC34501DEAB`, `00000000000000`, `123`, `112223330001810`).
- **VO**: estender `tests/.../value-objects.test.ts` com casos alfanuméricos (válido, DV inválido
  `12ABC34501DE34`, formato inválido). Atualizações **aditivas** — os casos numéricos existentes permanecem.
- **Não-regressão**: `pnpm test` + `pnpm test:dom` verdes; `pnpm typecheck` + `pnpm lint` 0 erros.
