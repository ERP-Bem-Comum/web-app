# 117 — Fornecedor pessoa física (CPF/CNPJ)

**Tamanho:** M · **Status:** spec (aguardando backend) · **Data:** 2026-09-30
**Depende de:** `core-api#1022` (`SupplierDocument`, `personType`, PF sem Razão Social/Nome Fantasia)
**Origem:** pedido da P.O., porque o cliente tem fornecedores pessoa física pagos por RPA

## Problema

O cadastro de Fornecedor (Gestão de Parceiros > Fornecedor > Novo Fornecedor) só aceita **CNPJ**. O
cliente também contrata **pessoas físicas pagas por RPA**, e hoje elas não entram no sistema.

O pagamento do RPA **já está resolvido**: o Contas a Pagar ativa o motor fiscal para documento de RPA
(impostos informados conforme o documento, bruto/líquido, obrigações tributárias). A remessa CNAB também
já trata CPF: o tipo de inscrição sai do tamanho do documento. **O que falta é o cadastro, e a leitura
correta dele nas outras telas.**

Colaborador e Fornecedor **continuam separados**. Na operação do cliente eles têm função e significado
diferentes, e o sistema foi desenhado assim. Um fornecedor PF não é um colaborador.

## Regra

|               | Pessoa Física                                 | Pessoa Jurídica                                      |
| :------------ | :-------------------------------------------- | :--------------------------------------------------- |
| Documento     | **CPF**, máscara `000.000.000-00`, só dígitos | **CNPJ**, máscara `00.000.000/0000-00`, alfanumérico |
| Validação     | dígito verificador do CPF                     | dígito verificador do CNPJ (como hoje)               |
| Nome          | "Nome completo", obrigatório                  | "Nome", obrigatório (como hoje)                      |
| Razão Social  | **não existe** (campo oculto, não enviado)    | obrigatória                                          |
| Nome Fantasia | **não existe** (campo oculto, não enviado)    | obrigatório                                          |

**O tipo PF/PJ não é um dado gravado. Ele é uma leitura do documento** (11 dígitos é CPF, 14 caracteres
é CNPJ). O backend devolve essa leitura pronta em `personType`, e **o front nunca deduz PF/PJ pelo tipo
de parceiro**, que é o erro de hoje em Contratos e no Lançar Documento (lá, "só colaborador é PF").

## Escopo

| #   | Entrega                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------- |
| 1   | **Chave segmentada "Pessoa Jurídica \| Pessoa Física"** no Novo e no Editar Fornecedor, antes do documento     |
| 2   | Campo **CPF/CNPJ**: rótulo, máscara (`'cpf'` ou `'cnpj'`) e validação seguem a chave                           |
| 3   | PF esconde Razão Social e Nome Fantasia, e "Nome" vira "Nome completo"                                         |
| 4   | Cadeia BFF: io-schema aceita 11 ou 14 caracteres; use-case valida CPF ou CNPJ; o campo viaja como `document`   |
| 5   | Lista e detalhe: coluna "CPF/CNPJ" mascarada, com etiqueta **PF**/**PJ**; a busca aceita os dois; o CSV também |
| 6   | **Contratos**: o contratado fornecedor PF aparece como "Fornecedor · Pessoa Física · CPF …"                    |
| 7   | **Lançar Documento**: o seletor de fornecedor usa a mesma etiqueta e o mesmo rótulo                            |
| 8   | Novos códigos de erro do backend mapeados para mensagens em PT (i18n)                                          |

## Desenho da tela

```
 Novo Fornecedor
 Tipo de fornecedor
 ┌────────────────────┬────────────────────┐
 │ ● Pessoa Jurídica  │   Pessoa Física    │
 └────────────────────┴────────────────────┘
 CNPJ *                         E-mail *
 Razão Social *                 Nome Fantasia *
 Nome *                         Categoria de serviço *
```

Com **Pessoa Física** marcada, o documento vira "CPF", Razão Social e Nome Fantasia somem, e "Nome" vira
"Nome completo".

**Por que chave segmentada.** É o padrão que o sistema já usa para escolher entre tipos (o tipo da conta
no modal "Nova conta" da Conciliação, `add-account-modal.component.tsx:124`). As outras formas foram
descartadas:

- **Checkbox ("É pessoa física?"):** mostra só uma das opções.
- **Chave liga/desliga:** significa ligar ou desligar uma configuração, não escolher entre dois tipos.

### Comportamento

- **Começa em Pessoa Jurídica**, porque é a maioria dos fornecedores.
- **Trocar de tipo limpa o documento**, porque um CNPJ não vira CPF.
- **Razão Social e Nome Fantasia ficam guardados só na tela:** se a pessoa voltar para PJ, eles
  reaparecem. Em PF, eles **não são enviados**, porque o backend recusa PF com Razão Social (422, não
  ignora).
- **Chave Pix derivada do documento:** passa a ser do tipo CPF quando o fornecedor é PF.
- **Edição:** a chave vem marcada pelo `personType`. Trocar o tipo é mudança de campo sensível
  (`supplier:edit-sensitive`). Sem a permissão, a chave aparece **visivelmente bloqueada**, com a
  explicação de onde se destrava: `disabled` no DOM não basta.

## Contrato com o backend (core-api#1022)

- **Entrada:** `document` (11 ou 14 caracteres, sem máscara). O backend aceita `cnpj` como alias
  deprecated por um ciclo, mas **o front já nasce enviando `document`**.
- **Resposta:** `document` e `personType: 'PF' | 'PJ'`. `corporateName` e `fantasyName` vêm `null` em PF.
- **Erros novos:**
  - `invalid-supplier-document`
  - `*-document-duplicate` (substituem os `*-cnpj-duplicate`)
  - `supplier-corporate-name-not-allowed-for-pf`
  - `supplier-fantasy-name-not-allowed-for-pf`

**Ordem de entrega:** o front só vai para `develop` depois que a #1022 estiver na `dev` do core-api.

## O que já existe e é reusado

- Máscaras `'cpf'`, `'cnpj'` e `'cpf-cnpj'` no atom Input (`src/shared/ui/atoms/input/input.mask.ts`).
  A `'cpf'` já roda no Colaborador, em Minha Conta e no Usuário.
- `maskCpf` e `maskCpfCnpj` em `src/shared/document/cnpj.ts`.
- VO de CPF no BFF: `src/modules/partners/server/domain/value-objects/cpf.value-object.ts`.
- **O VO de CNPJ do BFF não muda**: Financiador e Acordo também usam.

## Pontos de atenção

- **`supplier.io-schemas.ts:36`** tem `min(14)`, que recusa o CPF no BFF antes de chegar ao use-case.
- **`supplier-list.page.tsx:45`** (`formatCnpj`) devolve 11 dígitos sem máscara, e a mesma função
  alimenta o CSV.
- **`supplier-detail-content.component.tsx:138`** fixa a máscara `'cnpj'`: um CPF apareceria como
  `12.345.678/901`.
- **`contracts/.../partners.repository.ts:61-67`** e **`financial/.../document-form.view.ts:61`** decidem
  PF/PJ pelo tipo de parceiro. Sem a troca por `personType`, um fornecedor PF sai como
  "PJ · CNPJ 123.456.789-01".

## Fora de escopo

- **Cálculo do RPA e retenções:** já existe no Contas a Pagar.
- **Unificar Colaborador e Fornecedor:** são cadastros diferentes por desenho, e o mesmo CPF pode existir
  nos dois.
- **Recarga dos fornecedores PF do legado:** depende da verificação da ETL, que está na #1022.
- **Financiador e Acordo** continuam só com CNPJ.

## Testes (planejados)

- **Schema do formulário:** CPF válido, CPF com DV errado, 12 e 13 caracteres recusados, PF sem Razão
  Social passando, e PJ sem Razão Social recusado.
- **Controller/binding do formulário:**
  - A troca de tipo limpa o documento.
  - Razão Social volta ao retornar para PJ.
  - PF não envia `corporateName`/`fantasyName`.
  - A edição semeia a chave pelo `personType`.
  - Sem permissão, a chave aparece bloqueada.
- **BFF:** io-schema aceitando 11 caracteres; use-case com CPF e com CNPJ.
- **Lista e detalhe:** máscara e etiqueta PF/PJ.
- **Contratos e Lançar Documento:** fornecedor PF lido como PF (`partner-detail-to-contract.test.ts`).
