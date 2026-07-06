/**
 * Dados PLACEHOLDER do relatório "Realizado × Planejado" (front-first). Estrutura em árvore: Centro de Custo
 * → Categoria → Subcategoria, cada subcategoria com 12 meses × 3 medidas (planejado/realizado/provisionado)
 * em CENTAVOS inteiros (§IV — dinheiro nunca em float). NÃO é um mock de teste (ADR-0011: mocks/doubles só em
 * `tests/`) — são CONSTANTES de domínio que a tela consome enquanto o endpoint do core-api (#114) não existe.
 * Quando o backend nascer, a `data/` passa a montar estas linhas do DTO real (mesmo shape `RawBudgetRow`).
 *
 * ── PLANEJADO (Valor Esperado): valores REAIS do CSV legado `realizado_x_planejado.csv` — as 84 linhas de
 *    subcategoria (as linhas SEM subcategoria, de nível-categoria, são omitidas, como no relatório legado).
 *    Cada mês recebe o `Valor Esperado` REAL daquele mês (não é o plano/12). Ordem de inserção = ordem do CSV.
 *    Grand total Planejado = R$ 77.474.064,09 (bate com o KPI do relatório).
 * ── REALIZADO e PROVISIONADO: no dado real legado são 0 (ainda não há execução lançada). Aqui ficam 0 —
 *    fiel ao CSV. Os KPIs Realizado/Provisionado e as colunas Realizado/Provisionado da tabela ficam "R$ 0,00".
 *    (O donut "Realizado vs previsto" usa valores DEMO ilustrativos, montados na page e rotulados "exemplo".)
 */

/** Índice do mês 0=Janeiro … 11=Dezembro. As 3 medidas em centavos para aquele mês. */
export type MonthCell = Readonly<{
  /** 0=Janeiro … 11=Dezembro. */
  month: number
  planejadoCents: number
  realizadoCents: number
  provisionadoCents: number
}>

/** Uma linha crua (folha da árvore): CC → categoria → subcategoria + a série mensal (12 meses). */
export type RawBudgetRow = Readonly<{
  centroCusto: string
  categoria: string
  subcategoria: string
  months: readonly MonthCell[]
}>

/**
 * Constrói os 12 meses a partir do array de 12 `planejado` (jan..dez), em centavos. Realizado/Provisionado
 * ficam 0 (o dado legado real). Fiel ao CSV: nenhuma execução lançada ainda.
 */
const months = (planejado: readonly number[]): readonly MonthCell[] =>
  planejado.map((p, i) => ({
    month: i,
    planejadoCents: p,
    realizadoCents: 0,
    provisionadoCents: 0,
  }))

/**
 * Linhas cruas placeholder — as 84 subcategorias reais do CSV legado, na ordem de inserção (Centro de Custo →
 * Categoria → Subcategoria). Cada série é o `Valor Esperado` mensal REAL. Realizado/Provisionado = 0 (legado).
 */
export const REALIZADO_X_PLANEJADO_RAW: readonly RawBudgetRow[] = [
  // ── CONSULTORIA ESTRATÉGICA ──
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Especialista Estratégico 1',
    months: months([
      13798200, 13798200, 14488200, 14488200, 14488200, 14488200, 14488200, 14488200, 14488200, 14488200,
      14488200, 14488200,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Diretora Parc',
    months: months([
      8412000, 8412000, 8832600, 8748600, 8748600, 8748600, 8748600, 8748600, 8748600, 8748600, 8748600,
      8748600,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Assessora de Direção',
    months: months([
      5666700, 5666700, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368,
      5893368,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador de Implementação',
    months: months([
      22666800, 22666800, 23573472, 23573472, 23573472, 23573472, 23573472, 23573472, 23573472, 23573472,
      23573472, 23573472,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador Captação de recursos',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Diretora Adjunta',
    months: months([
      13482000, 13482000, 14021280, 14021280, 14021280, 14021280, 14021280, 14021280, 14021280, 14021280,
      14021280, 14021280,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Analistas Pleno',
    months: months([
      16938000, 16938000, 17615520, 17615520, 17615520, 17615520, 17615520, 17615520, 17615520, 17615520,
      17615520, 17615520,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador de Implementação - 2023',
    months: months([
      15741000, 15741000, 16370640, 16370640, 16370640, 16370640, 16370640, 16370640, 16370640, 16370640,
      16370640, 16370640,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Gestor de Projetos - M',
    months: months([
      3996000, 3996000, 4155840, 4155840, 4155840, 4155840, 4155840, 4155840, 4155840, 4155840, 4155840,
      4155840,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador de Implementação - Assistentes 1',
    months: months([
      11970000, 11970000, 12448800, 12448800, 12448800, 12448800, 12448800, 12448800, 12448800, 12448800,
      12448800, 12448800,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Analista  Dados Educacionais',
    months: months([
      3990000, 3990000, 4149600, 4149600, 4149600, 4149600, 4149600, 4149600, 4149600, 4149600, 4149600,
      4149600,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador de Implementação - Assistentes 2',
    months: months([
      25407000, 25407000, 26423280, 26423280, 26423280, 26423280, 26423280, 26423280, 26423280, 26423280,
      26423280, 26423280,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Gestor de Projetos - A+I',
    months: months([
      9094800, 9094800, 9458592, 9458592, 9458592, 9458592, 9458592, 9458592, 9458592, 9458592, 9458592,
      9458592,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador de Implementação - novos 2024',
    months: months([
      9900000, 9900000, 10296000, 10296000, 10296000, 10296000, 10296000, 10296000, 10296000, 10296000,
      10296000, 10296000,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Gestor de Projetos - novo',
    months: months([
      3996000, 3996000, 3996000, 3996000, 3996000, 3996000, 3996000, 3996000, 3996000, 3996000, 3996000,
      3996000,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Auxiliar de Projetos',
    months: months([
      3600000, 3600000, 3744000, 3744000, 3744000, 3744000, 3744000, 3744000, 3744000, 3744000, 3744000,
      3744000,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Diretora DCE',
    months: months([
      9540000, 9540000, 9921600, 9921600, 9921600, 9921600, 9921600, 9921600, 9921600, 9921600, 9921600,
      9921600,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Assessores de Direção',
    months: months([
      10494000, 10494000, 10913760, 10913760, 10913760, 10913760, 10913760, 10913760, 10913760, 10913760,
      10913760, 10913760,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Analista Pleno Equidade',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador de Núcleo  Temático - formação',
    months: months([
      4950000, 4950000, 5148000, 5148000, 5148000, 5148000, 5148000, 5148000, 5148000, 5148000, 5148000,
      5148000,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador de Núcleo Temático - H',
    months: months([
      5666700, 5666700, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368,
      5893368,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador de Comunicação',
    months: months([
      5666700, 5666700, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368,
      5893368,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Diretora Desenv. Institucional - clt - parte parc',
    months: months([
      7350000, 7350000, 8085000, 8085000, 8085000, 8085000, 8085000, 8085000, 8085000, 8085000, 8085000,
      8085000,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Gerente de Gente e Gestão',
    months: months([
      4950000, 4950000, 5148000, 5148000, 5148000, 5148000, 5148000, 5148000, 5148000, 5148000, 5148000,
      5148000,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Gerente Administrativo Financeiro',
    months: months([
      4740000, 4740000, 4929600, 4929600, 4929600, 4929600, 4929600, 4929600, 4929600, 4929600, 4929600,
      4929600,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Gestor de Projeto',
    months: months([
      4547400, 4547400, 4729296, 4729296, 4729296, 4729296, 4729296, 4729296, 4729296, 4729296, 4729296,
      4729296,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Diretora Adjunta DDI - CLT',
    months: months([
      10200000, 10200000, 11220000, 11220000, 11220000, 11220000, 11220000, 11220000, 11220000, 11220000,
      11220000, 11220000,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador de Tecnologia e Inovação',
    months: months([
      5666700, 5666700, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368,
      5893368,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Coordenador de Núcleo Temático - M',
    months: months([
      5666700, 5666700, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368, 5893368,
      5893368,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Analista Pleno',
    months: months([
      3996000, 3996000, 4155840, 4155840, 4155840, 4155840, 4155840, 4155840, 4155840, 4155840, 4155840,
      4155840,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Analista  BI',
    months: months([
      3996000, 3996000, 3996000, 3996000, 3996000, 3996000, 3996000, 3996000, 3996000, 3996000, 3996000,
      3996000,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA ESTRATÉGICA',
    categoria: '1. CONSULTORIA ESTRATÉGICA',
    subcategoria: 'Auxiliar Administrativo',
    months: months([
      780000, 780000, 780000, 780000, 780000, 780000, 780000, 780000, 780000, 780000, 780000, 780000,
    ]),
  },
  // ── ADMINISTRAÇÃO ──
  {
    centroCusto: 'ADMINISTRAÇÃO',
    categoria: '8. ADMINISTRAÇÃO',
    subcategoria: 'Assessoria Jurídica',
    months: months([
      1101276, 1101276, 1101276, 1101276, 1101276, 1101276, 1101276, 1101276, 1101276, 1101276, 1101276,
      1101276,
    ]),
  },
  {
    centroCusto: 'ADMINISTRAÇÃO',
    categoria: '8. ADMINISTRAÇÃO',
    subcategoria: 'Locação de imóvel',
    months: months([
      2129133, 2129133, 2129133, 2129133, 2129133, 2129133, 2129133, 2129133, 2129133, 2129133, 2129133,
      2129133,
    ]),
  },
  {
    centroCusto: 'ADMINISTRAÇÃO',
    categoria: '8. ADMINISTRAÇÃO',
    subcategoria: 'Luz, água, telefonia e outros',
    months: months([
      367092, 367092, 367092, 367092, 367092, 367092, 367092, 367092, 367092, 367092, 367092, 367092,
    ]),
  },
  {
    centroCusto: 'ADMINISTRAÇÃO',
    categoria: '8. ADMINISTRAÇÃO',
    subcategoria: 'Assessoria Contábil',
    months: months([
      713481, 713481, 713481, 713481, 713481, 713481, 713481, 713481, 713481, 713481, 713481, 713481,
    ]),
  },
  {
    centroCusto: 'ADMINISTRAÇÃO',
    categoria: '8. ADMINISTRAÇÃO',
    subcategoria: 'Plataformas de Gestão',
    months: months([2013336, 0, 2013336, 0, 2013336, 0, 2013336, 1276047, 0, 1375314, 0, 0]),
  },
  {
    centroCusto: 'ADMINISTRAÇÃO',
    categoria: '8. ADMINISTRAÇÃO',
    subcategoria: 'Manutenção do escritório e outras despesas',
    months: months([
      1476210, 1476210, 1476210, 1476210, 1476210, 1476210, 1476210, 1476210, 1476210, 1476210, 1476210,
      1476210,
    ]),
  },
  {
    centroCusto: 'ADMINISTRAÇÃO',
    categoria: '8. ADMINISTRAÇÃO',
    subcategoria: 'Auditoria externa',
    months: months([0, 0, 2136390, 2100000, 2100000, 2100000, 2100000, 2100000, 2100000, 2100000, 0, 0]),
  },
  // ── EVENTOS ──
  {
    centroCusto: 'EVENTOS',
    categoria: '6. EVENTOS',
    subcategoria: 'Seminário Nacional',
    months: months([0, 0, 0, 0, 0, 56170800, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'EVENTOS',
    categoria: '6. EVENTOS',
    subcategoria: 'Produto/Serviço',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'EVENTOS',
    categoria: '6. EVENTOS',
    subcategoria: 'Apoio a eventos',
    months: months([0, 0, 0, 62395500, 0, 0, 0, 62395500, 0, 0, 0, 0]),
  },
  // ── CONSULTORIA DE BASE ──
  {
    centroCusto: 'CONSULTORIA DE BASE',
    categoria: '3. CONSULTORIA DE BASE',
    subcategoria: 'Analistas - 05',
    months: months([
      12718500, 12718500, 13227240, 13227240, 13227240, 13227240, 13227240, 13227240, 13227240, 13227240,
      13227240, 13227240,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA DE BASE',
    categoria: '3. CONSULTORIA DE BASE',
    subcategoria: 'Analistas',
    months: months([
      29700000, 29700000, 30888000, 30888000, 30888000, 30888000, 30888000, 30888000, 30888000, 30888000,
      30888000, 30888000,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA DE BASE',
    categoria: '3. CONSULTORIA DE BASE',
    subcategoria: 'Analistas - 07 estados',
    months: months([
      25200000, 25200000, 26208000, 26208000, 26208000, 26208000, 26208000, 26208000, 26208000, 26208000,
      26208000, 26208000,
    ]),
  },
  // ── CONSULTORIA TEMÁTICA ──
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Estruturação e reestruturação da formação de professores e gestores escolares',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Consultoria de Legislação e Incentivos',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria:
      'Consultores Temáticos para acompanhamento da formação (professores alfabetizadores, de Ed. Infantil, Gestores Escolares) (compromisso retira Ed infantil',
    months: months([
      4374999, 4374999, 4374999, 4374999, 4374999, 4374999, 4374999, 4374999, 4374999, 4374999, 4374999,
      4374999,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Consultoria de gênero e raça (equidade racial e de gênero)',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Formação de equipes regionais e municipais',
    months: months([
      59588001, 59588001, 59588001, 59588001, 59588001, 59588001, 59588001, 59588001, 59588001, 59588001,
      59588001, 59588001,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Grant para produção de memória institucional da ABC - DCE',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Incremento da FL para Formação de equipes regionais e municipais',
    months: months([
      24999999, 24999999, 24999999, 24999999, 24999999, 24999999, 24999999, 24999999, 24999999, 24999999,
      24999999, 24999999,
    ]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Consultorias Eventuais (estados)',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Consultoria de Planejamento, e desenvolvimento da Qualidade (2 consultores) Bertilo + 1',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Análise de contribuição - Avaliação de implementação - 2023',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Consultoria de Desenvolvimento e Estratégias da PARC',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria:
      'Consultoria para o Fortalecimento Institucional ABC (com foco no Desenvolvimento das equipes)',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Gestão, monitoramento, tecnologia e inovação',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Consultoria de Letramento Literário e Material Didático - 2023',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Consultoria para Reorganização da Rede',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: '2.1 PARCERIA NOVA ESCOLA',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Implementação do Material Didático para  10  Estados',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    centroCusto: 'CONSULTORIA TEMÁTICA',
    categoria: '2. CONSULTORIA TEMÁTICA',
    subcategoria: 'Produção e Implementação do Material Didático para 01  Estado novo - RN',
    months: months([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  // ── LOGÍSTICA ──
  {
    centroCusto: 'LOGÍSTICA',
    categoria: '4. LOGÍSTICA',
    subcategoria: 'Passagens aéreas',
    months: months([
      15557202, 83447202, 50859999, 50859999, 90236202, 39871599, 64438002, 41355399, 50859999, 42713199,
      48018399, 56291199,
    ]),
  },
  {
    centroCusto: 'LOGÍSTICA',
    categoria: '4. LOGÍSTICA',
    subcategoria: 'Hospedagem',
    months: months([
      1183500, 20299500, 13495500, 13495500, 27751500, 10044000, 18679500, 10255500, 13495500, 10579500,
      12960000, 15763500,
    ]),
  },
  {
    centroCusto: 'LOGÍSTICA',
    categoria: '4. LOGÍSTICA',
    subcategoria: 'Despesas de viagem',
    months: months([
      562500, 11848500, 6376500, 6376500, 13045500, 4788000, 8770500, 4837500, 6376500, 5008500, 6156000,
      7402500,
    ]),
  },
  // ── AVALIAÇÃO ──
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'AP',
    months: months([0, 0, 5149986, 0, 0, 5149986, 0, 0, 669498, 0, 669498, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'BA',
    months: months([0, 0, 63657498, 0, 0, 63657498, 0, 0, 8275476, 0, 8275476, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'ES',
    months: months([0, 0, 20101131, 0, 0, 20101131, 0, 0, 2613147, 0, 2613147, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'GO',
    months: months([0, 0, 31383897, 0, 0, 31383897, 0, 0, 4079907, 0, 4079907, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'MA',
    months: months([0, 0, 39071187, 0, 0, 39071187, 0, 0, 5079255, 0, 5079255, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'AL',
    months: months([0, 0, 15380757, 0, 0, 15380757, 0, 0, 1999500, 0, 1999500, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'PE',
    months: months([0, 0, 38150178, 0, 0, 38150178, 0, 0, 4959522, 0, 4959522, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'MS',
    months: months([0, 0, 15864330, 0, 0, 15864330, 0, 0, 2062362, 0, 2062362, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'MT',
    months: months([0, 0, 21347130, 0, 0, 21347130, 0, 0, 2775126, 0, 2775126, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'PA',
    months: months([0, 0, 50000130, 0, 0, 50000130, 0, 0, 6500016, 0, 6500016, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'PB',
    months: months([0, 0, 16925382, 0, 0, 16925382, 0, 0, 2200299, 0, 2200299, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'PI',
    months: months([0, 0, 16443873, 0, 0, 16443873, 0, 0, 2137704, 0, 2137704, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'PR',
    months: months([0, 0, 50477109, 0, 0, 50477109, 0, 0, 6562023, 0, 6562023, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'RN',
    months: months([0, 0, 13861260, 0, 0, 13861260, 0, 0, 1801965, 0, 1801965, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'RS',
    months: months([0, 0, 48064200, 0, 0, 48064200, 0, 0, 6248346, 0, 6248346, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'SP',
    months: months([0, 0, 194462109, 0, 0, 194462109, 0, 0, 25280073, 0, 25280073, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'TO',
    months: months([0, 0, 7773378, 0, 0, 7773378, 0, 0, 1010538, 0, 1010538, 0]),
  },
  {
    centroCusto: 'AVALIAÇÃO',
    categoria: '5. AVALIAÇÃO',
    subcategoria: 'SE',
    months: months([0, 0, 9281343, 0, 0, 9281343, 0, 0, 1206576, 0, 1206576, 0]),
  },
]
