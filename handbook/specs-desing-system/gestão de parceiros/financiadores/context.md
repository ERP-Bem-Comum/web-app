# CONTEXT.md — Financiadores

## O que é esta tela
Módulo de gerenciamento de financiadores — entidades (PJs ou pessoas físicas) que
financiam os programas da organização. É o módulo mais simples do conjunto.

## O que ela faz
- Lista financiadores com busca simples (sem painel de filtros)
- CRUD completo: Detalhe → Editar → Desativar / Adicionar
- Formulário único sem seções nomeadas (6 campos)

## O que importa manter
- Não tem botão de filtro (funil) — diferente de Colaboradores e Fornecedores
- Formulário não tem divisão em seções (ao contrário de Fornecedores)
- Modal de Desativar: ícone ℹ️ ciano (não ⚠️ vermelho), sem campo Motivo
- Texto do modal é dinâmico: "Você está prestes a desativar o financiador [Nome]."
- Hierarquia invertida dos botões no modal de desativação: a ação SEGURA ("Não desativar")
  é o botão ciano (destaque), e a DESTRUTIVA ("Sim, tenho certeza") é outline
- O campo Endereço ocupa toda a segunda linha (campo largo ~3 colunas)
- Paginação: 1-1 (todos os 5 registros cabem na primeira página com 5 itens/pág)

## Rotas
- /financiadores                  — listagem
- /financiadores/detalhes/:id     — detalhe
- /financiadores/editar/:id       — edição
- /financiadores/adicionar        — criação
