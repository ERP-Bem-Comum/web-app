[← Voltar para ADRs](./README.md)

# ADR-0023: Toolchain em versão única — Node 26 lido do `.nvmrc`, pnpm com hash, corepack por tarball e TypeScript 7 lado a lado

- **Status:** Accepted
- **Date:** 2026-11-12
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente IA
- **Supersedes (parcial):**
  - [ADR-0015](./0015-web-image-distroless.md), só o trade-off (b) da emenda de 2026-06-25: _"build (Node 24) ≠
    runtime (Node 26) é aceitável"_. O resto do ADR-0015 (Chainguard/Wolfi, non-root, `.output` self-contained) segue.
  - [ADR-0003](./0003-pnpm-v11-supply-chain.md), só a versão `11.5.0` e o _"corepack pnpm@11.5.0"_ do `web.Dockerfile`.
    O pin via `packageManager`, a política de supply-chain e o "nunca npm" seguem em vigor.
- **Linear:** CAS-108 (bc-erp-60) · espelha o ADR-0073 do core-api (Node em fonte única)

---

## Contexto

Medido em 12/11/2026 (`origin/develop` @ `492d119e`): o web-app declarava o Node em quatro versões ao mesmo tempo.
O CI testava no **22**, o build rodava no **24**, a produção no **26** e os tipos (`@types/node`) eram do **25**, uma
linha ímpar que nunca vira LTS. O CI não testava o que roda em produção, e no CAS-107 foi preciso varrer o
repositório para achar onde a versão estava escrita.

Três fatos externos pesaram:

1. O **Node 26 virou LTS em 28/10/2026**.
2. O **Node 25 deixou de distribuir o corepack**: _"Corepack will no longer be distributed starting with Node.js
   v25"_ (nodejs.org/docs/v25 › corepack). A imagem `node:26` traz só o npm, e o build quebrava com
   `corepack: not found`. A recomendação oficial é o módulo da comunidade.
3. O **typescript-eslint ainda exige `typescript >=4.8.4 <6.1.0`** (issue typescript-eslint #10940, aberta). O
   backend experimental `tsgo` (PR #12803) exige o TS 7.1 beta e é mais lento. O TS 7 mediu, neste repositório,
   `tsc` em ~1,4 s contra 9,7 s do TS 6, com o mesmo resultado.

## Decisão

**D1 — `.nvmrc` é a fonte única da versão do Node.** `ci.yml` (`node-version-file`), `engines.node`,
`devEngines.runtime`, `@types/node` e a base do `web.Dockerfile` derivam dele. O
`tests/architecture/node-version-single-source.test.ts` reprova divergência. O runtime Chainguard só publica
`:latest` (a tag não diz versão): o LABEL `br.bemcomum.node.major` declara o major, e o `build-publish.yml` roda
`node --version` dentro da imagem e barra a promoção da `:qa` se o major real divergir. **Build e runtime ficam no
mesmo major.**

**D2 — corepack por tarball conferido, sem npm.** O estágio `base` baixa `corepack-<versão>.tgz` direto do registry
com `ADD --checksum=sha256:…` (o BuildKit recusa o arquivo se o hash não bater), extrai e liga o binário. É JS puro,
sem script de instalação, e nada passa pelo npm. O `packageManager` leva o hash `+sha512` do pnpm, que o corepack
confere, como o core-api já fazia.

**D3 — pnpm 11.28.11**, a última da linha 11, que o pnpm ainda mantém em paralelo à 12 (as duas saíram em 05/11).
A 12 é major e fica para um ADR próprio.

**D4 — TypeScript 7 no `tsc`, TypeScript 6 no lint (alias lado a lado).** `"@typescript/native": "npm:typescript@7.0.2"`
fornece o `tsc` do gate; `"typescript": "npm:@typescript/typescript6@^6.0.2"` alimenta o typescript-eslint, que
continua com todos os plugins. **Saída:** quando o typescript-eslint aceitar o TS 7 (issue #10940), o alias sai e
o `typescript` volta a ser o 7. O nome `@typescript/native` já é o que o backend `tsgo` vai exigir.

**D5 — `devEngines.runtime` com `onFail: "download"`, igual ao core-api.** O pnpm usa o Node certo mesmo quando a
máquina está em outro (o `fnm` local, por exemplo). Custo aceito: o lockfile registra `node@runtime:<versão>` e o
install baixa esse runtime também no CI e no Docker, onde o Node já é o mesmo.

**D6 — `@tanstack/react-router-ssr-query` fixo em `1.167.2`, versão exata.** A 1.167.3 introduz `releaseLock()`, que
congela o Safari/WebKit (TanStack #8795; correção no PR #8796, aberto). Tirar o pin quando a correção sair, e
atualizar junto com a família do router (`react-router`, `router-core`).

## Consequências

**Positivas**

- O CI testa no mesmo Node da produção, e trocar de versão é editar uma linha.
- Typecheck ~3× mais rápido no gate.
- Nada no build passa pelo npm, e corepack e pnpm entram com hash conferido.

**Negativas / custos**

- Dois compiladores instalados (D4). O lint enxerga a API do TS 6 enquanto o gate usa o 7; divergência é possível
  em recurso novo do 7.
- Download extra do runtime em CI e Docker (D5).
- Atualizar o corepack exige recalcular o sha256 do tarball (D2). O comentário no `web.Dockerfile` diz como.

## Alternativas consideradas

- **oxlint no lugar do ESLint** (o caminho do core-api, ADR-0072 de lá): rejeitado aqui. O oxlint não tem
  `no-restricted-syntax`, e com isso caem as travas de XSS, MVVM e tokens do design system, além de boundaries,
  i18next, security, no-secrets e os plugins do TanStack (os plugins JS do oxlint não recebem informação de tipo).
- **Ficar no TS 6.0.3**: sem custo, mas sem o ganho de tempo do gate. O alias tem saída limpa.
- **`npm install -g corepack`**: viola o "nunca npm" do ADR-0003 e instala sem hash.
- **pnpm 12**: major, fora do escopo de um débito técnico.
