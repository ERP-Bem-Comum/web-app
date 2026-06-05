# 00 — Design Tokens

> A base do design system. Todo valor visual (cor, fonte, espaço, raio, sombra) **deve**
> referenciar um token. Nenhum componente usa valores "soltos" (hardcoded).
>
> ⚠️ **Valores marcados com ⚠️ são aproximações extraídas visualmente das telas.**
> Confirme com o arquivo de design original (Figma/XD) antes de fechar a implementação.

---

## 1. Cores

### 1.1 Marca / Primária

| Token | Valor ⚠️ | Uso |
|-------|----------|-----|
| `--color-primary` | `#2BB8E8` | Botões primários ("Adicionar…", "Editar"), item ativo do menu, ícones de ação, links |
| `--color-primary-hover` | `#1FA3D1` | Hover de botões/links primários |
| `--color-primary-active` | `#1789B3` | Pressionado |
| `--color-primary-contrast` | `#FFFFFF` | Texto/ícone sobre primária |
| `--color-primary-soft` | `#E3F4FB` | Fundo suave (ex.: botão de filtro, botão "voltar" outline) |

### 1.2 Neutros / Superfícies

| Token | Valor ⚠️ | Uso |
|-------|----------|-----|
| `--color-bg` | `#E9EDF0` | Fundo geral da aplicação |
| `--color-surface` | `#FFFFFF` | Cartões, painéis, linhas de tabela |
| `--color-surface-alt` | `#F5F7F8` | Cabeçalho de tabela, faixas alternadas, rodapé de painel |
| `--color-sidebar-bg` | `#3E3E5B` | Fundo da barra lateral (azul-ardósia escuro) |
| `--color-sidebar-active` | `#2BB8E8` | Item ativo na sidebar |
| `--color-sidebar-text` | `#FFFFFF` | Texto/ícone da sidebar |

### 1.3 Texto

| Token | Valor ⚠️ | Uso |
|-------|----------|-----|
| `--color-text` | `#1F2329` | Texto principal (títulos, valores) |
| `--color-text-secondary` | `#5F6B76` | Texto de apoio, descrições |
| `--color-text-muted` | `#9AA0A6` | Placeholder, estados desabilitados, "Adicionado" |
| `--color-text-accent` | `#1496B0` | Cabeçalhos de coluna de tabela, rótulos de seção em destaque |
| `--color-text-greeting` | `#163C5B` | Saudação no header ("Olá, …") |

### 1.4 Estado / Feedback

| Token | Valor ⚠️ | Uso |
|-------|----------|-----|
| `--color-success` | `#43A047` | Ação adicionar (botão "+"), status "Ativo" |
| `--color-success-soft` | `#E8F5E9` | Fundo de badge "Ativo" |
| `--color-success-text` | `#2E7D32` | Texto/borda de badge "Ativo" |
| `--color-danger` | `#E53935` | Ação remover (botão "-"), erros |
| `--color-danger-soft` | `#FDECEA` | Fundo suave de alerta de remoção |
| `--color-warning` | `#F9A825` | Alertas de atenção (ex.: existência de orçamentos) |
| `--color-neutral-badge-bg` | `#BDBDBD` | Fundo de badge "Inativo" |
| `--color-neutral-badge-text` | `#424242` | Texto de badge "Inativo" |

### 1.5 Bordas / Divisores

| Token | Valor ⚠️ | Uso |
|-------|----------|-----|
| `--color-border` | `#E0E3E7` | Bordas de input, divisores de linha |
| `--color-border-strong` | `#C4C9CE` | Bordas com mais contraste (foco neutro) |
| `--color-focus-ring` | `#2BB8E8` | Anel de foco (acessibilidade) |

---

## 2. Tipografia

⚠️ A família aparenta ser **Roboto** (estilo Material). Confirmar. Fallback definido abaixo.

| Token | Valor | Uso |
|-------|-------|-----|
| `--font-family-base` | `"Roboto", "Segoe UI", system-ui, -apple-system, sans-serif` | Toda a interface |
| `--font-weight-regular` | `400` | Corpo |
| `--font-weight-medium` | `500` | Rótulos, botões |
| `--font-weight-bold` | `700` | Títulos de página |

### Escala tipográfica

| Token | Tamanho ⚠️ | Peso | Uso |
|-------|-----------|------|-----|
| `--text-page-title` | `28px / 1.3` | bold | Título da página ("Financiadores", "Estados Parceiros") |
| `--text-card-title` | `20px / 1.4` | medium | Título de painel/cartão ("Lista Geral de Estados") |
| `--text-section` | `13px / 1.4` | medium, uppercase, +letterspacing | Cabeçalho de coluna ("NOME", "ADD"), rótulos de seção |
| `--text-body` | `15px / 1.5` | regular | Conteúdo de tabela, valores |
| `--text-label` | `12px / 1.4` | regular | Rótulo flutuante de campo de formulário |
| `--text-small` | `13px / 1.4` | regular | Paginação, sub-status ("Cadastrado") |

---

## 3. Espaçamento

Escala base **4px**. Use múltiplos; não invente valores intermediários.

| Token | Valor | Uso típico |
|-------|-------|-----------|
| `--space-1` | `4px` | Gap mínimo (ícone↔texto) |
| `--space-2` | `8px` | Padding interno pequeno |
| `--space-3` | `12px` | Gap entre campos |
| `--space-4` | `16px` | Padding padrão de linha/input |
| `--space-5` | `24px` | Padding interno de cartão |
| `--space-6` | `32px` | Separação entre blocos |
| `--space-7` | `48px` | Margens de página |

---

## 4. Raios de borda

| Token | Valor ⚠️ | Uso |
|-------|----------|-----|
| `--radius-sm` | `6px` | Botões, badges retangulares |
| `--radius-md` | `8px` | Inputs, selects |
| `--radius-lg` | `12px` | Cartões / painéis |
| `--radius-pill` | `999px` | Badges pílula, avatar, botões circulares (+ / -) |

---

## 5. Sombras (elevação)

| Token | Valor ⚠️ | Uso |
|-------|----------|-----|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)` | Cartões e painéis |
| `--shadow-overlay` | `0 8px 24px rgba(0,0,0,.18)` | Diálogos, dropdowns abertos |
| `--shadow-none` | `none` | — |

---

## 6. Layout

| Token | Valor | Uso |
|-------|-------|-----|
| `--sidebar-width-expanded` | `240px` ⚠️ | Sidebar com rótulos (tela de Municípios) |
| `--sidebar-width-collapsed` | `76px` | Sidebar só com ícones — **confirmado** via DOM (`offsetLeft: 76`) |
| `--header-height` | `56px` | Barra superior — **confirmado** via DOM (`offsetTop: 56`) |
| `--content-max-width` | `1440px` ⚠️ | Largura máxima do conteúdo |
| `--content-padding-y` | `32px` | Padding vertical da área de conteúdo — **confirmado** (`py-8`) |
| `--content-padding-x` | `24px` | Padding horizontal da área de conteúdo — **confirmado** (`px-6`) |
| `--field-height` | `48px` ⚠️ | Altura de input/select |
| `--row-height` | `64px` ⚠️ | Altura de linha de tabela/lista |

> 📌 **Confirmação via DOM real:** o container de conteúdo mede `clientHeight: 784` / `clientWidth: 1836` numa viewport desktop, com header de 56px e sidebar recolhida de 76px. A escala de espaçamento de 4px usada no projeto bate com `--space-*`. Esses números foram extraídos de uma inspeção do app (rota `/municipios`) e não dependem de framework.

---

## 7. Z-index

| Token | Valor | Uso |
|-------|-------|-----|
| `--z-sidebar` | `100` | Sidebar |
| `--z-header` | `200` | Header |
| `--z-dropdown` | `1000` | Menus suspensos |
| `--z-overlay` | `1100` | Backdrop de diálogo |
| `--z-dialog` | `1200` | Diálogo/modal |
| `--z-toast` | `1300` | Notificações de sucesso/erro |

---

## 8. Exemplo de materialização (CSS custom properties)

> Apenas um exemplo de saída. A IA pode gerar o mesmo conteúdo em JSON, SCSS, JS, etc.

```css
:root {
  /* Cores — primária */
  --color-primary: #2BB8E8;
  --color-primary-hover: #1FA3D1;
  --color-primary-contrast: #FFFFFF;
  /* Cores — superfícies */
  --color-bg: #E9EDF0;
  --color-surface: #FFFFFF;
  --color-sidebar-bg: #3E3E5B;
  /* Texto */
  --color-text: #1F2329;
  --color-text-muted: #9AA0A6;
  --color-text-accent: #1496B0;
  /* Estado */
  --color-success: #43A047;
  --color-danger: #E53935;
  --color-warning: #F9A825;
  /* Tipografia */
  --font-family-base: "Roboto", system-ui, sans-serif;
  /* Espaço / raio / sombra */
  --space-4: 16px;
  --radius-lg: 12px;
  --shadow-card: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
}
```
