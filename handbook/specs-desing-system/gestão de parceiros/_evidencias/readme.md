# _evidencias — material cru de engenharia reversa (Gestão de Parceiros)

Evidência **bruta** capturada do sistema **legado/origem** (ERP Financeiro), que serve de fonte
para os specs de design deste módulo (`00-design-tokens.md` … `07-verification-checklist.md`,
`bdd_*.md`, `_ROADMAP.md`). É **insumo**, não spec — a spec é derivada daqui.

> Coletada via navegação no app real (`read_page` + screenshots): **28 screenshots catalogados**
> cobrindo os estados das 5 sub-telas + **DOM estruturado com refs/valores reais** para Colaboradores,
> Fornecedores e Financiadores. Mais rica que a base original do design-system ("10 screenshots + 5 BDD").

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `colaboradores/`, `fornecedores/`, `financiadores/`, `estados/`, `municipios/` | `context.md` (propósito/comportamento/o-que-manter/rotas) · `dom.md` (DOM com refs/valores/bugs) · `screenshots.md` (catálogo de estados) |
| `evidencias_soltas/` | `reconstructed-spec` de amostra (inclui AppShell, dashboard, design tokens) |

## Decisão de fidelidade (clone fiel) — ⚠️ ler antes de implementar

O objetivo é **clonar fielmente** (o usuário não pode perceber a troca de tecnologia): replicar o
**comportamento visível** — mas **NÃO** os bugs que são de **API/encoding**, não da UI:

- Encoding `AvaliaÃ§Ã£o` (deveria ser "Avaliação") — bug de API; corrigir, não replicar.
- Coluna `CONTRATOS/ADITIVOS` vazia — reservada para uso futuro; manter a coluna, dado virá depois.
- Breadcrumb no singular em "Adicionar" (Fornecedores) — inconsistência; padronizar.

> Recomendação: registrar a política "replicar comportamento, sanear bugs de borda" num **ADR** na
> fase de implementação (verticais 010+), decidindo bug a bug. Ver `_ROADMAP.md` (buracos parqueados).

## Como usar

Fonte de verdade do *o quê* continua nos specs `00`–`07` + `bdd_*`. Use este material cru para:
desambiguar campos/estados, conferir valores reais, e alimentar os verticais (010/011/012) com o
modelo de dados implícito (ver `*/dom.md`).
