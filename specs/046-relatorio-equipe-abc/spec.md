# Spec 046 — Relatório "Equipe ABC" (Relatórios)

- **Tamanho:** M (feature de tela, front-first, sem server function nova).
- **Módulo:** `src/modules/reports/client/` (mesmo módulo dos relatórios existentes).
- **Rota:** `/relatorios/equipe` → `src/routes/_authenticated/relatorios/equipe.tsx`.
- **Estado:** front-first — dados PLACEHOLDER sintéticos; endpoint core-api (#114/#112) ainda não existe.

## Objetivo

Entregar o relatório de **Equipe (ABC/Geral)** — panorama de colaboradores com filtros recolhíveis,
5 gráficos e uma tabela enxuta — no MESMO padrão visual do relatório "Realizado × Planejado"
(colapsáveis → gráficos → tabela, identidade "brand", full-bleed 28px), reaproveitando os componentes/
padrões de gráfico do módulo. **RBAC não gateia** este relatório (o RBAC será modelado pelo cliente
pós-entrega, conforme decisão da P.O.).

## ⚠️ LGPD / privacidade (requisito duro)

O CSV legado de origem (110 colaboradores REAIS) contém PII sensível (CPF, e-mail, telefone, endereço,
**remuneração, raça/cor, identidade de gênero, alergias/saúde, biografia**). **Nada disso entra no repo.**
O placeholder é **SINTÉTICO/anonimizado**: ~36 colaboradores fictícios (nomes pt-BR inventados) apenas com
os campos de EXIBIÇÃO enxutos. Campos sensíveis (cpf/email/telefone/endereço/remuneração/alergias/biografia)
são **excluídos por design — nem existem no tipo `TeamMemberRow`**. Um teste garante que o placeholder só
carrega as chaves de exibição e que o CSV não vaza termos sensíveis.

## Escopo funcional

### Tabela (8 colunas enxutas)

`Nome` · `Idade` (número; "N/A" quando null) · `Área de atuação` (programa: DDI/EPV/PARC) · `Função` ·
`Vínculo` (PJ/CLT) · `Identidade de gênero` (Mulher Cis/Homem Cis/Prefiro não responder) · `Raça/cor`
(N/A/Branco/Preto/Pardo/Amarelo/Prefiro não revelar) · `Escolaridade` (N/A/Superior Completo/Incompleto/
Pós-graduação/Mestrado). Lista "brand", thead sticky, rolável quando longa.

### Filtros recolhíveis (placeholders visuais front-first)

Toggle "Filtros" (mesmo padrão do Realizado × Planejado) + busca "Pesquise" + selects: Escolaridade, Raça,
Ano de Contrato, Desativado por, Programa, Função, Identidade de Gênero, Status, Situação Cadastral, Idade,
Vínculo Empregatício + botão **Filtrar**. Não filtram nada ainda (só a forma).

### 5 gráficos (brand, com hover tooltip)

1. **Distribuição por Gênero** — donut (3 fatias + legenda + contagem/%).
2. **Distribuição por Raça/Cor** — **barras verticais (componente NOVO)**, 1 barra/raça, contagem no topo.
3. **Distribuição por Idade** — barras horizontais, buckets "Até 29"/"30 a 39"/"40 a 49"/"50 a 59"/"60+"/"N/A".
4. **Quantitativo de Funcionários por Ano** — linha, anos 2019→2025.
5. **Distribuição por Função** — barras horizontais, 1 barra/função.

**Layout dos gráficos (refino P.O.):** 2 linhas — **topo 3-up** (Gênero + Idade + Raça/Cor, grade
`charts3`) e **base 2-up** (Funcionários por Ano + Função, grade `charts2` — os dois mais largos ganham
espaço). Ambas colapsam em 1 coluna no responsivo (mesmo breakpoint 60rem).

### Exportar

**CSV apenas** (Blob client-side, 8 colunas enxutas, delimitado por ';', cabeçalho pt-BR). Sem PDF, sem
dropdown — um único botão "Exportar".

### Paginação da tabela (refino P.O.)

`BrandPaginator` reutilizável abaixo da tabela: pager (Anterior/Próxima) + seletor "Itens por página"
(5/10/25, default 10). O UI-state (`page`/`perPage`) mora na page (`useState`); a fatia da página é
derivação PURA da ViewModel (`totalPages`/`pageSlice`). Trocar "itens por página" reseta para a 1ª página.

### Linha clicável → modal de detalhe (refino P.O.)

Cada linha da tabela é um `<button>` acessível (foco/Enter/Espaço nativos; `aria-label` "Ver detalhes de
{nome}"). O clique abre um **modal "brand"** (`role="dialog"`, `aria-modal`, fecha por Esc/overlay/"Fechar")
com os **9 campos enxutos** em lista rótulo/valor — **SEM PII sensível** (LGPD). Rodapé: "Fechar" + "Editar".
`member` selecionado = `useState` local.

### "Editar" → módulo Colaboradores (refino P.O.)

O botão "Editar" do modal navega (`useNavigate`) ao **índice** `/parceiros/colaboradores` — a edição
acontece no módulo próprio, nunca inline aqui. Front-first: os dados sintéticos não têm id real de parceiro;
um comentário no código marca o deep-link `/parceiros/colaboradores/$id` para quando o dado real chegar.

## Critérios de aceite

- `/relatorios/equipe` protegida, sem RBAC, acessível pelo accordion "Relatórios" (subitem "Equipe ABC").
- ViewModel PURA (zero React) agrega os 5 datasets a partir do placeholder; totais consistentes (soma das
  fatias = nº de colaboradores).
- Views burras; hover e toggle de filtros = `useState` local.
- só-tokens: novas cores de gráfico só em `grid-brand.values.ts` (aplicadas por classe).
- i18n cobre todo o texto de chrome; nomes/enums do colaborador são DADO (strings simples).
- LGPD: sem PII sensível em nenhum lugar (types/data/modal/CSV); testes garantem (placeholder só 9 chaves,
  CSV e modal sem termos sensíveis).
- Gráficos em 2 linhas (3 topo + 2 base), responsivo a 1 coluna.
- Paginação: pager + seletor 5/10/25 (default 10); fatia PURA; troca de perPage reseta a página.
- Linha clicável abre o modal com os 9 campos; "Editar" navega a `/parceiros/colaboradores`.
- Gates verdes: typecheck, build, lint (0 erros/115 warnings), test (node), test:dom.
