/**
 * Dados PLACEHOLDER do relatório "Posição de Pagamentos" (front-first). É um SNAPSHOT da posição das
 * obrigações a pagar, em árvore de 3 níveis: Fornecedor → Centro de Custo → Categoria (folha). Cada folha
 * traz as 3 MEDIDAS DERIVADAS em CENTAVOS inteiros (§IV — dinheiro nunca em float):
 *   • Em atraso = não pago E vencido (dueDate < hoje).
 *   • Pago      = título liquidado.
 *   • A pagar   = não pago E a vencer (dueDate ≥ hoje).
 *
 * Distribuição fiel ao legado: a MAIOR parte em **Em atraso**, algum **A pagar**, e **Pago** baixo/zero
 * (é um snapshot de posição pendente). NÃO é um mock de teste (ADR-0011: mocks/doubles só em `tests/`) — são
 * CONSTANTES de domínio SINTÉTICAS (nomes pt-BR fictícios, sem PII) que a tela consome enquanto o endpoint do
 * core-api (#114) não existe. Quando o backend nascer, a `data/` passa a montar estas linhas do DTO real
 * (mesmo shape `RawPosicaoRow`, com os 3 buckets já derivados de status + dueDate no BFF); e para "Posição de
 * Recebíveis" (`type: 'r'`) trocam-se estas constantes por uma fonte de recebíveis — o shape é o MESMO.
 */

/** Uma linha CRUA = uma FOLHA da árvore (Fornecedor → Centro de Custo → Categoria) + as 3 medidas derivadas. */
export type RawPosicaoRow = Readonly<{
  supplier: string
  costCenter: string
  category: string
  emAtrasoCents: number
  pagoCents: number
  aPagarCents: number
}>

/**
 * Linhas cruas placeholder — 5 fornecedores, cada um com 1-3 centros de custo, cada CC com 2-4 categorias-
 * folha. Valores em centavos plausíveis: a MAIOR parte em Em atraso, algum A pagar, Pago baixo/0. Ordem de
 * inserção = ordem de exibição na árvore.
 */
export const POSICAO_PAGAMENTOS_RAW: readonly RawPosicaoRow[] = [
  // ── Consultoria Alfa Estratégia Ltda ──
  {
    supplier: 'Consultoria Alfa Estratégia Ltda',
    costCenter: 'Diretoria Executiva',
    category: 'Consultoria Estratégica',
    emAtrasoCents: 9_640_000,
    pagoCents: 1_200_000,
    aPagarCents: 3_200_000,
  },
  {
    supplier: 'Consultoria Alfa Estratégia Ltda',
    costCenter: 'Diretoria Executiva',
    category: 'Assessoria de Governança',
    emAtrasoCents: 3_750_000,
    pagoCents: 0,
    aPagarCents: 1_250_000,
  },
  {
    supplier: 'Consultoria Alfa Estratégia Ltda',
    costCenter: 'Planejamento e Projetos',
    category: 'Elaboração de Projetos',
    emAtrasoCents: 6_200_000,
    pagoCents: 1_550_000,
    aPagarCents: 3_100_000,
  },

  // ── Tecnologia Beta Sistemas S.A. ──
  {
    supplier: 'Tecnologia Beta Sistemas S.A.',
    costCenter: 'Tecnologia da Informação',
    category: 'Licenças de Software',
    emAtrasoCents: 4_800_000,
    pagoCents: 2_400_000,
    aPagarCents: 2_400_000,
  },
  {
    supplier: 'Tecnologia Beta Sistemas S.A.',
    costCenter: 'Tecnologia da Informação',
    category: 'Infraestrutura em Nuvem',
    emAtrasoCents: 3_600_000,
    pagoCents: 0,
    aPagarCents: 1_800_000,
  },
  {
    supplier: 'Tecnologia Beta Sistemas S.A.',
    costCenter: 'Suporte e Manutenção',
    category: 'Manutenção de Equipamentos',
    emAtrasoCents: 1_280_000,
    pagoCents: 320_000,
    aPagarCents: 640_000,
  },
  {
    supplier: 'Tecnologia Beta Sistemas S.A.',
    costCenter: 'Suporte e Manutenção',
    category: 'Suporte Técnico',
    emAtrasoCents: 960_000,
    pagoCents: 0,
    aPagarCents: 480_000,
  },

  // ── Serviços Gama Facilities Eireli ──
  {
    supplier: 'Serviços Gama Facilities Eireli',
    costCenter: 'Administração Geral',
    category: 'Limpeza e Conservação',
    emAtrasoCents: 2_760_000,
    pagoCents: 920_000,
    aPagarCents: 920_000,
  },
  {
    supplier: 'Serviços Gama Facilities Eireli',
    costCenter: 'Administração Geral',
    category: 'Segurança Patrimonial',
    emAtrasoCents: 3_450_000,
    pagoCents: 0,
    aPagarCents: 1_150_000,
  },
  {
    supplier: 'Serviços Gama Facilities Eireli',
    costCenter: 'Administração Geral',
    category: 'Recepção e Portaria',
    emAtrasoCents: 1_680_000,
    pagoCents: 280_000,
    aPagarCents: 560_000,
  },

  // ── Editora Delta Comunicação Ltda ──
  {
    supplier: 'Editora Delta Comunicação Ltda',
    costCenter: 'Comunicação Institucional',
    category: 'Materiais Gráficos',
    emAtrasoCents: 850_000,
    pagoCents: 0,
    aPagarCents: 340_000,
  },
  {
    supplier: 'Editora Delta Comunicação Ltda',
    costCenter: 'Comunicação Institucional',
    category: 'Produção Audiovisual',
    emAtrasoCents: 2_520_000,
    pagoCents: 840_000,
    aPagarCents: 1_680_000,
  },
  {
    supplier: 'Editora Delta Comunicação Ltda',
    costCenter: 'Eventos e Mobilização',
    category: 'Organização de Eventos',
    emAtrasoCents: 4_400_000,
    pagoCents: 0,
    aPagarCents: 2_200_000,
  },
  {
    supplier: 'Editora Delta Comunicação Ltda',
    costCenter: 'Eventos e Mobilização',
    category: 'Locação de Espaços',
    emAtrasoCents: 1_170_000,
    pagoCents: 390_000,
    aPagarCents: 780_000,
  },

  // ── Logística Épsilon Transportes ME ──
  {
    supplier: 'Logística Épsilon Transportes ME',
    costCenter: 'Operações de Campo',
    category: 'Frete e Transporte',
    emAtrasoCents: 5_280_000,
    pagoCents: 1_320_000,
    aPagarCents: 1_980_000,
  },
  {
    supplier: 'Logística Épsilon Transportes ME',
    costCenter: 'Operações de Campo',
    category: 'Combustível e Manutenção',
    emAtrasoCents: 1_780_000,
    pagoCents: 0,
    aPagarCents: 890_000,
  },
]
