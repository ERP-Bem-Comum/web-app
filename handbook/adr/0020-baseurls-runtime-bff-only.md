[← Voltar para ADRs](./README.md)

# ADR-0020: core-api exposto via HTTPS, mas o browser fala só com o BFF; base URLs em env runtime (nunca `VITE_`)

- **Status:** Accepted
- **Date:** 2026-06-24
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente
- **Feature:** `specs/035-prod-deploy-hardening/` (D9) · **Pesquisa:** `research.md` R6, R7
- **Relacionado:** reafirma §III/§IX, ADR-0010 (BFF orquestrador), e o ADR-0005 do **core-api** (thin BFF) sob novo contexto

> **Emenda (2026-06-25) — incidente de prod:** o `CORE_API_URL` de prod foi setado **sem o `/api`** (só o host).
> Como era uma URL válida, passava no boot; mas `coreApiBase()` derivava `{host}/v2` → **todo `/auth/*` dava 404**
> → o BFF mapeava pra `"server"` e o login quebrava silenciosamente (o `/ready` passava porque só sonda o
> `/health` do host). **Correção:** o `EnvSchema` agora valida que `coreApiBase(CORE_API_URL, 'v2')` termina em
> `/api/v2` (refine Zod) → **fail-fast no boot** (boot-env) e **`/ready` 503**, em vez de degradar em runtime.
> Contrato reforçado: `CORE_API_URL` **deve incluir `/api`** (`https://host/api` ou `…/api/v2`).

---

## Contexto

Foi decidido **expor o core-api via HTTPS** para **outros consumidores** (mobile, integrações externas,
frontend legado). Isso muda a premissa que a topologia assumia (core-api **interno**, nunca acessível ao
browser) e cria **dois riscos**:

1. **Risco de arquitetura:** um dev apontar o **browser** do nosso front direto para o core-api público —
   quebrando a **fronteira única do BFF** (§III, ADR-0010) e a invariante **token nunca no browser** (§IX,
   ADR-0005 do core-api), e passando a **exigir CORS** (que hoje não existe — research R6).
2. **Operação:** trocar o DNS do core-api **sem recompilar** o front.

Fato técnico (Vite/TanStack Start): variáveis **`VITE_*`** são **inlined no bundle em build-time** (mudar →
**rebuild**); variáveis **server-side** (`process.env`) são lidas em **runtime** pelo Nitro (mudar → restart,
sem rebuild). A confirmação de sessão server-side (cookie opaco `__Host-session`, tokens no servidor) está
alinhada ao OWASP OAuth 2.0 BCP / Session (research R7).

## Decisão

Mesmo com o core-api **público via HTTPS**, **o browser do nosso front continua falando só com o BFF**
(server function). Toda chamada client→core-api é **server-side**; preserva §III/§IX, ADR-0005/0010 e a
postura **same-origin sem CORS**.

As **base URLs** do core-api são **env server-side runtime**, validadas por Zod (`src/external/config/
env.config.ts`). Hoje uma única `CORE_API_URL` cobre **v1 e v2** (o helper `coreApiBase()` deriva a versão —
ADR-0033 do core-api); uma base **adicional** só entra para um **host/serviço distinto** (não para versão).
**Nunca `VITE_`** —
trocar DNS = mudar env + restart, **sem recompilar**. Garantia por lint/teste: **nenhuma URL/segredo** em
variável `VITE_`.

## Consequências

**Positivas**
- DNS muda sem rebuild; nenhuma URL/segredo vaza no bundle do browser.
- Invariantes de segurança intactas mesmo com o core-api público — este ADR é o **guard-rail** explícito.

**Negativas / custos**
- Exige disciplina: "core-api público" **não** autoriza chamá-lo do browser. Coberto por este ADR + teste.

**Ponto de troca / reversibilidade**
- Se um dia o **browser** precisar de uma base URL, usar **runtime-config injetado** (SSR `window.__APP_CONFIG__`
  ou `/config.json`) — **não** `VITE_` — para manter o "sem rebuild". Chamar o core-api do browser exigiria um
  ADR novo que supersede §III/ADR-0005 + CORS no core-api.

## Alternativas consideradas

| Alternativa | Por que rejeitada |
|---|---|
| Browser chama o core-api direto | Quebra §III/§IX e ADR-0005/0010; exigiria CORS + token no browser. |
| `VITE_CORE_API_URL` (build-time) | Inlined no build ⇒ **recompila** quando o DNS muda — o oposto do objetivo. |
| Hardcode da URL no código | Acopla deploy ao build; impossível trocar DNS sem rebuild. |

## Referências

- `specs/035-prod-deploy-hardening/research.md` R6/R7 · `spec.md` FR-008/009/012/029
- Constituição §III (server fn é a única fronteira), §IX (token nunca no browser) · ADR-0010 (BFF) · core-api ADR-0005 (thin BFF)
- OWASP: CORS (REST/HTML5 cheat sheets) · OAuth 2.0 Security BCP · Session Management cheat sheet
