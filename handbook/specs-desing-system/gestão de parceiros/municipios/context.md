# CONTEXT.md — Municípios Parceiros

## O que é esta tela
Tela de seleção dos municípios brasileiros parceiros da organização.
Extensão do padrão dual-panel de Estados, com filtro de UF obrigatório.

## O que ela faz
- Permite filtrar municípios por estado via combobox com autocomplete
- Exibe municípios do estado selecionado no painel esquerdo
- Permite adicionar/remover municípios ao painel direito (parceiros)
- Operações são imediatas (sem botão Salvar)
- Painel direito exibe todos os municípios adicionados independente da UF selecionada

## O que importa manter
- O combobox "Selecionar Estado" é OBRIGATÓRIO para listar municípios disponíveis
  — sem ele, o painel esq. mostra "Nenhum resultado encontrado"
- O combobox tem autocomplete (digitar filtra os estados)
- Ao selecionar um estado, aparece botão × para limpar a seleção
- Município já adicionado aparece como "Adicionado" (texto cinza) na lista do estado
  selecionado, mesmo se foi adicionado a partir de outro estado
- Painel direito mantém todos os municípios adicionados de qualquer UF (cross-state)
- Sem paginação em nenhum dos painéis
- Dado atual: 1 município adicionado (Anamã — AM)

## Diferença chave vs. Estados
- Estados: lista estática de 27 UFs, sempre visível, sem filtro de UF
- Municípios: lista dinâmica (carregada via API por UF), requer seleção de estado

## Rota
- /municipios — tela única (sem sub-rotas)
