# CONTEXT.md — Colaboradores

## O que é esta tela
Módulo de gerenciamento de colaboradores (pessoas físicas) vinculados a programas
da organização. É o CRUD principal de pessoas dentro do sistema.

## O que ela faz
- Lista todos os colaboradores com busca livre e filtros avançados (11 campos)
- Permite importar colaboradores em lote via CSV ou Excel
- Exibe o status duplo de cada pessoa: ativo/inativo + situação cadastral (cadastrado/pré-cadastrado)
- Permite pré-cadastro rápido (7 campos: dados ABC) via tela de Adicionar
- Permite visualização e edição do cadastro completo (21 campos) via Detalhe/Editar
- Permite desativação com campo "Motivo" obrigatório (select)

## Fluxo de cadastro em 2 etapas
1. Admin/ABC pré-cadastra via "Adicionar": apenas dados essenciais (Rep. Legal, Email,
   Área, Função, Início de Contrato, Vínculo, CPF) → status: "Pré Cadastrado"
2. Colaborador complementa seu próprio cadastro (Detalhe/Editar): dados pessoais,
   contato de emergência, identidade, saúde, mini biografia → status: "Cadastrado"

## O que importa manter (não mudar ao reconstruir)
- A divisão visual em 2 seções dentro do formulário é semântica, não apenas estética
- O modal de Desativar tem campo "Motivo" obrigatório — diferente dos outros módulos
- O botão "Desativar Colaborador(a)" no modal fica desabilitado até Motivo ser selecionado
- A coluna CONTRATOS/ADITIVOS existe mas aparece vazia — reservada para uso futuro
- Bug de encoding no DOM: "Avaliação" aparece como "AvaliaÃ§Ã£o" — erro na API, manter atenção
- O ícone de funil é um toggle: clique abre/fecha o painel de filtros, sem fechar ao filtrar
- Total de registros: 41 (ambiente de teste)

## Rotas
- /colaboradores                    — listagem
- /colaboradores/detalhes/:id       — detalhe (modo leitura)
- /colaboradores/editar/:id         — edição
- /colaboradores/adicionar          — pré-cadastro
