# 01 — Átomos

> Os menores blocos de construção. Não podem ser quebrados em peças menores
> com utilidade própria. Consomem **apenas design tokens**.

Formato de cada átomo: **ID · Descrição · Anatomia · Variantes · Estados · Propriedades · Tokens · Acessibilidade · Onde aparece**.

---

## `atom.button` — Botão

**Descrição:** ação principal preenchida. Visto em "Adicionar Financiadores", "Adicionar Fornecedores", "Adicionar Colaborador", "Editar", "Sim, salvar alterações".

**Anatomia:** `[ rótulo de texto ]` opcionalmente `[ ícone + rótulo ]`, dentro de um retângulo com cantos arredondados.

**Variantes**
| Variante | Aparência | Uso |
|----------|-----------|-----|
| `primary` | Fundo `--color-primary`, texto branco | Ação principal da tela |
| `secondary` | Fundo branco, borda `--color-border`, texto `--color-text` | Ação secundária ("Voltar", "Importar CSV/Excel", "Cancelar") |
| `danger` | Fundo/texto `--color-danger` | Confirmar ação destrutiva |
| `ghost` | Sem fundo, só texto primário | Ações discretas |

**Estados:** `default`, `hover` (→ `--color-primary-hover`), `active/pressed`, `focus` (anel `--color-focus-ring`), `disabled` (opacidade reduzida, sem ponteiro), `loading` (spinner + texto, não-clicável).

**Propriedades**
- `variant`: primary | secondary | danger | ghost
- `size`: sm | md (padrão) | lg
- `iconLeft` / `iconRight`: ref de `atom.icon` (opcional)
- `disabled`: boolean
- `loading`: boolean
- `type`: button | submit

**Tokens:** `--color-primary*`, `--radius-sm`, `--space-2/4`, `--text-body`, `--font-weight-medium`.

**Acessibilidade:** elemento `<button>` nativo; rótulo textual ou `aria-label` se só ícone; foco visível; `aria-busy` quando loading.

**Onde aparece:** todas as listas (botão de adicionar), todas as telas de detalhe (Voltar/Editar), diálogos de confirmação.

---

## `atom.icon-button` — Botão de ícone

**Descrição:** botão circular ou quadrado contendo só um ícone. Ex.: seta "voltar" (quadrado outline ciano) no header das telas de detalhe; botão de filtro (quadrado `--color-primary-soft`).

**Variantes:** `outline` (borda primária, ícone primário), `soft` (fundo `--color-primary-soft`), `plain`.

**Estados:** default, hover, focus, disabled.

**Propriedades:** `icon` (obrigatório), `variant`, `shape` (square | circle), `aria-label` (**obrigatório**).

**Acessibilidade:** `aria-label` obrigatório porque não há texto visível.

**Onde aparece:** "voltar" em `Colaboradores > Detalhes`, `Fornecedores > Detalhes`, `Financiadores > Detalhes`; botão de filtro em Fornecedores e Colaboradores.

---

## `atom.add-action` — Botão de adicionar (círculo verde +)

**Descrição:** botão circular verde com símbolo "+". Adiciona um item da lista geral para a lista de adicionados.

**Estados**
| Estado | Aparência | Significado |
|--------|-----------|-------------|
| `enabled` | Círculo `--color-success` com "+" branco | Item pode ser adicionado |
| `added` | Texto "Adicionado" em `--color-text-muted`, sem botão | Item já está na lista de parceiros (bloqueado) |

**Propriedades:** `state` (enabled | added), `onAdd`.

**Acessibilidade:** `aria-label="Adicionar {nome}"`; quando `added`, comunicar estado via texto + `aria-disabled`.

**Onde aparece:** coluna "ADD" em Estados e Municípios.

**BDD:** `bdd_estado.md` / `bdd_cidades.md` → "Adicionar um novo estado parceiro com sucesso" (botão muda para "Adicionado" bloqueado).

---

## `atom.remove-action` — Botão de remover (círculo vermelho −)

**Descrição:** botão circular com contorno vermelho e símbolo "−". Remove um item da lista de adicionados.

**Estados:** default, hover, focus, disabled.

**Propriedades:** `onRemove`, `aria-label="Remover {nome}"`.

**Onde aparece:** coluna "REMOVER" em Estados e Municípios.

**BDD:** dispara o fluxo de confirmação de remoção (ver `org.confirm-dialog` e `bdd_estado.md`).

---

## `atom.input` — Campo de texto

**Descrição:** entrada de texto de uma linha. Base para busca e formulários.

**Variantes:** `default` (borda completa), `search` (com ícone de lupa), `floating-label` (rótulo flutua acima quando preenchido — visto nos detalhes).

**Estados:** empty (placeholder em `--color-text-muted`), filled, focus (borda `--color-primary`), disabled/readonly (telas de detalhe — campos bloqueados em cinza), error (borda `--color-danger` + mensagem).

**Propriedades:** `value`, `placeholder`, `label`, `disabled`, `readonly`, `error`, `iconLeft`, `type`.

**Tokens:** `--field-height`, `--radius-md`, `--color-border`, `--color-text`, `--text-body`.

**Acessibilidade:** `<label>` associado via `for`/`id`; estado de erro com `aria-invalid` + `aria-describedby`.

**Onde aparece:** "Procurar Estado/Município", "Pesquise" (listas), todos os campos das telas de detalhe (em modo readonly).

---

## `atom.select` — Seletor / dropdown

**Descrição:** campo que abre lista de opções. Ex.: "Selecionar Estado" (Municípios), "Categoria de Serviço", "Vínculo Empregatício", "Tipo de chave PIX", "Itens por página".

**Anatomia:** rótulo + valor/placeholder + ícone chevron à direita.

**Estados:** closed, open (lista com `--shadow-overlay`), selected, disabled, readonly.

**Propriedades:** `options`, `value`, `placeholder`, `disabled`, `searchable` (boolean).

**Acessibilidade:** padrão combobox/listbox (`role`, `aria-expanded`, navegação por teclado ↑↓ Enter Esc).

**Onde aparece:** Municípios (seletor de estado), Fornecedores/Colaboradores (detalhes), paginação ("Itens por página: 5").

---

## `atom.badge` — Selo de status

**Descrição:** etiqueta compacta indicando status.

**Variantes**
| Variante | Aparência | Uso |
|----------|-----------|-----|
| `active` | Texto/borda verde, fundo branco/`--color-success-soft`, formato pílula | "Ativo" |
| `inactive` | Fundo `--color-neutral-badge-bg`, texto escuro | "Inativo" |

**Propriedades:** `status` (active | inactive), `label`.

**Acessibilidade:** o significado não pode depender só da cor — o rótulo textual ("Ativo"/"Inativo") já cumpre isso. Manter.

**Onde aparece:** coluna STATUS em Financiadores, Fornecedores, Colaboradores.

---

## `atom.label` — Rótulo

**Descrição:** texto curto que nomeia um campo, coluna ou seção.

**Variantes:** `field-label` (flutuante, `--text-label`), `column-header` (`--text-section`, uppercase, `--color-text-accent`), `section-title` (ex.: "Dados Bancários:", "Dados PIX:").

**Acessibilidade:** quando rotula input, associar via `for`.

**Onde aparece:** cabeçalhos de coluna em todas as tabelas; rótulos de seção nas telas de detalhe.

---

## `atom.icon` — Ícone

**Descrição:** glifo vetorial. Família única (provável Material Symbols — ⚠️ confirmar). Ícones vistos: casa (Dashboard), tag/etiqueta (Gestão de Parceiros), alvo (Programas), maleta (Contratos), calendário (Plano Orçamentário), gráfico (Relatórios), documento (Financeiro), pessoas (Usuários), lupa (busca), chevron, "+", "−", funil (filtro), seta voltar, calendário (datepicker).

**Propriedades:** `name`, `size` (16 | 20 | 24), `color` (token).

**Acessibilidade:** decorativo → `aria-hidden="true"`; significativo → `role="img"` + `aria-label`.

---

## `atom.avatar` — Avatar

**Descrição:** círculo com iniciais do usuário ("AC") no header.

**Propriedades:** `initials`, `imageUrl` (opcional), `size`.

**Onde aparece:** canto superior direito (junto à saudação).

---

## `atom.divider` — Divisor

**Descrição:** linha fina horizontal `--color-border` separando seções/linhas.

**Onde aparece:** entre linhas de tabela; entre área de campos e área de ações (botões) nas telas de detalhe.

---

## `atom.text-status` — Texto de status secundário

**Descrição:** texto pequeno abaixo do badge indicando subestado de cadastro: "Cadastrado", "Pré Cadastrado".

**Propriedades:** `value`.

**Onde aparece:** coluna STATUS de Colaboradores (badge + este texto).

**BDD:** relacionado ao estado de pré-cadastro visto em `Colaboradores > Detalhes` ("Pré-Cadastro de colaborador(a)").

---

## `atom.spinner` — Indicador de carregamento

**Descrição:** animação circular de progresso indeterminado.

**Propriedades:** `size`, `color`.

**Onde aparece:** estado de loading de listas.

**BDD:** `bdd_colaboradores.md` → "Falha de comunicação… o sistema deve manter o indicador de carregamento (loading) na tela".

---

## `atom.link` — Link de texto

**Descrição:** texto clicável (ex.: range de paginação "1 - 41", controles de página).

**Estados:** default (`--color-primary`), hover (sublinhado), disabled (`--color-text-muted`).
