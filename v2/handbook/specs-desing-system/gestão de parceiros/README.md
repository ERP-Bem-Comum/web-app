# Design System — Documentação Atomic Design

> Módulo de **Gestão de Parceiros** do **ERP Financeiro** (Colaboradores, Fornecedores, Financiadores, Estados, Municípios).
> Documentação agnóstica de framework, baseada em **design tokens**.
> Derivada das telas do sistema, dos cenários BDD (Gherkin) e de uma inspeção do DOM real do app.
>
> **Rotas** seguem o padrão achatado: `/colaboradores`, `/fornecedores`, `/financiadores`, `/estados`, `/municipios` (a de Municípios foi confirmada via DOM; as demais são inferidas pelo mesmo padrão).

---

## Como esta documentação está organizada

Seguimos a metodologia **Atomic Design** (Brad Frost): a interface é decomposta em
camadas que vão do menor pedaço indivisível (átomo) até a tela completa (página).

| Camada | Arquivo | O que contém |
|--------|---------|--------------|
| 🎨 Tokens | [`00-design-tokens.md`](./00-design-tokens.md) | Cores, tipografia, espaçamento, raios, sombras. A base de tudo. |
| ⚛️ Átomos | [`01-atoms.md`](./01-atoms.md) | Botão, input, badge, ícone, label, avatar… |
| 🧬 Moléculas | [`02-molecules.md`](./02-molecules.md) | Campo de busca, item de lista, célula de status, paginação… |
| 🦠 Organismos | [`03-organisms.md`](./03-organisms.md) | Sidebar, header, tabela, transfer list, formulário, diálogo… |
| 📐 Templates | [`04-templates.md`](./04-templates.md) | Layouts: página de lista, página de detalhe, transfer list. |
| 📄 Páginas | [`05-pages.md`](./05-pages.md) | Instâncias reais: Colaboradores, Fornecedores, etc. |
| 🔄 Estados & Padrões | [`06-states-and-patterns.md`](./06-states-and-patterns.md) | Vazio, carregando, erro, sem permissão, confirmações. |
| ✅ Checklist | [`07-verification-checklist.md`](./07-verification-checklist.md) | Lista para você auditar a implementação. |

---

## Princípio de dependência (importante para a IA)

```
Tokens  →  Átomos  →  Moléculas  →  Organismos  →  Templates  →  Páginas
```

**Regra de ouro:** uma camada só pode usar componentes da(s) camada(s) abaixo dela.
Um átomo **nunca** importa uma molécula. Um organismo é composto por moléculas e átomos.
Valores visuais (cor, espaço, fonte) **sempre** vêm de tokens — nunca hardcoded.

---

## Convenção de nomenclatura dos componentes

Cada componente tem um **ID estável** usado para referência cruzada:

- Átomos: `atom.button`, `atom.input`, `atom.badge`…
- Moléculas: `mol.search-field`, `mol.transfer-list-item`…
- Organismos: `org.data-table`, `org.sidebar`…

Esses IDs aparecem em todos os arquivos para você (e a IA) rastrearem onde cada peça é usada.

---

## Como a IA deve usar este material

1. Ler **`00-design-tokens.md`** e materializar os tokens (CSS custom properties, JSON, etc).
2. Implementar **átomos** consumindo apenas tokens.
3. Subir as camadas, sempre compondo a partir do que já existe.
4. Para cada componente, respeitar **variantes**, **estados** e **acessibilidade** descritos.
5. Validar contra os **cenários BDD** referenciados em cada componente.

## Como VOCÊ deve verificar

- Confira os **valores de token** contra o arquivo de design oficial (cores marcadas com ⚠️ são aproximações visuais).
- Use o **`07-verification-checklist.md`** item a item.
- Cada componente lista o **BDD relacionado** — confirme que o comportamento bate.

---

## Glossário rápido das telas analisadas

| Tela | Tipo de layout | Arquivo BDD |
|------|----------------|-------------|
| Colaboradores (lista) | Página de lista com tabela | `bdd_colaboradores.md` |
| Colaboradores > Detalhes | Página de detalhe (form read-only) | `bdd_colaboradores.md` |
| Fornecedores (lista) | Página de lista com filtro | `bdd_fornecedores.md` |
| Fornecedores > Detalhes | Página de detalhe (form read-only) | `bdd_fornecedores.md` |
| Financiadores (lista) | Página de lista | `bdd_financiadores.md` |
| Financiadores > Detalhes | Página de detalhe (form read-only) | `bdd_financiadores.md` |
| Estados Parceiros | Transfer list (lista dupla) | `bdd_estado.md` |
| Municípios Parceiros | Transfer list + seletor de estado | `bdd_cidades.md` |

---

_Documentação gerada a partir de 10 capturas de tela + 5 arquivos BDD. Última revisão: ver controle de versão do repositório._
