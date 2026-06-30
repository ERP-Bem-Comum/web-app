# TICKET-002 — Gate de qualidade e infraestrutura de tooling

> **Tipo:** infraestrutura / qualidade · **Branch de origem:** `review/contracts-detail-hardening`
> **Relacionado:** [TICKET-001](./TICKET-001-contracts-detail-and-partners-correcoes.md) (achados de código) ·
> [Relatório](./2026-06-08-code-review-contracts-detail-and-partners.md) (§"por que a tooling não pegou")

---

## Contexto — o diagnóstico

A investigação do code-review revelou que **não existe nenhum gate automático que reprove código ruim**:

| Camada | Estado hoje | Consequência |
|---|---|---|
| **ESLint** | roda, mas com lacunas | a maioria dos achados é classe **sem regra**; C1 caiu em **gap da regra `purity`** (`new Date()` não coberto). |
| **Hooks** | só do Claude Code, nesta máquina | `eslint-fix` não bloqueia; `verify-gate` é só lembrete (gate real exige `CLAUDE_VERIFY_GATE=1`). **Sem git hook** (husky/lint-staged ausentes). |
| **Prettier** | **inexistente** | nenhuma formatação enforçada (e o ESLint `stylisticTypeChecked` **não** formata whitespace). |
| **CI** | `deploy-qa.yml` só build+deploy | **não roda lint/typecheck/test**; dispara em push na `develop`, **não em PR**. |

**Resultado:** o `pnpm verify` depende de alguém rodar à mão. Um humano (ou outro assistente) commita e
faz push sem nenhuma verificação. Este ticket fecha esse buraco.

## Decisões já tomadas (dono do projeto)

- **Prettier:** instalar, mas **formatar só daqui pra frente** (via lint-staged nos arquivos tocados) —
  **não** reformatar a base agora (evita diff gigante; reformatação total fica para um PR isolado).
- **Gate:** **defesa em profundidade** — git hook local (husky + lint-staged) **e** CI em PR.

---

## Como usar este ticket

Cada item (G1…G6) tem comandos e snippets prontos. Há um **teste de regressão do gate**
(`tests/architecture/regression-gate-infra.test.ts`) que **falha hoje** e vira verde conforme o gate é
montado — a mesma lógica do TICKET-001 (TDD reverso).

```bash
pnpm test tests/architecture/regression-gate-infra.test.ts   # 🔴 hoje → 🟢 ao concluir
```

> ⚠️ **Supply-chain (pnpm 11).** O `pnpm-workspace.yaml` tem `minimumReleaseAge: 1440` (quarentena de 1 dia)
> e `allowBuilds` (allowlist de postinstall). As deps abaixo são maduras e estáveis → passam a quarentena
> sem `minimumReleaseAgeExclude`. Nenhuma roda build script de install, exceto a nuance do `prepare` do
> husky — explicada em G2. **Nunca** usar `dangerouslyAllowAllBuilds`.

---

## Índice

| # | Item | Fecha |
|---|------|-------|
| [G1](#g1) | Prettier (sem reformatar a base) | formatação inexistente |
| [G2](#g2) | husky + lint-staged (pre-commit + pre-push) | sem git hook |
| [G3](#g3) | CI em PR (workflow rodando `pnpm verify`) | CI não roda lint/test |
| [G4](#g4) | `verify-gate` bloqueante (sessões do Claude) | hook só lembra |
| [G5](#g5) | Ativar as regras de hardening H1–H5 | gaps de regra (ver TICKET-001) |
| [G6](#g6) | Teste de governança do gate | gate pode ser removido sem aviso |

---

<a id="g1"></a>
## G1 — Prettier (instalar, formatar só daqui pra frente)

**🎯 Objetivo.** Formatação consistente e automática, sem reformatar a base inteira agora.

**Por que não conflita com o ESLint:** `typescript-eslint` removeu as regras de formatação (whitespace)
nas versões recentes — `stylisticTypeChecked` cuida de *escolhas de estilo* (ex.: `prefer-function-type`),
não de espaçamento. Mesmo assim, adicionamos `eslint-config-prettier` para desligar qualquer conflito.

**Passos**
```bash
pnpm add -D prettier eslint-config-prettier
```

`.prettierrc.json` (casa o estilo atual da base — minimiza diff: sem `;`, aspas simples, linhas largas):
```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 120,
  "trailingComma": "all",
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

`.prettierignore`:
```
dist
.output
.nitro
.tanstack
node_modules
core-api
pnpm-lock.yaml
**/routeTree.gen.ts
e2e
```

`eslint.config.js` — adicionar `eslintConfigPrettier` como **último** item do array (desliga regras conflitantes):
```js
import eslintConfigPrettier from 'eslint-config-prettier'
// ...
export default tseslint.config(
  // ...todos os blocos existentes...
  eslintConfigPrettier, // ← SEMPRE por último
)
```

`package.json` scripts:
```jsonc
"format": "prettier --write .",
"format:check": "prettier --check ."
```

> ⚠️ **NÃO** rode `pnpm format` na base inteira nesta etapa (decisão: só daqui pra frente). A reformatação
> total, se desejada, vai num PR **isolado** (commit único, fácil de revisar/ignorar no `git blame` via
> `.git-blame-ignore-revs`).

**✅ Validar:** `pnpm format:check` roda sem erro de config; editar um arquivo e ver `lint-staged` formatá-lo (G2).

---

<a id="g2"></a>
## G2 — husky + lint-staged (git hook local)

**🎯 Objetivo.** Pegar problemas **antes do commit/push**, na máquina do dev.

```bash
pnpm add -D husky lint-staged
pnpm exec husky init     # cria .husky/ e adiciona "prepare": "husky" ao package.json
```

> 🔐 **Supply-chain:** o `husky init` adiciona o script **`prepare`** ao **nosso** `package.json` (roda
> `husky` após o install). Isso é um lifecycle script **do projeto**, não um postinstall de **dependência**
> — portanto **não** entra na allowlist `allowBuilds` (que governa build scripts de pacotes de terceiros).
> Nenhuma ação em `pnpm-workspace.yaml` é necessária.

`.husky/pre-commit`:
```sh
pnpm exec lint-staged
```

`.husky/pre-push`:
```sh
pnpm verify
```

`package.json` → bloco `lint-staged` (formata + lint só nos arquivos staged):
```jsonc
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"]
}
```

> ⚠️ O `--no-verify` permite burlar o hook local — por isso o CI (G3) é a rede **final** e inviolável.
> O `pre-push` roda `pnpm verify` (typecheck + lint + test) para não empurrar nada quebrado.

**✅ Validar:** introduzir um erro de lint, tentar `git commit` → deve **bloquear**.

---

<a id="g3"></a>
## G3 — CI em PR (a rede final, inviolável)

**🎯 Objetivo.** Reprovar PR que não passa em `verify`. Independe da máquina/boa-vontade do dev.

Criar `.github/workflows/ci.yml`:
```yaml
name: ci
on:
  pull_request:
    branches: [develop, main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
        with:
          version: 11.5.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm test
      - run: pnpm test:dom
```

> 🔐 **Supply-chain no CI:** `pnpm install --frozen-lockfile` instala exatamente o lockfile — **não resolve
> versões novas**, então a quarentena `minimumReleaseAge` não bloqueia o CI. Se algum dia bloquear, é sinal
> de lockfile dessincronizado (corrigir localmente, não afrouxar a política).

> Marcar este workflow como **required status check** em `Settings → Branches → develop` para travar o merge.

**✅ Validar:** abrir um PR de teste com erro de lint → o check `ci / verify` fica vermelho e bloqueia o merge.

---

<a id="g4"></a>
## G4 — `verify-gate` bloqueante (sessões do Claude Code)

**🎯 Objetivo.** Tornar o Stop hook (`.claude/hooks/verify-gate.sh`) um **gate real** (hoje é só lembrete).

O script já suporta o modo bloqueante via env var. Em `.claude/settings.json`, adicionar:
```jsonc
{
  "env": { "CLAUDE_VERIFY_GATE": "1" }
}
```
Assim, ao fim de toda sessão que tocou código, o hook roda `pnpm typecheck && pnpm lint` e **devolve os
erros ao assistente** (exit 2) antes de finalizar.

> Vale só para sessões do Claude Code — é complementar (não substitui) G2/G3.

**✅ Validar:** numa sessão, introduzir erro de lint e parar → o hook deve reabrir com os erros.

---

<a id="g5"></a>
## G5 — Ativar as regras de hardening H1–H5

As 5 regras de lint que fecham os **gaps de cobertura** (anti `new Date()`, i18n, zod-no-domain,
CSS physical, invalidate sem escopo) estão **especificadas no [TICKET-001 §Regras](./TICKET-001-contracts-detail-and-partners-correcoes.md#regras)**.

⚠️ **Ative cada regra junto da correção do achado correspondente** (TICKET-001), senão o `pnpm lint` quebra
com as violações ainda presentes. Por isso elas vivem no TICKET-001 (lado a lado com o fix), e este ticket
só as referencia.

---

<a id="g6"></a>
## G6 — Teste de governança do gate

Para o gate **não ser removido sem aviso**, há um teste de regressão que valida sua presença:
`tests/architecture/regression-gate-infra.test.ts` (já nesta branch — **vermelho** até G1–G3 concluírem).
Ele assert:

- `package.json` tem `prettier`, `husky`, `lint-staged` em `devDependencies`;
- `package.json` tem o bloco `lint-staged` e os scripts `format`/`format:check`;
- existem `.husky/pre-commit` e `.husky/pre-push`;
- existe `.github/workflows/ci.yml` rodando `pnpm verify`/`lint`/`test` em `pull_request`.

---

## ✅ Checklist de aceite (Definition of Done)

- [ ] **G1** Prettier + `eslint-config-prettier` instalados; `.prettierrc.json`, `.prettierignore`, scripts `format`/`format:check`; `eslintConfigPrettier` por último no `eslint.config.js`. Base **não** reformatada.
- [ ] **G2** husky + lint-staged; `.husky/pre-commit` (lint-staged) e `.husky/pre-push` (`pnpm verify`); bloco `lint-staged` no `package.json`.
- [ ] **G3** `.github/workflows/ci.yml` rodando `verify` em PR; marcado como **required check** na `develop`.
- [ ] **G4** `CLAUDE_VERIFY_GATE=1` no `.claude/settings.json`.
- [ ] **G5** Regras H1–H5 ativas (junto das correções do TICKET-001).
- [ ] **G6** `regression-gate-infra.test.ts` **verde**.
- [ ] `pnpm verify` + `pnpm format:check` verdes localmente e no CI.

---

## Ordem sugerida

1. **G1 + G2** juntos (formatação + hook local) — retorno imediato no fluxo do dev.
2. **G3** (CI em PR) — a trava inviolável; marcar required check.
3. **G4** (sessões do Claude).
4. **G5** conforme o TICKET-001 for sendo executado.
5. **G6** vira verde sozinho ao concluir G1–G3.

---
🤖 Gerado com [Claude Code](https://claude.com/claude-code)
