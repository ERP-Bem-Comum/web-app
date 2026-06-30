[← Voltar para ADRs](./README.md)

# ADR-0003: pnpm v11 pinado + supply-chain hardening

- **Status:** Accepted
- **Date:** 2026-05-29
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente

---

## Contexto

O v2 vinha rodando com o pnpm global do ambiente (**10.33.4**), sem pin (`packageManager` ausente) e
sem nenhuma política de supply-chain. O `handbook/reference/pnpm/supply-chain-security.md` recomenda
mitigações (bloquear postinstall, atrasar versões recém-publicadas, política de confiança) — escritas
na ótica da **v11**, cujos defaults já são mais seguros. pnpm **11.5.0** era o estável atual.

Risco real observado: pacotes comprometidos costumam atacar via `postinstall`; versões recém-publicadas
são a janela de exposição antes da detecção.

## Decisão

**Pinar pnpm `11.5.0`** via `packageManager` (corepack) e aplicar **supply-chain hardening** em
`pnpm-workspace.yaml`:

- `allowBuilds` — allowlist explícita de quem pode rodar build script (default bloqueia o resto;
  `unrs-resolver: false`, pois funciona via prebuilds napi).
- `blockExoticSubdeps: true` — bloqueia trans-deps de fontes exóticas (git/tarball).
- `minimumReleaseAge: 1440` + `minimumReleaseAgeStrict` + `minimumReleaseAgeIgnoreMissingTime` —
  quarentena de 1 dia para versões novas (exceções por **versão exata** para deps já vetadas).
- `trustPolicy: no-downgrade` (+ `trustPolicyExclude` para `semver@6.3.1`, falso-positivo antigo).
- Lockfile commitado; CI entra em frozen-lockfile automaticamente.

`web.Dockerfile` alinhado (corepack pnpm@11.5.0, copia `pnpm-workspace.yaml` antes do install).

## Consequências

**Positivas**
- Builds reprodutíveis (mesma versão em dev/CI/Docker) — constituição §IX.
- Janela de ataque por postinstall e por versão recém-publicada drasticamente reduzida.
- A política **funcionou na prática**: barrou um `TRUST_DOWNGRADE` (semver) e versões <1 dia (TanStack).

**Negativas / custos**
- `minimumReleaseAge` atrita com deps que publicam diariamente (TanStack) → exige exceções por versão
  exata no install inicial (documentadas em `pnpm-workspace.yaml`).
- Build não é hermético offline (valida metadados de data no registry).

**Neutras**
- Migração v10→v11 reescreveu o `node_modules` (layout novo) — aceito uma vez.

## Alternativas consideradas

- **Ficar na 10.33.4 sem pin** — rejeitada: não-determinístico, e v10 não tem os defaults/keys de
  supply-chain da v11 (`minimumReleaseAgeStrict` etc.).
- **Excluir TanStack por escopo (`@tanstack/*`)** no `minimumReleaseAge` — rejeitada: desligaria a
  quarentena do framework inteiro; preferiu-se exceção por **versão exata** (protege updates futuros).
- **`dangerouslyAllowAllBuilds`** — rejeitada (anula a proteção de postinstall).

## Referências

- `handbook/reference/pnpm/supply-chain-security.md` e `settings.md`
- `pnpm-workspace.yaml` (políticas) · `package.json` (`packageManager`) · `web.Dockerfile`
- `.specify/memory/constitution.md` §IX
