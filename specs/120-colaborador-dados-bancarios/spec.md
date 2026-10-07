# 120 — Editar dados bancários e PIX do colaborador

**Tamanho:** M · **Status:** spec (aguardando backend) · **Data:** 2026-10-05
**Depende de:** `core-api#1029` (editar `bankAccount`/`pixKey` depois do cadastro)
**Origem:** pedido da P.O. Os colaboradores migrados do legado vieram **sem dados bancários**, porque o
legado não tinha esses campos. Sem eles, o colaborador não pode ser pago pela rotina de pagamento e remessa.

## Problema

Em Gestão de Parceiros > Colaboradores > detalhe, o modo **Editar** libera os campos cadastrais, mas a seção
**Dados Bancários e PIX** fica sempre **somente leitura**
(`collaborator-detail-content.component.tsx:228-260`, "create-only"). O motivo é real: o core-api só aceita
banco e PIX **na criação**. O `PUT /collaborators/:id` os exclui (`updateCollaboratorBodySchema.omit(...)`).

## Regra (decisões da P.O., 05/10)

- Os dados bancários e o PIX passam a ser **editáveis no modo Editar** do colaborador já cadastrado, **como
  no Fornecedor**.
- Vale para **preencher** (migrados sem dados) e para **trocar** (dado bancário muda).
- **Permissão:** a mesma do botão Editar (`collaborator:write`), como no Fornecedor.
- **Escopo: só dados bancários e PIX.** CPF, campos pessoais (core-api#438) e território ficam fora.

## Escopo (front)

| #   | Entrega                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No modo Editar, **Banco, Agência-DV, Conta, DV, Tipo de chave PIX e Chave PIX** deixam de ser somente leitura                                                                                      |
| 2   | **Banco pelo seletor de códigos** (`BankSelect`), o mesmo do cadastro do colaborador e do Fornecedor. A remessa precisa do código de 3 dígitos, e texto livre não serve ao CNAB                    |
| 3   | Máscara da agência. **Ao escolher a chave PIX do tipo CPF, o campo da chave mostra o CPF do colaborador** (P.O., 05/10); e-mail e telefone também derivam do dado correspondente, como no cadastro |
| 4   | Validação "tudo ou nada" do grupo bancário (banco parcial bloqueia o salvar), como no cadastro                                                                                                     |
| 5   | O salvar envia banco e PIX pela rota que a #1029 definir (no `PUT` cadastral ou numa rota própria)                                                                                                 |
| 6   | Cancelar a edição devolve os dados bancários originais                                                                                                                                             |
| 7   | Erros do backend (dado bancário ou PIX inválido) em PT                                                                                                                                             |

## Comportamento

- Fora do modo Editar, a seção continua somente leitura, e vazia quando o colaborador não tem dado bancário.
- Banco de cadastro antigo em texto livre: abre convertido para o código quando dá para reconhecer sem
  ambiguidade. Senão, o seletor mostra "não reconhecido", no mesmo padrão do Fornecedor.
- A troca fica registrada no histórico do colaborador (backend, #1029). O export do histórico já existente
  passa a mostrá-la.

## Contrato com o backend (registrado na core-api#1029, 07/10)

Mesmo `PUT /collaborators/:id`, com `bankAccount`/`pixKey` no body:

| Valor no body     | Efeito                        |
| ----------------- | ----------------------------- |
| campo **ausente** | mantém o que está gravado     |
| **`null`**        | **mantém** o que está gravado |
| objeto            | valida e substitui            |

⚠️ **`null` NÃO remove.** O front atual (`develop` e `main`) já envia `bankAccount: null` e `pixKey: null` em
todo `PUT` (`collaborator-detail-form.controller.ts`, `buildPre`), e o BFF repassa o corpo como está. Com
"`null` = remover", toda edição cadastral em produção apagaria os dados bancários. Remover pelo `PUT` fica fora
do escopo.

**No front:** o `buildPre` passa a enviar o objeto quando o grupo está preenchido e `null` quando está vazio,
o que mantém o que está gravado.

## Ordem de entrega

O front só vai para a `develop` depois da **core-api#1029** na `dev`. Antes disso, o backend descartaria
o dado bancário sem avisar, e a tela pareceria ter salvado.

## Onde mexe (front)

| Camada     | Arquivo                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| View       | `collaborator-detail/components/collaborator-detail-content.component.tsx`: tira o `readOnly` da seção bancária e usa `BankSelect`                    |
| Controller | `collaborator-detail/components/collaborator-detail-form.controller.ts`: já carrega banco e PIX no estado; passa a validá-los e a emiti-los no submit |
| Binding    | `collaborator-detail.binding.ts`: o salvar leva banco e PIX                                                                                           |
| BFF        | io-schema, use-case e `core-api-collaborators.ts` (o corpo de escrita ganha `bankAccount`/`pixKey`; hoje `:132` diz "create-only")                    |
| i18n       | erros novos, se a #1029 trouxer slugs próprios                                                                                                        |

## Fora de escopo

- **CPF:** travado no detalhe (web-app#418).
- **Campos pessoais pós-cadastro:** core-api#438.
- **Território (UF/município):** segue somente leitura.

## Achado resolvido: CPF travado

O detalhe liberava o CPF no modo Editar para quem tem `collaborator:write`. A P.O. decidiu em 05/10 que o CPF
**não se edita depois do cadastro**, para ninguém. Corrigido à parte, só no front, no **web-app#418**. Com
isso, a chave PIX do tipo CPF sempre reflete o CPF do cadastro.

## Testes (planejados)

- **Controller:** banco e PIX entram no submit; grupo bancário parcial bloqueia; cancelar restaura; escolher
  a chave PIX do tipo CPF preenche a chave com o CPF do colaborador.
- **View:** no modo Editar, os campos bancários habilitam; fora dele, ficam somente leitura.
- **BFF:** o corpo de escrita leva `bankAccount`/`pixKey`.
