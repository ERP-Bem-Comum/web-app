# CONTEXT.md — Fornecedores

## O que é esta tela
Módulo de gerenciamento de fornecedores (pessoas jurídicas) que prestam serviços
à organização. Inclui dados financeiros completos (bancário + PIX).

## O que ela faz
- Lista fornecedores com busca e filtros por status de contrato, status e categoria
- Cadastro completo em 1 etapa (3 seções): dados cadastrais + bancários + PIX
- Filtragem por 22 categorias de serviço predefinidas
- Exportação da listagem filtrada
- Desativação via modal de confirmação (sem campo Motivo, diferente de Colaboradores)

## O que importa manter
- Formulário tem sempre 3 seções com títulos próprios (mesmo no Adicionar)
- O breadcrumb de Adicionar usa o singular "Fornecedor > Adicionar" (inconsistência com listagem)
- A coluna CONTRATOS/ADITIVOS existe mas está vazia — reservada
- A linha inteira é clicável e navega para o detalhe (não apenas colunas específicas)
- O modal de Desativar usa ícone ℹ️ ciano (não ⚠️ vermelho como em Colaboradores)
- Dados bancários visíveis no detalhe mesmo sem o banco selecionado (campo Banco vazio)

## Rotas
- /fornecedores                   — listagem
- /fornecedores/detalhes/:id      — detalhe
- /fornecedores/editar/:id        — edição
- /fornecedores/adicionar         — criação
