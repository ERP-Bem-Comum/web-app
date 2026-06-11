# Research: Anexo do documento assinado e efetivação do contrato (017)

Decisões técnicas que destravam o plano. Cada uma: **Decisão · Racional · Alternativas rejeitadas**.

## R1 — Como levar os bytes do PDF: browser → server function → core-api

**Decisão**: o client lê `await file.arrayBuffer()` → converte para **base64** e envia **string** no input da server function (validada por Zod). O **BFF** decodifica a base64 para `Uint8Array` e faz `POST` em `application/octet-stream` ao core-api, com os metadados na **query string**.

**Racional**:
- Há **precedente** no repo de "arquivo como string através do Zod": o import de colaboradores lê `File.text()` e envia o CSV como `z.string()` (`collaborator.io.ts`). Base64 é o equivalente para binário.
- Mantém a server function com `inputValidator(Zod)` (objeto simples), consistente com todas as outras fns do projeto, sem introduzir manejo de `FormData`/streaming.
- O confinamento do token e a tradução octet-stream ficam no BFF (§III/§IX): o browser nunca fala octet-stream com o core-api.

**Limite/atenção**: base64 infla ~33% → um PDF de 20 MiB vira ~27 MB de string no payload browser→BFF (Nitro). **Validamos o tamanho do arquivo ORIGINAL (≤20 MiB) na borda, antes de inflar.** O `POST` BFF→core-api envia binário cru, então o core-api vê ≤20 MiB (respeita o parser octet-stream de 20 MiB da rota; o limite global de 1 MiB do core-api **não** se aplica a essa rota, que tem parser próprio).

**Alternativas rejeitadas**:
- **`FormData`/multipart direto na server fn**: TanStack Start suporta, mas não há precedente no repo e foge do padrão `inputValidator(Zod)`; mais código de borda, menos uniforme.
- **Upload direto browser→core-api (presigned/CORS)**: viola §III (browser não fala com core-api) e §IX (token).

## R2 — `resultFetch` não serve para binário: helper de borda dedicado

**Decisão**: adicionar um helper em `src/external/core-api/` para `POST` **binário** (`application/octet-stream`) com **query string** e `Authorization` — separado do `resultFetch` (que injeta `application/json` e serializa o body como JSON). Devolve `Result<T, HttpError>` igual ao `resultFetch` (mesma cadeia de erro §V). Aditivo, não altera o `resultFetch` existente.

**Racional**: o duplo `content-type` já nos mordeu (o 415 do contrato). Um helper específico evita gambiarra no `resultFetch` e mantém a cadeia de erro/Result idêntica. A rota de **activate** continua usando o `resultFetch` normal (JSON `{signedAt}`).

**Alternativas rejeitadas**: parametrizar o `resultFetch` com flag `raw` — mais intrusivo no caminho crítico de todas as chamadas; preferimos um helper isolado e testável.

## R3 — Ordem e orquestração: upload → activate, no BFF (single use-case)

**Decisão**: o BFF expõe um caso de uso `attachSignedDocument(id, {bytes, fileName, signedAt}, token)` que **orquestra**: (1) `POST .../documents` (categoria `signed_contract`, `mimeType application/pdf`, `signedElectronically=true`); se `ok`, (2) `POST .../activate` com `{signedAt}`; devolve o **contrato efetivado** (`Result<Contract, ContractsError>`). A server function `attach-signed-document.service.fn.ts` chama só esse use-case.

**Racional**: a ordem é **obrigatória** no core-api (activate exige o documento `signed_contract` já presente, senão 409 `activate-contract-no-signed-document`). Orquestrar no BFF (§III: "BFF orquestra, devolve fn completa") deixa o client com **uma** chamada e o estado resultante. Coerente com a regra: "incluir o documento dispara o evento de status".

**Alternativas rejeitadas**: duas server-fns chamadas em sequência pelo client — espalha a orquestração e o tratamento de falha parcial na UI, contra §III.

## R4 — Falha parcial e idempotência (FR-012, edge cases)

**Decisão**:
- Se o **upload** falha → contrato permanece **Pendente**; retorna erro mapeado; nada a desfazer.
- Se o **upload ok** mas o **activate** falha → o documento ficou registrado, contrato segue **Pendente**; retorna erro. **Recuperação**: a ação "Incluir documento assinado" detecta, ao reenviar, que já existe documento `signed_contract` (erro `document-already-superseded`/já existe) e, nesse caso, **pula o upload e tenta só o activate**. (Detalhe de implementação no use-case; manter idempotente.)
- No **fluxo de criação** (US2): `createContract` (fn existente) primeiro; em sucesso, se há arquivo, chama `attachSignedDocument`. Se o attach falhar, o contrato **já existe como Pendente** (aparece na grade) e a UI mostra o erro orientando a incluir depois (US3). Nunca perde o contrato.

**Racional**: alinha com FR-012 e os edge cases; aproveita os erros `document-*` que o core-api já distingue.

**Alternativas rejeitadas**: transação atômica create+upload+activate — impossível sem suporte transacional do core-api; o modelo Pendente→efetivo já é o mecanismo de recuperação.

## R5 — Validação na borda (server-fn) antes de enviar

**Decisão**: na server function (borda, onde `throw` é permitido e convertido p/ `Result`):
- **PDF real**: primeiros bytes decodificados == `%PDF` (`0x25 0x50 0x44 0x46`) → senão `Result.err('invalid-pdf')` (espelha `document-magic-bytes-mismatch` do backend, falhando cedo).
- **Tamanho**: bytes originais ≤ `20 * 1024 * 1024` → senão `'file-too-large'`.
- **fileName**: 1–255 chars, sem separadores de path (`/\\:*?"<>|`); derivado de `File.name`, sanitizado.
- **signedAt**: obrigatória; data válida; **não-futura** (assinatura é fato passado — *assumption* da spec) → senão `'signed-at-in-future'`/`'invalid-signed-at'`.

**Racional**: falhar cedo no front melhora UX e evita round-trip; o backend continua sendo a autoridade (revalida). §IX validação na fronteira.

**Atenção**: a regra **não-futura** é uma *assumption* da spec (a confirmar com a stakeholder); fácil de relaxar removendo só essa checagem.

## R6 — RBAC no client para contracts

**Decisão**: criar `src/modules/contracts/client/data/helpers/can.ts` espelhando `partners/client/data/helpers/can.ts`: união `ContractPermission = 'contract:read' | 'contract:write' | 'contract:mass-approve'`, `can(granted, required)`. As ações de anexar (modal no create e no detalhe/grade) só aparecem com `contract:write`. As permissões vêm do `CurrentUser` (já propagado do `/me`).

**Racional**: hoje o client de contracts não checa permissão (só a server-fn checa). Para esconder a ação corretamente (FR-008), precisamos do helper — padrão já existente em partners.

**Alternativas rejeitadas**: checar permissão só no servidor — a UI mostraria um botão que sempre falha; ruim de UX e contra a spec.

## R7 — Pontos de entrada na UI

**Decisão**: um **modal compartilhado** `attach-document-modal.component.tsx` (view burra; reaproveita a UI de upload/drag-drop e o campo de data já existentes no `contract-create.page.tsx`). Usado em:
- **US2 (criação)**: o `contract-create.page` já tem o modal de finalização com upload; o `handleConfirm` passa a, após `create`, chamar `attachSignedDocument` quando há arquivo.
- **US3 (posterior)**: botão "Incluir documento assinado" no **detalhe** (`contract-documents.component.tsx`), visível só para contrato **Pendente** + `contract:write`, abrindo o modal. (Ação equivalente na **grade** `contract-row` é opcional/secundária — decidir em tasks.)

**Racional**: um componente, dois usos; menos duplicação; mantém views burras (§XI).

## R8 — Mapeamento de erros → tags i18n (cadeia §V)

**Decisão**: estender o `ContractsError` (valores) e o `toErrorTag`/switch da view-model para cobrir: `document-magic-bytes-mismatch` → `contracts.attach.error.invalid-pdf`; `file-too-large` → `...too-large`; `activate-contract-no-signed-document` → `...no-document`; `document-contract-mismatch`/`document-already-*` → `...conflict`; genéricos → `...failed`. Switch exaustivo com guarda `never` (§IV/§V).

**Racional**: a UI nunca olha status HTTP; só `kind` → tag. Garante exaustividade no build.
