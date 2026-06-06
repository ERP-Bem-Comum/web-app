# CONTEXT.md — Estados Parceiros

## O que é esta tela
Tela de seleção dos estados brasileiros que são parceiros da organização.
Usa um padrão de dual-panel (transferência) ao invés de um CRUD convencional.

## O que ela faz
- Exibe os 27 estados brasileiros no painel esquerdo em ordem alfabética
- Permite adicionar estados ao painel direito (parceiros) via botão + verde
- Permite remover estados do painel direito via botão − vermelho
- Ambos os painéis têm busca independente por texto
- Operações são imediatas (sem botão Salvar — API chamada a cada ação)

## O que importa manter
- Sem paginação — todos os 27 estados exibidos de uma vez (lista estática)
- Estado já adicionado: o botão + é substituído por texto cinza "Adicionado" (não some)
- Sem modal de confirmação para ADD nem para REMOVER — ação direta
- Sem breadcrumb nem BackButton — tela única sem sub-rotas
- A operação é reversível instantaneamente (ADD ↔ REMOVER)
- Dado atual: 1 estado adicionado (Acre)

## Rota
- /estados — tela única (sem sub-rotas)
