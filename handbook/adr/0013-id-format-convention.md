[← Voltar para ADRs](./README.md)

# ADR-0013: Convenção de formatos de ID — UUID canônico para identidade, número de negócio para exibição

- **Status:** Accepted
- **Date:** 2026-06-10
- **Deciders:** Alessandra Castro (Frontend) + assistente IA
- **Alinha com:** core-api **ADR-0020** (MySQL-only; PK de domínio = UUID v4 gerado no domínio; `AUTO_INCREMENT` proibido em tabelas de domínio).

---

## Contexto

Ao consumir as novidades de contratos do core-api #32 (spec `019-contract-number-program`), descobrimos uma anomalia: `programId`/`budgetPlanId` estavam modelados como `z.number()` no front (legado/mock), enquanto **todo o resto do projeto já usa UUID string** (`contract.id`, `supplierId`, `financierId`, `collaboratorId`, `contractId`, `amendmentId`, `userId` — todos `z.uuid()`). Surgiu a proposta de manter, no BFF, uma **hashtable em memória UUID↔número** para preservar IDs numéricos no front.

Três especialistas (backend/core-api, TypeScript, Zod) avaliaram e foram **unânimes contra** a hashtable, e a favor de fixar uma convenção única. Fatos verificados:

- O **backend é UUID-only para PK** por decisão de ADR (ADR-0020). Não há nem está planejado um `private_id` numérico interno por entidade.
- Quando o domínio precisa de um número humano, o backend cria um **campo de negócio dedicado, persistido e UNIQUE**: `contract.sequentialNumber` (`NNNN/AAAA`), `amendment.amendmentNumber` (`NN/AAAA`), `program.programNumber` (inteiro). A API de programas **já expõe `id` (UUID) e `programNumber` juntos**.
- Uma hashtable no BFF é **estado efêmero** (some em restart/deploy), **inconsistente em multi-instância** (atrás do Caddy), sujeita a **colisão**, e recria um problema que o backend já resolve — promovendo acidentalmente um detalhe de processo a contrato de API.

## Decisão

Fixamos a seguinte convenção de identificadores, válida para todo o `web-app v2` (client + BFF):

| Categoria | Formato | Validação na borda (Zod) | Quando usar |
|---|---|---|---|
| **ID técnico** de entidade (PK, FK, referência cruzada, route param, query key) | **UUID v4 string** | `z.uuid()` (+ `.nullable().optional()` quando o campo é evolutivo/pode faltar) | **Sempre** para identidade, roteamento, links profundos e referências entre recursos |
| **Número de negócio** (exibível) | string `NNNN/AAAA` **ou** inteiro (`programNumber`) — **sempre vindo do backend**, persistido + UNIQUE | `z.string()` / `z.number()` conforme o backend entrega | Exibição e busca humana. **Nunca** como FK; **nunca** gerado/inventado no front ou no BFF |
| **Handle opaco não-UUID** (sessionId `__Host-session`, storageKey, token_hash) | string | `z.string().trim().min(1)` | Só quando o valor comprovadamente **não** é UUID |
| **PK natural** (uf, ibge_code, permission `name`) | string curta específica | schema próprio (ex.: `z.string().length(2)`) | Quando o identificador natural **é** o próprio dado de domínio |

### Regras (o "quando")
1. **Identidade, referência e navegação usam UUID.** O UUID é a única chave estável e globalmente única que o backend garante.
2. **Exibição para humano usa o número de negócio** (`sequentialNumber`, `programNumber`, …) — obtido do backend, nunca derivado no client/BFF.
3. **Proibido `z.number()` para ID técnico.** Proibido inventar número no BFF (sem hashtable, sem `Math.random`).
4. **Se uma entidade precisar de número humano e não tiver**, a resposta correta é **pedir um número de negócio persistido ao backend** (seguindo o padrão `sequentialNumber`), não simular no gateway.

### Tipagem (TypeScript)
- ID técnico é, no domínio, um **branded type** `Brand<string, '<Entidade>Id'>` (infra em `src/shared/primitives/brand.ts`), construído por smart constructor.
- **Decisão pragmática (2026-06-10):** a adoção dos branded types é **incremental** — não exigida de imediato em todos os campos. Por ora basta `z.uuid()` (string) na borda; a branding em `Brand<string,'XId'>` será aplicada num refactor dedicado. O brand vive no **domínio/mapper**, nunca no schema Zod (o schema infere `string`).

### Resiliência de leitura (corolário)
- Campos evolutivos de leitura: `.nullable().optional()` (cobre ausente **e** `null`).
- `discriminatedUnion` por status/kind deve ter um **branch de escape** (`status: z.string()`) para valores futuros do backend (ex.: `'Cancelled'`), para não zerar a linha no grid; `safeParse` por item no mapper.

## Consequências

- **Positivas:** identidade estável ponta a ponta; zero estado no BFF; alinhamento com o backend (ADR-0020) e com a infra de branding já existente; elimina a classe de bug "ID inventado/efêmero".
- **Custo:** corrigir a anomalia `programId`/`budgetPlanId` (`number → z.uuid()`); onde a UI quiser número de programa, usar `programNumber` do backend (não a PK).
- **Dívida registrada (não bloqueante):** os números de negócio têm formatos heterogêneos (contrato `NNNN/AAAA`, aditivo `NN/AAAA`, programa inteiro cru). Padronizar é um ticket futuro de backend, não tratado aqui.

## Referências
- core-api `handbook/architecture/adr/0020-mysql-only-supersedes-dual-dialect.md` (UUID-only, no-autoincrement).
- core-api `src/modules/programs/adapters/http/schemas.ts` (API expõe `id: uuid` + `programNumber`).
- `src/shared/primitives/brand.ts` (mecanismo `Brand<T,K>`, restrito a VOs folha).
- spec `specs/019-contract-number-program/` (origem da decisão).
