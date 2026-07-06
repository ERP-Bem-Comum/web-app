/**
 * Dados PLACEHOLDER do relatório "Equipe ABC" (front-first). NÃO é um mock de teste (ADR-0011: mocks/doubles
 * só em `tests/`) — são CONSTANTES que a tela consome enquanto o endpoint do core-api (#114/#112) não existe.
 * Quando o backend nascer, a `data/` passa a montar estas linhas do DTO real (mesmo shape `TeamMemberRow`).
 *
 * ⚠️ DADOS SINTÉTICOS / ANONIMIZADOS — LGPD ⚠️
 * O CSV legado de origem (110 colaboradores REAIS) contém PII sensível: CPF, e-mail, telefone, endereço,
 * REMUNERAÇÃO, raça/cor, identidade de gênero, alergias (saúde) e biografia. NADA disso foi copiado para o
 * repositório. Estas linhas são FICTÍCIAS: nomes inventados pt-BR + apenas os campos de EXIBIÇÃO enxutos
 * (idade, área, função, vínculo, gênero, raça/cor, escolaridade, ano de contrato). Campos sensíveis (cpf/
 * e-mail/telefone/endereço/remuneração/alergias/biografia) são EXCLUÍDOS POR DESIGN — nem entram no tipo.
 * Os dados reais virão do endpoint com o mesmo recorte enxuto; a distribuição aqui é apenas realista o
 * suficiente para os 5 gráficos terem sinal. §IV: `idade` é number|null (null = "N/A"); zero `throw`.
 */

/** Área de atuação (= programa). Enum de exibição — string simples, NÃO i18n (é DADO). */
export type Programa = 'DDI' | 'EPV' | 'PARC'

/** Vínculo empregatício. */
export type Vinculo = 'PJ' | 'CLT'

/** Identidade de gênero (recorte de exibição). */
export type Genero = 'Mulher Cis' | 'Homem Cis' | 'Prefiro não responder'

/** Raça/cor (recorte de exibição). */
export type RacaCor = 'N/A' | 'Branco' | 'Preto' | 'Pardo' | 'Amarelo' | 'Prefiro não revelar'

/** Escolaridade (recorte de exibição). */
export type Escolaridade = 'N/A' | 'Superior Completo' | 'Superior Incompleto' | 'Pós-graduação' | 'Mestrado'

/**
 * Uma linha ENXUTA de colaborador (só campos de exibição). Por LGPD, campos sensíveis NÃO existem neste tipo:
 * sem cpf, email, telefone, endereço, remuneração, alergias, biografia. `idade` null = "N/A" (sem data de
 * nascimento cadastrada). `anoContrato` = ano de início do vínculo (2019..2025) — dirige o gráfico por ano.
 */
export type TeamMemberRow = Readonly<{
  nome: string
  /** Idade em anos; null = "N/A" (nascimento não informado). */
  idade: number | null
  programa: Programa
  funcao: string
  vinculo: Vinculo
  genero: Genero
  racaCor: RacaCor
  escolaridade: Escolaridade
  /** Ano de início do contrato (2019..2025). */
  anoContrato: number
}>

/**
 * 36 colaboradores SINTÉTICOS (nomes fictícios pt-BR) com distribuição realista entre os campos de exibição.
 * Ordem estável (a view não reordena). Nenhum campo sensível — ver o cabeçalho (LGPD).
 */
export const EQUIPE_PLACEHOLDER: readonly TeamMemberRow[] = [
  {
    nome: 'Ana Beatriz Moraes',
    idade: 34,
    programa: 'DDI',
    funcao: 'Coordenadora de Projetos',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'Branco',
    escolaridade: 'Pós-graduação',
    anoContrato: 2019,
  },
  {
    nome: 'Carlos Eduardo Farias',
    idade: 41,
    programa: 'EPV',
    funcao: 'Analista de Dados',
    vinculo: 'PJ',
    genero: 'Homem Cis',
    racaCor: 'Pardo',
    escolaridade: 'Superior Completo',
    anoContrato: 2020,
  },
  {
    nome: 'Mariana Lopes Cardoso',
    idade: 28,
    programa: 'PARC',
    funcao: 'Assistente Administrativa',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'Preto',
    escolaridade: 'Superior Incompleto',
    anoContrato: 2021,
  },
  {
    nome: 'Rafael Nunes Teixeira',
    idade: 52,
    programa: 'DDI',
    funcao: 'Consultor Sênior',
    vinculo: 'PJ',
    genero: 'Homem Cis',
    racaCor: 'Branco',
    escolaridade: 'Mestrado',
    anoContrato: 2019,
  },
  {
    nome: 'Juliana Ribeiro Alves',
    idade: null,
    programa: 'EPV',
    funcao: 'Coordenadora Pedagógica',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'Pardo',
    escolaridade: 'Pós-graduação',
    anoContrato: 2022,
  },
  {
    nome: 'Felipe Santana Braga',
    idade: 37,
    programa: 'PARC',
    funcao: 'Gerente de Parcerias',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Branco',
    escolaridade: 'Pós-graduação',
    anoContrato: 2020,
  },
  {
    nome: 'Camila Duarte Pires',
    idade: 45,
    programa: 'DDI',
    funcao: 'Analista de Dados',
    vinculo: 'PJ',
    genero: 'Mulher Cis',
    racaCor: 'Amarelo',
    escolaridade: 'Superior Completo',
    anoContrato: 2021,
  },
  {
    nome: 'Bruno Almeida Rocha',
    idade: 31,
    programa: 'EPV',
    funcao: 'Educador Social',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Preto',
    escolaridade: 'Superior Completo',
    anoContrato: 2023,
  },
  {
    nome: 'Larissa Fonseca Melo',
    idade: 26,
    programa: 'PARC',
    funcao: 'Assistente Administrativa',
    vinculo: 'PJ',
    genero: 'Mulher Cis',
    racaCor: 'Pardo',
    escolaridade: 'Superior Incompleto',
    anoContrato: 2024,
  },
  {
    nome: 'Gustavo Henrique Dias',
    idade: 39,
    programa: 'DDI',
    funcao: 'Coordenador de Projetos',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Branco',
    escolaridade: 'Mestrado',
    anoContrato: 2019,
  },
  {
    nome: 'Patrícia Gomes Vasconcelos',
    idade: 48,
    programa: 'EPV',
    funcao: 'Consultora Sênior',
    vinculo: 'PJ',
    genero: 'Mulher Cis',
    racaCor: 'Prefiro não revelar',
    escolaridade: 'Pós-graduação',
    anoContrato: 2020,
  },
  {
    nome: 'Thiago Correia Bastos',
    idade: 33,
    programa: 'PARC',
    funcao: 'Analista de Dados',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Pardo',
    escolaridade: 'Superior Completo',
    anoContrato: 2021,
  },
  {
    nome: 'Fernanda Azevedo Cunha',
    idade: null,
    programa: 'DDI',
    funcao: 'Assistente Administrativa',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'N/A',
    escolaridade: 'N/A',
    anoContrato: 2023,
  },
  {
    nome: 'Leonardo Martins Prado',
    idade: 55,
    programa: 'EPV',
    funcao: 'Educador Social',
    vinculo: 'PJ',
    genero: 'Homem Cis',
    racaCor: 'Branco',
    escolaridade: 'Superior Completo',
    anoContrato: 2019,
  },
  {
    nome: 'Beatriz Carvalho Nogueira',
    idade: 29,
    programa: 'PARC',
    funcao: 'Coordenadora de Projetos',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'Preto',
    escolaridade: 'Pós-graduação',
    anoContrato: 2022,
  },
  {
    nome: 'Diego Ramos Siqueira',
    idade: 42,
    programa: 'DDI',
    funcao: 'Gerente de Parcerias',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Pardo',
    escolaridade: 'Mestrado',
    anoContrato: 2020,
  },
  {
    nome: 'Renata Barros Figueiredo',
    idade: 36,
    programa: 'EPV',
    funcao: 'Analista de Dados',
    vinculo: 'PJ',
    genero: 'Mulher Cis',
    racaCor: 'Branco',
    escolaridade: 'Superior Completo',
    anoContrato: 2021,
  },
  {
    nome: 'Vinícius Tavares Monteiro',
    idade: 24,
    programa: 'PARC',
    funcao: 'Educador Social',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Amarelo',
    escolaridade: 'Superior Incompleto',
    anoContrato: 2024,
  },
  {
    nome: 'Aline Souza Batista',
    idade: 47,
    programa: 'DDI',
    funcao: 'Consultora Sênior',
    vinculo: 'PJ',
    genero: 'Mulher Cis',
    racaCor: 'Pardo',
    escolaridade: 'Pós-graduação',
    anoContrato: 2019,
  },
  {
    nome: 'Marcelo Pinto Guimarães',
    idade: 61,
    programa: 'EPV',
    funcao: 'Consultor Sênior',
    vinculo: 'PJ',
    genero: 'Homem Cis',
    racaCor: 'Branco',
    escolaridade: 'Mestrado',
    anoContrato: 2019,
  },
  {
    nome: 'Tatiane Mendes Lima',
    idade: 32,
    programa: 'PARC',
    funcao: 'Assistente Administrativa',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'Preto',
    escolaridade: 'Superior Completo',
    anoContrato: 2022,
  },
  {
    nome: 'André Luiz Castro',
    idade: 38,
    programa: 'DDI',
    funcao: 'Coordenador de Projetos',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Prefiro não revelar',
    escolaridade: 'Pós-graduação',
    anoContrato: 2020,
  },
  {
    nome: 'Priscila Andrade Reis',
    idade: null,
    programa: 'EPV',
    funcao: 'Educadora Social',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'Pardo',
    escolaridade: 'Superior Completo',
    anoContrato: 2023,
  },
  {
    nome: 'Rodrigo Freitas Campos',
    idade: 44,
    programa: 'PARC',
    funcao: 'Analista de Dados',
    vinculo: 'PJ',
    genero: 'Homem Cis',
    racaCor: 'Branco',
    escolaridade: 'Superior Completo',
    anoContrato: 2021,
  },
  {
    nome: 'Sabrina Costa Machado',
    idade: 27,
    programa: 'DDI',
    funcao: 'Assistente Administrativa',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'Amarelo',
    escolaridade: 'Superior Incompleto',
    anoContrato: 2024,
  },
  {
    nome: 'Eduardo Vieira Sampaio',
    idade: 50,
    programa: 'EPV',
    funcao: 'Gerente de Parcerias',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Pardo',
    escolaridade: 'Mestrado',
    anoContrato: 2019,
  },
  {
    nome: 'Natália Ferreira Coelho',
    idade: 35,
    programa: 'PARC',
    funcao: 'Coordenadora Pedagógica',
    vinculo: 'PJ',
    genero: 'Mulher Cis',
    racaCor: 'Branco',
    escolaridade: 'Pós-graduação',
    anoContrato: 2020,
  },
  {
    nome: 'Alexandre Ribeiro Pacheco',
    idade: 58,
    programa: 'DDI',
    funcao: 'Consultor Sênior',
    vinculo: 'PJ',
    genero: 'Homem Cis',
    racaCor: 'Preto',
    escolaridade: 'Mestrado',
    anoContrato: 2019,
  },
  {
    nome: 'Vanessa Lima Antunes',
    idade: 30,
    programa: 'EPV',
    funcao: 'Analista de Dados',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'Pardo',
    escolaridade: 'Superior Completo',
    anoContrato: 2022,
  },
  {
    nome: 'Fábio Nascimento Rios',
    idade: 40,
    programa: 'PARC',
    funcao: 'Educador Social',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Branco',
    escolaridade: 'Superior Completo',
    anoContrato: 2021,
  },
  {
    nome: 'Isabela Moreira Pontes',
    idade: 25,
    programa: 'DDI',
    funcao: 'Assistente Administrativa',
    vinculo: 'PJ',
    genero: 'Mulher Cis',
    racaCor: 'N/A',
    escolaridade: 'Superior Incompleto',
    anoContrato: 2024,
  },
  {
    nome: 'Ricardo Barbosa Leal',
    idade: 49,
    programa: 'EPV',
    funcao: 'Coordenador de Projetos',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Pardo',
    escolaridade: 'Pós-graduação',
    anoContrato: 2020,
  },
  {
    nome: 'Débora Santos Xavier',
    idade: 43,
    programa: 'PARC',
    funcao: 'Consultora Sênior',
    vinculo: 'PJ',
    genero: 'Mulher Cis',
    racaCor: 'Prefiro não revelar',
    escolaridade: 'Mestrado',
    anoContrato: 2019,
  },
  {
    nome: 'Paulo César Aragão',
    idade: 63,
    programa: 'DDI',
    funcao: 'Gerente de Parcerias',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Branco',
    escolaridade: 'Pós-graduação',
    anoContrato: 2019,
  },
  {
    nome: 'Letícia Cavalcanti Rezende',
    idade: null,
    programa: 'EPV',
    funcao: 'Educadora Social',
    vinculo: 'CLT',
    genero: 'Prefiro não responder',
    racaCor: 'Pardo',
    escolaridade: 'Superior Completo',
    anoContrato: 2023,
  },
  {
    nome: 'Marcos Vinícius Oliveira',
    idade: 33,
    programa: 'PARC',
    funcao: 'Analista de Dados',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Preto',
    escolaridade: 'Superior Completo',
    anoContrato: 2022,
  },
]
