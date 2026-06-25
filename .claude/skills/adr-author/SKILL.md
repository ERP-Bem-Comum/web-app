---
name: adr-author
description: >
  Escreve um ADR novo do frontend v2 usando o template oficial e atualiza o índice. Use
  sempre que uma decisão arquitetural for tomada (em qualquer tamanho de tarefa). Foca no
  PORQUÊ e nos trade-offs, com as alternativas rejeitadas.
---

# ADR Author

## Quando criar um ADR
Houve uma **decisão** que muda "por que o projeto é assim" (não um simples como-fazer). Stack
fixa só muda com ADR novo que faça `supersedes` do anterior.

## Procedimento
1. Leia `handbook/adr/README.md` (regras + índice) e pegue o **próximo número** (atual: 0014 é o último).
2. Copie `.specify/templates/adr-template.fe.md` para `handbook/adr/NNNN-titulo-em-kebab-case.md`.
3. Preencha **Contexto → Decisão → Consequências → Alternativas**. Foque no **trade-off** e cite
   a constituição (§I–§XII) e ADRs relacionados; a decisão em presente indicativo.
4. Status começa `Proposed`; vira `Accepted` quando decidido; `Superseded by ADR-XXXX` se trocado.
5. **Adicione a linha no índice** de `handbook/adr/README.md`. Nunca edite um ADR `Accepted` para
   mudar a decisão — crie um novo.

## Estrutura do template (`adr-template.fe.md`)
`# ADR-NNNN: Título` · Contexto (forças/restrições, cite §/ADRs) · Decisão (cite canônico) ·
Consequências (positivas/negativas/ponto de troca) · Alternativas consideradas.

> O ADR é a fonte que um dev novo (ou agente) lê para **não desfazer** decisões deliberadas.
