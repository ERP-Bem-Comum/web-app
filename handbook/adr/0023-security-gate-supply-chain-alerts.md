[← Voltar para ADRs](./README.md)

# ADR-0023: Gate de segurança obrigatório na supply-chain, camada de homologação e alerta imediato

- **Status:** Accepted
- **Date:** 2026-10-28
- **Deciders:** Alessandra Castro (P.O.) + assistente IA · revisão: Gabriel Aderaldo (tech lead)
- **Relacionados:** [ADR-0003](./0003-pnpm-v11-supply-chain.md) (pnpm e supply-chain), [ADR-0011](./0011-no-mocks-in-production.md)
  (sem mocks em `src/`), [ADR-0016](./0016-image-provenance-sbom.md) (provenance da imagem),
  [ADR-0018](./0018-deploy-tailscale-oidc.md) (actions por SHA), constituição §VIII e §IX
- **Espelho no backend:** core-api (mesma política; workflow `audit.yml` e gate de promoção)

---

## Contexto

Em 28/10/2026, na preparação da promoção da rc.6, o `pnpm audit` mostrou o seguinte quadro:

- **Front:** 3 vulnerabilidades críticas e 14 altas em dependências de **produção**, incluindo XSS refletido sem
  autenticação no `@tanstack/react-start` e uma falha no `seroval` (serialização do SSR).
- **core-api:** 1 alta no `zod` (esgotamento de memória).

Tudo isso já estava em produção. Ninguém sabia, porque nada obrigava a reagir:

1. O CI do front **não auditava dependências**. Só o Trivy olhava a imagem, depois do build.
2. No core-api a auditoria existia, mas **não era check obrigatório**. Ela só rodava quando o PR mexia em
   dependência, e o agendado falhava desde 26/10 (#1087) com o vermelho visível apenas na aba Actions.
3. A `main` e a `develop` do front **não tinham proteção de branch**: push direto, force-push e exclusão
   eram possíveis.
4. O CI usava **actions por tag** (`@v4`), contrariando o ADR-0018. Tag é móvel: quem controla o
   repositório da action troca o código sob o mesmo nome.
5. O escaneamento de segredos estava desligado nos dois repositórios, que são públicos.
6. Os PRs de segurança do Dependabot miram a `main` e pulam a homologação, então acabavam fechados sem merge.

Uma trava **funcionou**: o `trustPolicy: no-downgrade` do pnpm recusou o `seroval@1.7.2`, publicado sem
provenance depois de duas versões com _trusted publisher_. Esse é o sinal clássico de pacote sequestrado. Uma
trava que segura um ataque não pode depender de alguém lembrar de não apagá-la.

A varredura do mesmo dia achou ainda **dado fabricado chegando à tela como real**: Dashboard e relatórios. O
material escapava do ADR-0011 com outro nome (`*.placeholder.ts`, `*_PLACEHOLDER`), e os comentários diziam
"NÃO é mock".

## Decisão

A segurança da supply-chain e o caminho até a produção são **barrados por máquina**, não por memória ou boa
vontade. Toda falha **avisa uma pessoa** na hora.

**1. Impedir (configuração do GitHub)**

- **Proteção de branch** em `main` e `develop`:
  - PR obrigatório;
  - checks obrigatórios `typecheck + lint + tests`, `audit (produção — bloqueante)` e
    `homologação (origem do PR)`;
  - branch atualizada antes do merge;
  - sem force-push e sem exclusão;
  - conversas resolvidas.
- **Escaneamento de segredos com bloqueio no push**, **CodeQL** (suite estendida), **alertas e correções do
  Dependabot** e **reporte privado de vulnerabilidade** ([SECURITY.md](../../SECURITY.md)).
- **CODEOWNERS**: mudança em `.github/`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`,
  `eslint.config.js`, ADRs e nos testes de governança pede revisão do tech lead automaticamente.

**2. Barrar (CI — `.github/workflows/security.yml` e `ci.yml`)**

- `audit (produção — bloqueante)` em **todo** PR e push, sem filtro de caminho. Dependência de runtime com
  advisory high/critical reprova.
- **Falha fechada.** Registry de advisories fora do ar reprova depois de 3 tentativas, em vez de passar. O
  `--ignore-registry-errors` é proibido porque sai 0 sem ter auditado. A distinção entre achado e erro de rede é
  feita pelo próprio relatório do pnpm (`.github/scripts/audit-gate.sh`).
- `homologação (origem do PR)`: a `main` só recebe PR de `develop`, `release/*` ou `hotfix/*`. Hotfix passa com
  aviso e obriga a levar a correção à `develop`. O nome da branch entra no script por `env:`, nunca
  interpolado (`${{ }}` em `run:` é injeção de comando).
- **Actions por SHA de commit**, com a versão em comentário, e `permissions: contents: read` no topo de todo
  workflow.
- **Catraca de lint** (`pnpm lint:ci`, `--max-warnings`): o teto só desce. **`pnpm verify` = CI**: inclui o
  `test:dom`.

**3. Proteger as próprias travas (testes de governança)**

- `tests/architecture/supply-chain-guard.test.ts` reprova se:
  - `minimumReleaseAge` < 1440 ou deixar de ser estrito;
  - `trustPolicy` ≠ `no-downgrade`;
  - `blockExoticSubdeps` sair;
  - aparecer `dangerouslyAllowAllBuilds`;
  - algum workflow usar action por tag, `--ignore-registry-errors`, interpolação de texto do autor do PR
    num comando, ou ficar sem `permissions:`.
- `tests/architecture/no-mocks-in-src.test.ts` passa a barrar **placeholder/fixture/fake/stub** em nome de
  arquivo e `*_PLACEHOLDER` em identificador. O estoque conhecido fica numa lista explícita que **só pode
  diminuir**: arquivo novo reprova, e entrada que sumiu do código também reprova.

**4. Avisar (alerta imediato)**

- Auditoria **diária** (09:00 UTC) da `main` e da `develop`. Vermelho abre uma issue `seguranca`, ou comenta
  na já aberta, sem duplicar. A issue é **atribuída** ao tech lead e à P.O., e o GitHub manda e-mail na hora.
  A issue fecha sozinha quando a auditoria volta a verde (`.github/scripts/audit-alert.sh`).
- Os alertas do Dependabot, do secret scanning e do CodeQL chegam por e-mail aos administradores do
  repositório.

**5. Tratar uma vulnerabilidade (o rito)**

1. Atualizar para a versão corrigida **respeitando a quarentena e a `trustPolicy`**, nunca contornando.
   Quando a versão nova perdeu a provenance, fixar a última confiável via `overrides`, com o porquê escrito.
2. PR para a `develop` com o gate verde e, depois, promoção.
3. PR do Dependabot que mire a `main` é **refeito** na `develop` e fechado.

## Consequências

- **Positivas:**
  - Nenhuma vulnerabilidade high/critical de runtime chega à produção sem alguém ter decidido isso num PR.
  - Advisory publicado depois do merge vira e-mail no dia seguinte, não descoberta acidental meses depois.
  - As travas que seguraram o ataque de hoje não podem ser removidas sem um diff visível no teste.
- **Negativas / custo:**
  - Advisory novo numa dependência **bloqueia PRs que não mexeram em dependência** até alguém atualizar.
    Isso é intencional: o bloqueio é o alerta.
  - Registry fora do ar bloqueia merge temporariamente (falha fechada).
  - Uma action nova exige resolver o SHA, e o Dependabot de `github-actions` passa a mantê-lo.
- **Ponto de troca / reversibilidade:**
  - O nível do gate é um argumento do `audit-gate.sh` (`--audit-level`).
  - A origem aceita na `main` é um `case` no `security.yml`.
  - A lista de responsáveis do alerta é o `ASSIGNEES`.
  - Relaxar qualquer trava exige mudar o teste de governança, e o CODEOWNERS chama o tech lead.

## Alternativas consideradas

| Alternativa                                                           | Por que rejeitada                                                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Auditoria só em PR que muda dependência (modelo anterior do core-api) | Advisory novo em dependência **já instalada** nunca aparece; foi exatamente o caso de 28/10.                  |
| `--ignore-registry-errors` para evitar flakiness                      | Transforma indisponibilidade em aprovação silenciosa. Preferimos 3 tentativas e reprovar com a causa escrita. |
| Só confiar no Dependabot                                              | Seus PRs de segurança miram a `main` (pulam a homologação), e o alerta não bloqueia nada.                     |
| Auditar só no build da imagem (Trivy)                                 | Pega tarde (pós-merge), e o Trivy da imagem não é o mesmo inventário do lockfile.                             |
| Exigir aprovação do tech lead em **todo** PR                          | Gargalo numa equipe de duas pessoas. O CODEOWNERS concentra a revisão onde as travas moram.                   |
| Proibir `hotfix/*` direto na `main`                                   | Sem saída para incidente em produção. O hotfix passa com aviso e obrigação de levar a correção à `develop`.   |
