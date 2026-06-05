# SPEC de Frontend — Tela de Login "Bem Comum"

> Documento para o **Claude Code** replicar a tela com fidelidade de pixel.
> Todas as medidas estão na escala nativa do screenshot (**canvas 1920 × 1080**).
> Se o design real for @2x (retina), **divida todos os valores em px por 2**. As cores e proporções não mudam.
> A tela está renderizada no **estado de erro** (mensagem de credenciais inválidas visível).

---

## 1. Visão geral / Layout-mãe

- **Canvas:** ocupa 100% da viewport (`100vw × 100vh`), sem scroll.
- **Fundo (base):** cor sólida `#F6FAFB` (cinza-azulado quase branco).
- **Card de login:** **centralizado vertical e horizontalmente** (no eixo X e no eixo Y).
  Centro do card ≈ (960, 540) — exatamente o centro da tela.
- **Camadas, de trás para frente (z-index):**
  1. Fundo `#F6FAFB`
  2. Dois recortes decorativos ciano (cantos superior-direito e inferior-esquerdo)
  3. Retângulo laranja (atrás do card, aparece como "abas" nas laterais)
  4. Card branco com o formulário

---

## 2. Design Tokens (cores)

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#F6FAFB` | Fundo da página |
| `--cyan` | `#32C6F4` | Recortes decorativos / cor da marca |
| `--cyan-btn` | `#35BFF0` | Fundo do botão "Entrar" |
| `--orange` | `#F59E19` | Abas laterais, sublinhado "Login", ícone do olho |
| `--card` | `#FFFFFF` | Fundo do card |
| `--text-title` | `#030E10` | Texto "Login" (quase preto) |
| `--text-link` | `#193A41` | Link "Esqueci Minha Senha" (teal escuro) |
| `--text-btn` | `#004967` | Texto "Entrar" (azul-petróleo escuro) |
| `--placeholder` | `#6B6B6B` | Texto placeholder dos inputs |
| `--icon-gray` | `#747474` | Ícone de envelope (e-mail) |
| `--border-input` | `#CACACA` | Borda dos campos |
| `--error` | `#DF5E63` | Mensagem de erro (vermelho-coral) |

---

## 3. Tipografia

Família sugerida: **system-ui / Inter / Roboto** (sans-serif, sem serifa).

| Elemento | Tamanho aprox. (px @1x do canvas) | Peso | Cor |
|---|---|---|---|
| "Login" (título) | ~24px | 500–600 (medium/semibold) | `--text-title` |
| Placeholder dos inputs | ~15–16px | 400 (regular) | `--placeholder` |
| Mensagem de erro | ~13px | 400 | `--error` |
| "Esqueci Minha Senha" | ~14px | 700 (bold) | `--text-link` |
| "Entrar" (botão) | ~14px | 600 (semibold) | `--text-btn` |

---

## 4. Recortes decorativos ciano (`--cyan #32C6F4`)

São duas formas geométricas chapadas (estilo origami/dobra), posicionadas em
camada atrás do card. Use `clip-path: polygon()` em `<div>`s de tela cheia, ou um SVG.

### 4.1 Forma do canto SUPERIOR-DIREITO
Cobre o topo direito até a metade inferior da tela, com um pequeno chanfro no canto inferior direito.

Vértices (coordenadas absolutas no canvas 1920×1080):
- (1920, 0) — canto superior direito
- (1920, 961) — desce pela borda direita
- (1822, 1080) — chanfro diagonal até a base
- (1040, 1080) — corre pela base para a esquerda
- (volta diagonal até 1920, 0)

`clip-path` (em % de um div 100vw×100vh):
```css
clip-path: polygon(100% 0, 100% 89%, 95% 100%, 54.2% 100%);
```

### 4.2 Forma do canto INFERIOR-ESQUERDO
Pequena "dobra" triangular no canto inferior esquerdo.

Vértices (canvas 1920×1080):
- (50, 857) — ápice (ponta superior)
- (0, 945) — desce até encostar na borda esquerda
- (0, 1080) — canto inferior esquerdo
- (371, 1080) — corre pela base para a direita
- (volta diagonal até o ápice)

`clip-path`:
```css
clip-path: polygon(2.6% 79.3%, 0 87.5%, 0 100%, 19.3% 100%);
```

> As duas formas usam a MESMA cor sólida `#32C6F4` (sem gradiente).

---

## 5. Abas laranja atrás do card (`--orange #F59E19`)

Um retângulo laranja sólido fica **atrás** do card. Ele é **mais largo** que o card
(aparece ~17px de cada lado, formando "abas") e **mais baixo** que o card
(recuado no topo e na base, então só as laterais aparecem).

Medidas absolutas:
- Retângulo laranja: x **720 → 1199** (largura ~479), y **353 → 727** (altura ~374)
- Card (item 6): x **737 → 1182**, y **300 → 779**

Resultado visual: duas faixas laranja verticais de **~15–17px** de largura saindo
pelas bordas esquerda e direita do card, sem aparecer em cima nem embaixo.

Implementação simples: posicione o card e, atrás dele, um retângulo laranja
centralizado com `width` = largura do card + ~34px e `height` = altura do card − ~105px.

---

## 6. Card branco

| Propriedade | Valor |
|---|---|
| Cor | `#FFFFFF` |
| Largura | **445px** (x 737 → 1182) |
| Altura | **479px** (y 300 → 779) |
| Border-radius | ~6–8px |
| Sombra | suave/difusa, ex.: `box-shadow: 0 10px 40px rgba(0,0,0,0.08)` |
| Padding interno | **~40px** em todos os lados (esq./dir. = 41px medidos) |
| z-index | acima das abas laranja |

### Ritmo vertical interno (distância a partir do topo do card)

| Elemento | Início (px do topo do card) | Altura |
|---|---|---|
| Logo | ~41px | ~60px |
| Título "Login" | ~124px | ~24px |
| Sublinhado laranja | ~150px | ~3px |
| Input E-mail | ~198px | 39px |
| Espaço entre inputs | — | 25px |
| Input Senha | ~262px | 39px |
| Mensagem de erro | ~310px | ~14px |
| Link "Esqueci Minha Senha" | ~372px | ~16px |
| Botão "Entrar" | ~408px | ~40px |
| Padding inferior | ~32px abaixo do botão | — |

---

## 7. Logo

- **Centralizado horizontalmente** no topo do card.
- Caixa aprox. **60 × 60px**.
- É um **badge ciano arredondado** com um "**B**" estilizado preto e o texto vertical
  "**BEM COMUM**" dentro, contornado em preto.
- **Use o asset oficial da marca** (SVG/PNG) — não recrie à mão. Cor do badge ≈ `--cyan`,
  contornos e letras em `#000000`.

---

## 8. Título "Login" + sublinhado

- Texto "**Login**", cor `--text-title #030E10`, ~24px, peso medium, centralizado.
- Logo abaixo do texto, um **sublinhado laranja** (`--orange`) curto, com a largura
  aproximada da palavra (~48px), espessura ~3px, levemente arredondado.

---

## 9. Campos de formulário (inputs)

Ambos os inputs compartilham o mesmo estilo:

| Propriedade | Valor |
|---|---|
| Largura | **363px** (ocupam a largura útil do card; x 778 → 1141) |
| Altura | **39px** |
| Fundo | `#FFFFFF` |
| Borda | `1px solid #CACACA` |
| Border-radius | ~6px |
| Padding-left (texto) | ~16px |
| Cor do texto/placeholder | `--placeholder #6B6B6B` |
| Ícone à direita | posicionado ~16px da borda direita interna |

### 9.1 Input E-mail
- Placeholder: `Email`
- Ícone à direita: **envelope** (outline), cor `--icon-gray #747474`, ~16px.

### 9.2 Input Senha
- Placeholder: `Senha`
- `type="password"`
- Ícone à direita: **olho** (toggle de visibilidade), cor **laranja** `~#E5A649`
  (variação de `--orange`), ~16px. Clicável.
- Gap vertical de **25px** entre o input E-mail e o input Senha.

---

## 10. Mensagem de erro

- Texto: `Usuário ou senha inválidos, revise os dados`
- Cor: `--error #DF5E63`
- Tamanho: ~13px, peso regular.
- Posição: **logo abaixo** do input Senha (alinhado à esquerda dos inputs), ~6px de gap.
- É um estado condicional: só aparece quando o login falha.

---

## 11. Link "Esqueci Minha Senha"

- Texto: `Esqueci Minha Senha`
- Cor: `--text-link #193A41`, **bold (700)**, ~14px.
- **Centralizado** horizontalmente.
- Clicável (cursor pointer). Sem sublinhado por padrão.

---

## 12. Botão "Entrar"

| Propriedade | Valor |
|---|---|
| Texto | `Entrar` |
| Cor de fundo | `--cyan-btn #35BFF0` |
| Cor do texto | `--text-btn #004967`, ~14px, semibold |
| Largura | **~320px** (levemente mais estreito que os inputs — recuado ~22px de cada lado) |
| Altura | **~40px** |
| Border-radius | ~6px |
| Centralização | centralizado no card |
| Posição | encostado próximo à base do card (~32px de padding inferior) |

---

## 13. Estados e interações

| Elemento | Estado | Comportamento |
|---|---|---|
| Input (E-mail/Senha) | focus | Borda muda para `--cyan` ou `--orange`; opcional `box-shadow` sutil |
| Input | erro | Mensagem `--error` abaixo do campo; opcional borda vermelha |
| Ícone do olho (Senha) | click | Alterna `type` entre `password` ↔ `text` (mostra/oculta senha) |
| Botão "Entrar" | hover | Escurecer o ciano ~8–10% (`filter: brightness(0.94)`) |
| Botão "Entrar" | active | Leve `scale(0.99)` ou escurecer mais |
| Botão "Entrar" | loading | Spinner + botão desabilitado (sugestão, não visível no print) |
| "Esqueci Minha Senha" | hover | Sublinhar ou escurecer levemente |

---

## 14. Acessibilidade

- Ordem de foco: E-mail → Senha → toggle olho → "Esqueci Minha Senha" → "Entrar".
- `<label>` (pode ser visualmente oculto) para cada input; placeholders **não** substituem labels.
- Mensagem de erro com `role="alert"` e `aria-live="polite"`; associar via `aria-describedby` ao input.
- Botão do olho: `aria-label="Mostrar senha"` / `aria-label="Ocultar senha"` conforme estado, e `aria-pressed`.
- Contraste: o texto do botão `#004967` sobre `#35BFF0` é confortável; valide AA.
- Permitir submit com tecla **Enter** dentro do formulário.

---

## 15. Responsividade (sugestão — não há referência no print)

| Breakpoint | Comportamento |
|---|---|
| Desktop (>768px) | Card 445px fixo, centralizado; recortes ciano visíveis |
| Mobile (<768px) | Card vira ~90% da largura (máx. 400px), padding reduzido; recortes ciano podem encolher ou sumir; abas laranja opcionais |

---

## 16. Esqueleto de implementação (HTML + CSS de referência)

```html
<div class="page">
  <div class="shape shape--tr"></div>   <!-- recorte superior-direito -->
  <div class="shape shape--bl"></div>   <!-- recorte inferior-esquerdo -->

  <div class="card-wrap">
    <div class="orange-tabs"></div>     <!-- retângulo laranja atrás -->
    <form class="card" novalidate>
      <img class="logo" src="/assets/bem-comum-logo.svg" alt="Bem Comum" />
      <h1 class="title">Login</h1>

      <label class="field">
        <span class="sr-only">Email</span>
        <input type="email" placeholder="Email" />
        <svg class="icon icon--mail"><!-- envelope --></svg>
      </label>

      <label class="field">
        <span class="sr-only">Senha</span>
        <input type="password" placeholder="Senha" />
        <button type="button" class="icon-btn" aria-label="Mostrar senha">
          <svg class="icon icon--eye"><!-- olho --></svg>
        </button>
      </label>

      <p class="error" role="alert">Usuário ou senha inválidos, revise os dados</p>

      <a class="forgot" href="#">Esqueci Minha Senha</a>
      <button type="submit" class="submit">Entrar</button>
    </form>
  </div>
</div>
```

```css
:root{
  --bg:#F6FAFB; --cyan:#32C6F4; --cyan-btn:#35BFF0; --orange:#F59E19;
  --text-title:#030E10; --text-link:#193A41; --text-btn:#004967;
  --placeholder:#6B6B6B; --icon-gray:#747474; --border-input:#CACACA; --error:#DF5E63;
}
*{box-sizing:border-box}
.page{position:fixed;inset:0;background:var(--bg);overflow:hidden;
  display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif}

.shape{position:absolute;inset:0;background:var(--cyan);pointer-events:none}
.shape--tr{clip-path:polygon(100% 0, 100% 89%, 95% 100%, 54.2% 100%)}
.shape--bl{clip-path:polygon(2.6% 79.3%, 0 87.5%, 0 100%, 19.3% 100%)}

.card-wrap{position:relative;z-index:2}
.orange-tabs{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:479px;height:374px;background:var(--orange);border-radius:4px;z-index:-1}

.card{position:relative;width:445px;background:#fff;border-radius:7px;
  box-shadow:0 10px 40px rgba(0,0,0,.08);padding:40px;
  display:flex;flex-direction:column;align-items:center;gap:0}
.logo{width:60px;height:60px;object-fit:contain;margin-bottom:18px}

.title{font-size:24px;font-weight:600;color:var(--text-title);margin:0 0 4px;
  position:relative;padding-bottom:8px}
.title::after{content:"";position:absolute;left:50%;bottom:0;transform:translateX(-50%);
  width:48px;height:3px;border-radius:2px;background:var(--orange)}

.field{position:relative;width:100%;margin-top:24px}
.field input{width:100%;height:39px;border:1px solid var(--border-input);border-radius:6px;
  padding:0 44px 0 16px;font-size:15px;color:#222;background:#fff}
.field input::placeholder{color:var(--placeholder)}
.field input:focus{outline:none;border-color:var(--cyan)}
.icon{position:absolute;right:16px;top:50%;transform:translateY(-50%);width:16px;height:16px}
.icon--mail{color:var(--icon-gray)}
.icon-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);
  background:none;border:0;cursor:pointer;color:var(--orange);padding:4px}

.error{align-self:flex-start;margin:6px 0 0;font-size:13px;color:var(--error)}
.forgot{margin-top:28px;font-size:14px;font-weight:700;color:var(--text-link);text-decoration:none}
.submit{margin-top:18px;width:320px;height:40px;border:0;border-radius:6px;
  background:var(--cyan-btn);color:var(--text-btn);font-size:14px;font-weight:600;cursor:pointer}
.submit:hover{filter:brightness(.95)}

.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0,0,0,0);border:0}
```

> Os `margin-top`/`gap` acima são uma aproximação fiel do ritmo vertical medido. Ajuste fino
> em ±2–4px se necessário para casar com o print original.

---

## 17. Checklist de fidelidade

- [ ] Fundo `#F6FAFB`
- [ ] Recorte ciano superior-direito (clip-path correto)
- [ ] Recorte ciano inferior-esquerdo (clip-path correto)
- [ ] Abas laranja visíveis nas laterais do card (topo/base sem laranja)
- [ ] Card branco centralizado, sombra suave, radius ~7px
- [ ] Logo Bem Comum centralizado
- [ ] "Login" com sublinhado laranja curto
- [ ] Input E-mail com ícone de envelope cinza
- [ ] Input Senha com ícone de olho laranja (toggle funcional)
- [ ] Mensagem de erro vermelha sob o input Senha
- [ ] "Esqueci Minha Senha" em teal bold, centralizado
- [ ] Botão "Entrar" ciano, texto azul-petróleo, levemente mais estreito que os inputs