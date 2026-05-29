(function () {
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ─── DATA MOCK ────────────────────────────────────────── */
  // 12 contratos · cobre todos os status do ciclo de vida
  // diasFim: dias até a data final (negativo = já encerrado)
  const CONTRATOS = [
    { num:'0001/2026',
      contratado:{ kind:'PJ', name:'Bambu Educação',                doc:'37.364.305/0001-92', av:'BE' },
      tipo:'Parceria',                objeto:'Assessoria pedagógica e gestão de projetos educacionais regionais',
      programa:'EPV — Apoio Regional',           centroResp:'EPV',
      valorOriginal:180000, valorAtual:215358,
      dataInicio:'01/01/2026', dataFim:'31/12/2026', diasFim:229,
      aditivos:1, status:'em-andamento', origemCadastro:'manual' },

    { num:'0002/2025',
      contratado:{ kind:'PJ', name:'Indústria Verde Pneumáticos',  doc:'42.815.667/0001-04', av:'IV' },
      tipo:'Fornecimento',            objeto:'Fornecimento e manutenção de equipamentos pneumáticos industriais',
      programa:'MAN — Manutenção Operacional',   centroResp:'OPS',
      valorOriginal:145000, valorAtual:145000,
      dataInicio:'15/03/2025', dataFim:'14/03/2027', diasFim:302,
      aditivos:2, status:'em-andamento', origemCadastro:'manual' },

    { num:'0003/2026',
      contratado:{ kind:'PF', name:'João Mendes da Silva',          doc:'248.519.776-04',     av:'JM' },
      tipo:'Prestação de Serviço',    objeto:'Diagramação editorial e produção gráfica para publicações',
      programa:'EPV — Apoio Regional',           centroResp:'EPV',
      valorOriginal:18500, valorAtual:18500,
      dataInicio:'01/05/2026', dataFim:'30/11/2026', diasFim:198,
      aditivos:0, status:'em-andamento', origemCadastro:'manual' },

    { num:'0018/2024',
      contratado:{ kind:'PJ', name:'Vivo Empresas Brasil',          doc:'02.558.157/0001-62', av:'VE' },
      tipo:'Prestação de Serviço',    objeto:'Telecomunicações corporativas — telefonia e dados',
      programa:'INF — Infraestrutura',           centroResp:'TI',
      valorOriginal:22000, valorAtual:24500,
      dataInicio:'01/01/2024', dataFim:'31/12/2026', diasFim:229,
      aditivos:3, status:'em-andamento', origemCadastro:'migracao' },

    { num:'0004/2025',
      contratado:{ kind:'PJ', name:'Studio Design Visual',          doc:'19.477.108/0001-55', av:'SD' },
      tipo:'Prestação de Serviço',    objeto:'Identidade visual e materiais institucionais 2025',
      programa:'COM — Comunicação',              centroResp:'COM',
      valorOriginal:30000, valorAtual:35000,
      dataInicio:'01/04/2025', dataFim:'31/12/2025', diasFim:-136,
      aditivos:1, status:'encerrado', origemCadastro:'manual' },

    { num:'0007/2026',
      contratado:{ kind:'PJ', name:'Sustentabilidade Ambiental BR', doc:'31.092.844/0001-71', av:'SA' },
      tipo:'Prestação de Serviço',    objeto:'Limpeza terceirizada e gestão de resíduos sólidos',
      programa:'MAN — Manutenção Operacional',   centroResp:'OPS',
      valorOriginal:84000, valorAtual:84000,
      dataInicio:'01/03/2026', dataFim:'28/02/2027', diasFim:288,
      aditivos:0, status:'em-andamento', origemCadastro:'manual' },

    { num:'0011/2025',
      contratado:{ kind:'PJ', name:'Consultoria Capacita Brasil',   doc:'07.812.953/0001-29', av:'CC' },
      tipo:'Consultoria',             objeto:'Treinamento de equipes em metodologias ágeis e gestão',
      programa:'RH — Recursos Humanos',          centroResp:'RH',
      valorOriginal:12500, valorAtual:12500,
      dataInicio:'01/06/2025', dataFim:'31/05/2026', diasFim:15,
      aditivos:0, status:'a-vencer', origemCadastro:'manual' },

    { num:'0012/2026',
      contratado:{ kind:'PF', name:'Maria Santos Oliveira',         doc:'392.741.658-23',     av:'MS' },
      tipo:'Consultoria',             objeto:'Consultoria em comunicação institucional e crisis management',
      programa:'COM — Comunicação',              centroResp:'COM',
      valorOriginal:8500, valorAtual:8500,
      dataInicio:'15/05/2026', dataFim:'15/11/2026', diasFim:183,
      aditivos:0, status:'rascunho', origemCadastro:'manual' },

    { num:'0008/2024',
      contratado:{ kind:'PJ', name:'Internet Brasil Telecom',       doc:'08.234.119/0001-86', av:'IB' },
      tipo:'Prestação de Serviço',    objeto:'Conectividade banda larga corporativa — 500MB dedicado',
      programa:'INF — Infraestrutura',           centroResp:'TI',
      valorOriginal:3200, valorAtual:3840,
      dataInicio:'01/06/2024', dataFim:'31/05/2026', diasFim:15,
      aditivos:2, status:'a-vencer', origemCadastro:'migracao' },

    { num:'0015/2025',
      contratado:{ kind:'PJ', name:'Office Móveis & Cia',           doc:'15.749.221/0001-90', av:'OM' },
      tipo:'Fornecimento',            objeto:'Fornecimento de mobiliário corporativo e estações de trabalho',
      programa:'ADM — Administrativo',           centroResp:'ADM',
      valorOriginal:28000, valorAtual:28000,
      dataInicio:'10/04/2025', dataFim:'10/04/2027', diasFim:329,
      aditivos:0, status:'em-andamento', origemCadastro:'manual' },

    { num:'0020/2026',
      contratado:{ kind:'PJ', name:'Logística Express Cargas',      doc:'29.453.781/0001-18', av:'LE' },
      tipo:'Prestação de Serviço',    objeto:'Logística e distribuição de materiais para unidades regionais',
      programa:'OPS — Operações',                centroResp:'OPS',
      valorOriginal:65000, valorAtual:65000,
      dataInicio:'01/05/2026', dataFim:'30/04/2027', diasFim:349,
      aditivos:0, status:'em-andamento', origemCadastro:'integracao' },

    { num:'0009/2025',
      contratado:{ kind:'PF', name:'Carlos Eduardo Designer',       doc:'576.821.493-67',     av:'CE' },
      tipo:'Prestação de Serviço',    objeto:'Diagramação e arte-final de publicações institucionais',
      programa:'COM — Comunicação',              centroResp:'COM',
      valorOriginal:6000, valorAtual:6000,
      dataInicio:'01/07/2025', dataFim:'31/12/2025', diasFim:-136,
      aditivos:0, status:'encerrado', origemCadastro:'manual' }
  ];

  const TIPO_CLASS = {
    'Parceria':             'parc',
    'Prestação de Serviço': 'pserv',
    'Fornecimento':         'forn',
    'Consultoria':          'cons',
    'Locação':              'loc'
  };

  function fmtBRL(n) {
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function vigenciaInfo(diasFim, status) {
    // Encerrado/Rascunho não destacam urgência
    if (['encerrado', 'rascunho'].includes(status)) {
      return { cls: '', sub: '' };
    }
    if (diasFim < 0)         return { cls: 'is-overdue', sub: `vencido ${Math.abs(diasFim)}d` };
    if (diasFim === 0)       return { cls: 'is-today',   sub: 'hoje' };
    if (diasFim <= 30)       return { cls: 'is-near',    sub: `em ${diasFim}d` };
    if (diasFim <= 90)       return { cls: 'is-future',  sub: `em ${diasFim}d` };
    return { cls: '', sub: '' };
  }

  /* ─── RENDER ────────────────────────────────────────────── */
  function render(contratos) {
    const body = $('#grid-body');
    if (!contratos.length) {
      body.innerHTML = `
        <div class="grid-empty">
          <div class="ic-big"><svg><use href="#i-doc"/></svg></div>
          <h4>Nenhum contrato encontrado</h4>
          <p>Tente ajustar os filtros ou cadastrar um novo contrato.</p>
        </div>`;
      return;
    }
    body.innerHTML = contratos.map((c, i) => {
      const tipoCls = TIPO_CLASS[c.tipo] || 'pserv';
      const vig = vigenciaInfo(c.diasFim, c.status);
      const statusKey = c.status;
      const statusLbl = {
        'rascunho':'Rascunho',
        'em-andamento':'Em andamento',
        'a-vencer':'A vencer',
        'vencido':'Vencido',
        'encerrado':'Encerrado',
        'suspenso':'Suspenso',
        'cancelado':'Cancelado'
      }[statusKey] || statusKey;

      const aditivosCell = c.aditivos > 0
        ? `<span class="aditivos-badge"><span class="n">+${c.aditivos}</span></span>`
        : `<span class="aditivos-none">—</span>`;

      // Programa: pega só o código antes do —
      const programaShort = (c.programa || '').split(' — ')[0] || '—';

      return `
        <div class="grid-row" data-i="${i}">
          <span class="doc-num"><span class="num">${c.num}</span></span>
          <div class="forn ${c.contratado.kind === 'PF' ? 'is-pf' : ''}">
            <span class="av">${c.contratado.av}</span>
            <div class="info">
              <span class="nm">${c.contratado.name}</span>
              <span class="doc">${c.contratado.doc}</span>
            </div>
          </div>
          <span class="objeto-cell" title="${c.objeto}">${c.objeto}</span>
          <span class="tipo-tag ${tipoCls}">${c.tipo === 'Prestação de Serviço' ? 'Serviço' : c.tipo}</span>
          <span class="programa-cell">${programaShort}</span>
          <span class="val liquido">${fmtBRL(c.valorAtual)}</span>
          <span class="dt">${c.dataInicio}</span>
          <div class="dt-venc ${vig.cls}">
            <span class="d">${c.dataFim}</span>
            ${vig.sub ? `<span class="sub">${vig.sub}</span>` : ''}
          </div>
          <span class="aditivos-cell">${aditivosCell}</span>
          <span class="status ${statusKey}">${statusLbl}</span>
        </div>`;
    }).join('');

    // re-bind row click — abre drawer
    $$('.grid-row').forEach(row => {
      row.addEventListener('click', () => openDrawer(Number(row.dataset.i)));
    });
  }

  /* ═══════════════════════════════════════════════════════════
     DRAWER — Detalhes do Contrato
     ═══════════════════════════════════════════════════════════ */
  let activeDrawerDocIdx = null;

  function openDrawer(contratoIdx) {
    const c = CONTRATOS[contratoIdx];
    if (!c) return;
    activeDrawerDocIdx = contratoIdx;

    // Highlight active row na grid
    $$('.grid-row').forEach(r => r.classList.toggle('is-active', Number(r.dataset.i) === contratoIdx));

    // Header — número do contrato (NNN/AAAA)
    const contratoLabel = deriveContratoId(c);
    $('#drawer-doc-id').textContent = contratoLabel;

    // Body
    $('#drawer-body').innerHTML = buildDrawerBody(c);

    // Abre (se já estava aberto, mantém — só atualiza conteúdo)
    const drawer = $('#drawer');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    const drawer = $('#drawer');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    activeDrawerDocIdx = null;
    $$('.grid-row.is-active').forEach(r => r.classList.remove('is-active'));
  }

  function deriveContratoId(c) {
    // Contrato usa o próprio número como id (NNN/AAAA conforme RN-03)
    return c.num;
  }

  function tipoLabelShort(t) {
    // Sigla curta pro header (3-4 chars)
    return {
      'Parceria':             'PARC',
      'Prestação de Serviço': 'PSERV',
      'Fornecimento':         'FORN',
      'Consultoria':          'CONS',
      'Locação':              'LOC'
    }[t] || t.slice(0, 4).toUpperCase();
  }

  function origemLabel(origem) {
    return {
      'manual':     'Manual',
      'migracao':   'Migração legada',
      'integracao': 'Integração'
    }[origem] || origem;
  }

  /**
   * Gera aditivos mock baseado nos dados do contrato.
   * Em produção viria do backend (entidade AditivoContratual).
   * Aqui distribuímos o delta valorAtual-valorOriginal entre N aditivos.
   */
  function buildAditivosMock(c) {
    if (c.aditivos === 0) return [];
    const delta = c.valorAtual - c.valorOriginal;
    const items = [];
    const year = c.num.split('/')[1];
    const numSeq = c.num.split('/')[0];

    // Heurística: se há delta financeiro, distribui entre aditivos
    // Caso contrário, mistura tipos (prazo/escopo)
    const hasFinancial = Math.abs(delta) > 0.01;

    for (let i = 0; i < c.aditivos; i++) {
      const adId = `AD ${String(i+1).padStart(2,'0')}-${numSeq}/${year}`;
      let tipo, valor, resumo;

      if (hasFinancial && i === 0) {
        tipo   = 'Valor';
        valor  = delta;
        resumo = delta > 0
          ? 'Reequilíbrio econômico-financeiro · acréscimo de escopo'
          : 'Supressão parcial de objeto contratado';
      } else if (i === c.aditivos - 1 && c.aditivos > 1) {
        tipo   = 'Prazo';
        valor  = 0;
        resumo = 'Prorrogação de vigência conforme cláusula 4ª';
      } else {
        tipo   = i % 2 === 0 ? 'Escopo' : 'Reajuste';
        valor  = 0;
        resumo = tipo === 'Escopo'
          ? 'Ajuste técnico de escopo sem impacto financeiro'
          : 'Reajuste contratual conforme índice IPCA acumulado';
      }
      items.push({ adId, tipo, valor, resumo, status: 'homologado' });
    }
    return items;
  }

  function buildDrawerBody(c) {
    // ─── Cálculos derivados (RN-06) ────────────────────────
    const delta       = c.valorAtual - c.valorOriginal;
    const hasAditivos = c.aditivos > 0;
    const hasDelta    = Math.abs(delta) > 0.01;

    // ─── Aditivos mock ─────────────────────────────────────
    const aditivos = buildAditivosMock(c);

    // ─── Vigência (RN-07: derivada de aditivos de prazo) ────
    // Pro prototype, vigência atual == vigência original (sem aditivo de prazo no mock)
    const vig = vigenciaInfo(c.diasFim, c.status);

    // ─── Status label ──────────────────────────────────────
    const statusLbl = {
      'rascunho':'Rascunho','em-andamento':'Em andamento','a-vencer':'A vencer',
      'vencido':'Vencido','encerrado':'Encerrado','suspenso':'Suspenso','cancelado':'Cancelado'
    }[c.status] || c.status;

    return `
      <div class="dw-section">
        <div class="section-lbl">Contratado</div>
        <div class="dw-contratado-card">
          <div class="forn ${c.contratado.kind === 'PF' ? 'is-pf' : ''}">
            <span class="av">${c.contratado.av}</span>
            <div class="info">
              <span class="nm">${c.contratado.name}</span>
              <span class="doc">${c.contratado.doc}</span>
            </div>
          </div>
          <span class="contratado-kind">${c.contratado.kind === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</span>
        </div>
        <div class="dw-fields">
          <div class="dw-field">
            <span class="k">Status</span>
            <span class="v"><span class="status ${c.status}">${statusLbl}</span></span>
          </div>
          <div class="dw-field">
            <span class="k">Tipo</span>
            <span class="v">${c.tipo}</span>
          </div>
        </div>
      </div>

      <div class="dw-section">
        <div class="section-lbl">Composição do Valor</div>
        <div class="dw-comp">
          <div class="dw-comp-row">
            <span class="label">Valor Original</span>
            <span class="value">${fmtBRL(c.valorOriginal)}</span>
          </div>
          ${hasDelta ? `
            <div class="dw-comp-row is-retencao" style="color: ${delta > 0 ? 'var(--green-deep)' : 'var(--red-deep)'}">
              <span class="label">${delta > 0 ? '+' : '−'} Aditivos (${c.aditivos} homologado${c.aditivos === 1 ? '' : 's'})</span>
              <span class="value" style="color: ${delta > 0 ? 'var(--green-deep)' : 'var(--red-deep)'}">${delta > 0 ? '+' : ''}${fmtBRL(delta)}</span>
            </div>
          ` : ''}
          <div class="dw-comp-row is-total">
            <span class="label">Valor Atual</span>
            <span class="value">${fmtBRL(c.valorAtual)}</span>
          </div>
        </div>
      </div>

      <div class="dw-section">
        <div class="section-lbl">Vigência</div>
        <div class="dw-fields">
          <div class="dw-field">
            <span class="k">Início</span>
            <span class="v mono">${c.dataInicio}</span>
          </div>
          <div class="dw-field">
            <span class="k">Fim ${hasAditivos ? '(original)' : ''}</span>
            <span class="v mono">${c.dataFim}${vig.sub ? ` <span style="color: var(--ink-5); font-size: 10px; font-weight: 500; margin-left: 4px;">${vig.sub}</span>` : ''}</span>
          </div>
        </div>
      </div>

      <div class="dw-section">
        <div class="section-lbl">Aditivos <span class="count">(${c.aditivos})</span></div>
        ${aditivos.length === 0 ? `
          <div class="empty-aditivos">Contrato sem aditivos · valor e vigência preservados do cadastro original</div>
        ` : aditivos.map(a => `
          <div class="dw-titulo-card">
            <div class="head">
              <div class="left">
                <div class="kind">${a.adId}</div>
                <div class="nm">Aditivo de ${a.tipo}</div>
                <div class="venc">${a.resumo}</div>
              </div>
              <div class="right">
                ${a.valor !== 0 ? `<div class="amt">${a.valor > 0 ? '+' : ''}${fmtBRL(a.valor)}</div>` : '<div class="amt" style="color: var(--ink-5); font-size: 10px;">sem impacto</div>'}
                <span class="status em-andamento">Homologado</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="dw-section">
        <div class="section-lbl">Plano Orçamentário</div>
        <div class="dw-plano-card">
          <div class="plano-head">
            <div class="plano-title">${c.programa || '—'}</div>
            <div class="contrato-chip">
              <span class="ct-lbl">${c.centroResp}</span>
            </div>
          </div>
          <div class="plano-line"><span class="pk">Tipo</span><span class="pv">${c.tipo}</span></div>
          <div class="plano-line"><span class="pk">Centro de Resp.</span><span class="pv">${c.centroResp}</span></div>
          <div class="plano-line"><span class="pk">Origem</span><span class="pv">${origemLabel(c.origemCadastro)}</span></div>
        </div>
      </div>

      <div class="dw-section">
        <div class="section-lbl">Objeto</div>
        <div class="dw-description">${c.objeto}</div>
      </div>
    `;
  }


  /* ── Drawer event handlers ────────────────────────────────── */
  $('#drawer-close').addEventListener('click', closeDrawer);
  $('#drawer-close-2').addEventListener('click', closeDrawer);
  $('#drawer-edit').addEventListener('click', () => {
    closeDrawer();
    toast('Abriria a tela do contrato para edição (cadastro de aditivo, alteração de dados)');
  });
  // ESC fecha
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#drawer').classList.contains('open')) {
      closeDrawer();
    }
  });

  /* ─── Filter state ─────────────────────────────────────── */
  const filterState = {
    status:   'todos',
    sort:     'fim-asc',
    search:   '',
    advanced: {}   // { dimId: value, … }
  };

  function parseDate(s) {
    if (!s) return null;
    // accept "dd/mm/yyyy" or "yyyy-mm-dd"
    if (s.includes('-')) { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); }
    const [d,m,y] = s.split('/').map(Number);
    return new Date(y, m-1, d);
  }
  const fmtBR = (n) => 'R$ ' + Number(n).toLocaleString('pt-BR');
  const truncate = (s, n) => s.length > n ? s.slice(0, n-1) + '…' : s;

  /* ─── FILTER_DIMS: 12 dimensões disponíveis pra contratos ───── */
  const uniq = (arr) => Array.from(new Set(arr)).filter(Boolean).sort();
  const contratadoOpts = () => Array.from(new Map(CONTRATOS.map(c => [c.contratado.doc, {value: c.contratado.doc, label: c.contratado.name, sub: c.contratado.doc, kind: c.contratado.kind}])).values());
  const programaOpts   = () => uniq(CONTRATOS.map(c => c.programa)).map(p => ({value: p, label: p}));
  const centroRespOpts = () => uniq(CONTRATOS.map(c => c.centroResp)).map(p => ({value: p, label: p}));
  const tipoOpts       = () => uniq(CONTRATOS.map(c => c.tipo)).map(t => ({value: t, label: t}));
  const origemOpts     = () => [
    {value: 'manual',     label: 'Manual'},
    {value: 'migracao',   label: 'Migração legada'},
    {value: 'integracao', label: 'Integração'}
  ];

  const FILTER_DIMS = {
    numContrato: {
      label: 'Nº Contrato', type: 'text', placeholder: 'ex.: 0001/2026',
      chip: v => v,
      match: (c, v) => c.num.toLowerCase().includes(v.toLowerCase())
    },
    cnpjCpf: {
      label: 'CNPJ/CPF', type: 'text', placeholder: 'ex.: 37.364.305',
      chip: v => v,
      match: (c, v) => c.contratado.doc.replace(/\D/g, '').includes(v.replace(/\D/g, ''))
    },
    contratado: {
      label: 'Contratado', type: 'multi-search', getOptions: contratadoOpts,
      chip: v => v.length === 1 ? truncate(v[0].label, 22) : `${truncate(v[0].label, 14)} +${v.length-1}`,
      match: (c, v) => v.some(o => o.value === c.contratado.doc)
    },
    objeto: {
      label: 'Objeto', type: 'text', placeholder: 'ex.: consultoria...',
      chip: v => `contém "${truncate(v, 18)}"`,
      match: (c, v) => (c.objeto || '').toLowerCase().includes(v.toLowerCase())
    },
    tipo: {
      label: 'Tipo de Contrato', type: 'multi', getOptions: tipoOpts,
      chip: v => v.length === 1 ? v[0].label : `${v[0].label} +${v.length-1}`,
      match: (c, v) => v.some(o => o.value === c.tipo)
    },
    programa: {
      label: 'Programa', type: 'multi', getOptions: programaOpts,
      chip: v => v.length === 1 ? truncate(v[0].label, 22) : `${truncate(v[0].label, 14)} +${v.length-1}`,
      match: (c, v) => v.some(o => o.value === c.programa)
    },
    centroResp: {
      label: 'Centro de Responsabilidade', type: 'multi', getOptions: centroRespOpts,
      chip: v => v.length === 1 ? v[0].label : `${v[0].label} +${v.length-1}`,
      match: (c, v) => v.some(o => o.value === c.centroResp)
    },
    valorAtual: {
      label: 'Valor Atual', type: 'number-range',
      chip: v => {
        if (v.min != null && v.max != null) return `${fmtBR(v.min)} → ${fmtBR(v.max)}`;
        if (v.min != null) return `≥ ${fmtBR(v.min)}`;
        if (v.max != null) return `≤ ${fmtBR(v.max)}`;
        return 'qualquer';
      },
      match: (c, v) => (v.min == null || c.valorAtual >= v.min) && (v.max == null || c.valorAtual <= v.max)
    },
    dataInicio: {
      label: 'Início', type: 'date-range',
      chip: v => `${v.from || '...'} → ${v.to || '...'}`,
      match: (c, v) => {
        const dt = parseDate(c.dataInicio);
        return (!v.from || dt >= parseDate(v.from)) && (!v.to || dt <= parseDate(v.to));
      }
    },
    dataFim: {
      label: 'Vigência (Fim)', type: 'date-range',
      chip: v => `${v.from || '...'} → ${v.to || '...'}`,
      match: (c, v) => {
        const dt = parseDate(c.dataFim);
        return (!v.from || dt >= parseDate(v.from)) && (!v.to || dt <= parseDate(v.to));
      }
    },
    aditivos: {
      label: 'Aditivos', type: 'multi',
      getOptions: () => [
        {value: 'sem',  label: 'Sem aditivos'},
        {value: 'com',  label: 'Com aditivos'}
      ],
      chip: v => v.length === 1 ? v[0].label : `${v.length} opções`,
      match: (c, v) => v.some(o => (o.value === 'sem' ? c.aditivos === 0 : c.aditivos > 0))
    },
    origem: {
      label: 'Origem do Cadastro', type: 'multi', getOptions: origemOpts,
      chip: v => v.length === 1 ? v[0].label : `${v[0].label} +${v.length-1}`,
      match: (c, v) => v.some(o => o.value === c.origemCadastro)
    }
  };

  /* ─── applyFilters: pipeline completo ───────────────────── */
  function applyFilters() {
    let result = CONTRATOS.slice();

    // Status chip
    if (filterState.status !== 'todos') result = result.filter(d => d.status === filterState.status);

    // Search
    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      result = result.filter(d =>
        d.contratado.name.toLowerCase().includes(q) ||
        d.contratado.doc.toLowerCase().includes(q) ||
        d.num.toLowerCase().includes(q) ||
        (d.objeto || '').toLowerCase().includes(q)
      );
    }

    // Advanced filters (loop por dim ativa)
    Object.entries(filterState.advanced).forEach(([dimId, value]) => {
      const dim = FILTER_DIMS[dimId];
      if (!dim || isEmpty(value)) return;
      result = result.filter(d => dim.match(d, value));
    });

    // Sort
    const [key, dir] = filterState.sort.split('-');
    const mult = dir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      let va, vb;
      if      (key === 'fim')        { va = parseDate(a.dataFim); vb = parseDate(b.dataFim); }
      else if (key === 'valor')      { va = a.valorAtual;          vb = b.valorAtual; }
      else if (key === 'contratado') { va = a.contratado.name;     vb = b.contratado.name; }
      else if (key === 'num')        { va = a.num;                 vb = b.num; }
      if (va < vb) return -1 * mult;
      if (va > vb) return  1 * mult;
      return 0;
    });

    render(result);
    updateBottomCount(result.length);
    updateTotals(result);
    renderChips();
  }

  function isEmpty(v) {
    if (v == null) return true;
    if (typeof v === 'string') return !v;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') {
      // ranges {min,max} ou {from,to}
      return Object.values(v).every(x => x == null || x === '');
    }
    return false;
  }

  function updateBottomCount(filteredCount) {
    const total = CONTRATOS.length;
    const range = filteredCount === total ? `1–${total} de ${total}` : `${filteredCount} de ${total}`;
    $('#pag-range').textContent = range;
    $('#topbar-count').textContent = `${filteredCount} contrato${filteredCount === 1 ? '' : 's'}`;
  }

  function updateTotals(filteredContratos) {
    const foot = $('#grid-foot');
    if (!filteredContratos.length) {
      foot.classList.add('is-hidden');
      return;
    }
    foot.classList.remove('is-hidden');
    const sumValor = filteredContratos.reduce((acc, c) => acc + (c.valorAtual || 0), 0);
    $('#ft-count').textContent = filteredContratos.length;
    $('#ft-valor').textContent = fmtBRL(sumValor);
  }

  function recomputeChipCounts() {
    const counters = {
      'todos':     CONTRATOS.length,
      'rascunho':     CONTRATOS.filter(d => d.status === 'rascunho').length,
      'em-andamento': CONTRATOS.filter(d => d.status === 'em-andamento').length,
      'a-vencer':     CONTRATOS.filter(d => d.status === 'a-vencer').length,
      'encerrado':    CONTRATOS.filter(d => d.status === 'encerrado').length
    };
    Object.entries(counters).forEach(([k, v]) => {
      const el = $(`#cnt-${k}`);
      if (el) el.textContent = v;
    });
  }

  /* ─── Chip row render ───────────────────────────────────── */
  function renderChips() {
    const row = $('#chips-row');
    const active = Object.entries(filterState.advanced).filter(([, v]) => !isEmpty(v));
    document.querySelector('.app').classList.toggle('has-advanced-filters', active.length > 0);
    if (!active.length) { row.innerHTML = ''; return; }
    row.innerHTML = active.map(([dimId, value]) => {
      const dim = FILTER_DIMS[dimId];
      return `<button class="f-chip" data-dim="${dimId}">
        <span class="lbl">${dim.label}</span>
        <span class="val">${dim.chip(value)}</span>
        <span class="x" data-remove="${dimId}" title="Remover filtro">×</span>
      </button>`;
    }).join('');

    $$('#chips-row .f-chip').forEach(chip => {
      chip.addEventListener('click', e => {
        if (e.target.closest('[data-remove]')) return;
        openPicker(chip.dataset.dim, chip);
      });
      chip.querySelector('[data-remove]').addEventListener('click', e => {
        e.stopPropagation();
        delete filterState.advanced[chip.dataset.dim];
        applyFilters();
      });
    });
  }

  $('#clear-all-filters').addEventListener('click', () => {
    filterState.advanced = {};
    applyFilters();
    closeAllMenus();
  });

  /* ─── + Filtro menu ─────────────────────────────────────── */
  // Metadados por tipo de filtro (ícone + label curta)
  const TYPE_META = {
    'text':         { icon: 'pencil',   kind: 'texto' },
    'date-range':   { icon: 'calendar', kind: 'período' },
    'number-range': { icon: 'currency', kind: 'valor' },
    'multi':        { icon: 'list',     kind: 'lista' },
    'multi-search': { icon: 'search',   kind: 'busca' }
  };

  function renderAddFilterMenu() {
    const menu = $('#menu-add-filter');
    const groups = [
      { label: 'Identificação', dims: ['numContrato', 'cnpjCpf'] },
      { label: 'Contratado',    dims: ['contratado', 'objeto'] },
      { label: 'Classificação', dims: ['tipo', 'programa', 'centroResp'] },
      { label: 'Valor',         dims: ['valorAtual'] },
      { label: 'Vigência',      dims: ['dataInicio', 'dataFim'] },
      { label: 'Outros',        dims: ['aditivos', 'origem'] }
    ];
    menu.innerHTML = groups.map(g => `
      <div class="label-group">${g.label}</div>
      ${g.dims.map(id => {
        const dim = FILTER_DIMS[id];
        const meta = TYPE_META[dim.type] || { icon: 'list', kind: '' };
        const used = filterState.advanced.hasOwnProperty(id);
        const rightSide = used
          ? '<span class="badge">aplicado</span>'
          : `<span class="kind">${meta.kind}</span>`;
        return `<button class="item ${used ? 'is-used' : ''}" data-add="${id}" ${used ? 'disabled' : ''}>
          <span class="ic"><svg><use href="#i-${meta.icon}"/></svg></span>
          <span class="lbl">${dim.label}</span>
          ${rightSide}
        </button>`;
      }).join('')}
    `).join('');

    $$('#menu-add-filter .item:not(.is-used)').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        const dimId = item.dataset.add;
        // adiciona placeholder vazio + abre picker
        filterState.advanced[dimId] = initialValue(FILTER_DIMS[dimId]);
        closeAllMenus();
        // small timeout pra menu fechar antes do picker abrir
        setTimeout(() => openPicker(dimId, $('#btn-add-filter')), 50);
        renderChips();
      });
    });
  }

  function initialValue(dim) {
    switch (dim.type) {
      case 'text':         return '';
      case 'date-range':   return { from: '', to: '' };
      case 'number-range': return { min: null, max: null };
      case 'multi':
      case 'multi-search': return [];
      default: return null;
    }
  }

  $('#btn-add-filter').addEventListener('click', e => {
    e.stopPropagation();
    const menu = $('#menu-add-filter');
    const btn = $('#btn-add-filter');
    const wasOpen = menu.classList.contains('open');
    closeAllMenus();
    if (!wasOpen) {
      renderAddFilterMenu();
      menu.classList.add('open');
      btn.classList.add('is-open');
    }
  });

  /* ─── Picker (floating, generic) ────────────────────────── */
  let currentPicker = null;
  let pendingValue  = null;
  let pendingDimId  = null;

  function openPicker(dimId, anchorEl) {
    const dim = FILTER_DIMS[dimId];
    if (!dim) return;
    closePicker();

    pendingDimId  = dimId;
    pendingValue  = JSON.parse(JSON.stringify(filterState.advanced[dimId] ?? initialValue(dim)));

    const picker = document.createElement('div');
    picker.className = `picker is-${dim.type}`;
    picker.innerHTML = `
      <div class="picker-head">${dim.label}</div>
      <div class="picker-body">${buildPickerBody(dim)}</div>
      <div class="picker-foot">
        <span class="meta" id="picker-meta"></span>
        <button class="picker-clear">Limpar</button>
        <button class="picker-cancel">Cancelar</button>
        <button class="picker-apply">Aplicar</button>
      </div>`;
    document.body.appendChild(picker);
    currentPicker = picker;
    positionPicker(picker, anchorEl);
    requestAnimationFrame(() => picker.classList.add('open'));

    bindPickerHandlers(picker, dim);
  }

  function positionPicker(picker, anchor) {
    const r = anchor.getBoundingClientRect();
    picker.style.left = Math.max(12, r.left) + 'px';
    picker.style.top  = (r.bottom + 6) + 'px';
    // overflow correction
    requestAnimationFrame(() => {
      const pr = picker.getBoundingClientRect();
      if (pr.right > window.innerWidth - 12) {
        picker.style.left = (window.innerWidth - pr.width - 12) + 'px';
      }
    });
  }

  function closePicker() {
    if (currentPicker) currentPicker.remove();
    currentPicker = null;
    pendingValue  = null;
    pendingDimId  = null;
  }

  function buildPickerBody(dim) {
    const v = pendingValue;
    if (dim.type === 'text') {
      return `<div class="picker-text">
        <input type="text" id="picker-input" value="${v || ''}" placeholder="${dim.placeholder || ''}" autofocus />
        <div class="hint">Filtra por conteúdo parcial.</div>
      </div>`;
    }
    if (dim.type === 'date-range') {
      const presets = [
        { id: 'today',    label: 'Hoje' },
        { id: 'week',     label: 'Esta semana' },
        { id: 'next7',    label: 'Próximos 7 dias' },
        { id: 'next30',   label: 'Próximos 30 dias' },
        { id: 'thismonth',label: 'Mês atual' },
        { id: 'lastmonth',label: 'Mês passado' }
      ];
      return `<div class="picker-daterange">
        <div class="presets">
          ${presets.map(p => `<button class="preset" data-preset="${p.id}">${p.label}</button>`).join('')}
        </div>
        <div class="range-inputs">
          <div class="col">
            <label>De</label>
            <input type="text" id="dt-from" value="${v.from || ''}" placeholder="DD/MM/AAAA" />
          </div>
          <div class="col">
            <label>Até</label>
            <input type="text" id="dt-to" value="${v.to || ''}" placeholder="DD/MM/AAAA" />
          </div>
        </div>
      </div>`;
    }
    if (dim.type === 'number-range') {
      return `<div class="picker-numrange">
        <div class="col">
          <label>De (mín.)</label>
          <input type="number" id="num-min" value="${v.min ?? ''}" placeholder="0,00" step="0.01" />
        </div>
        <div class="col">
          <label>Até (máx.)</label>
          <input type="number" id="num-max" value="${v.max ?? ''}" placeholder="∞" step="0.01" />
        </div>
      </div>`;
    }
    if (dim.type === 'multi' || dim.type === 'multi-search') {
      const options = dim.getOptions();
      const selectedSet = new Set((v || []).map(o => o.value));
      const isSearch = dim.type === 'multi-search';
      return `<div class="picker-multi">
        ${isSearch ? `<div class="search-box">
          <span class="s-ic"><svg><use href="#i-search"/></svg></span>
          <input type="text" id="picker-search" placeholder="Buscar..." />
        </div>` : ''}
        <div class="options" id="picker-options" data-options='${JSON.stringify(options).replace(/'/g, '&apos;')}'>
          ${options.map(o => `
            <button class="opt ${selectedSet.has(o.value) ? 'checked' : ''}" data-value="${o.value}">
              <span class="cb-mini"><svg><use href="#i-check"/></svg></span>
              <span class="opt-label">${o.label}</span>
              ${o.sub ? `<span class="opt-sub">${o.sub}</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>`;
    }
    return '<div>Tipo de picker desconhecido</div>';
  }

  function bindPickerHandlers(picker, dim) {
    const meta = picker.querySelector('#picker-meta');
    const updateMeta = () => {
      if (dim.type === 'multi' || dim.type === 'multi-search') {
        meta.textContent = (pendingValue || []).length + ' selecionados';
      } else {
        meta.textContent = '';
      }
    };
    updateMeta();

    if (dim.type === 'text') {
      const input = picker.querySelector('#picker-input');
      input.addEventListener('input', () => { pendingValue = input.value; });
      input.focus();
      input.select();
    }
    if (dim.type === 'date-range') {
      const fromEl = picker.querySelector('#dt-from');
      const toEl   = picker.querySelector('#dt-to');
      fromEl.addEventListener('input', () => { pendingValue.from = fromEl.value; });
      toEl.addEventListener('input',   () => { pendingValue.to   = toEl.value;   });
      picker.querySelectorAll('.preset').forEach(p => {
        p.addEventListener('click', () => {
          const range = computePreset(p.dataset.preset);
          pendingValue.from = range.from;
          pendingValue.to   = range.to;
          fromEl.value = range.from;
          toEl.value   = range.to;
          picker.querySelectorAll('.preset').forEach(pp => pp.classList.remove('active'));
          p.classList.add('active');
        });
      });
    }
    if (dim.type === 'number-range') {
      const minEl = picker.querySelector('#num-min');
      const maxEl = picker.querySelector('#num-max');
      minEl.addEventListener('input', () => { pendingValue.min = minEl.value === '' ? null : Number(minEl.value); });
      maxEl.addEventListener('input', () => { pendingValue.max = maxEl.value === '' ? null : Number(maxEl.value); });
    }
    if (dim.type === 'multi' || dim.type === 'multi-search') {
      const opts = picker.querySelectorAll('.opt');
      opts.forEach(opt => {
        opt.addEventListener('click', () => {
          const val = opt.dataset.value;
          const idx = (pendingValue || []).findIndex(o => o.value === val);
          if (idx >= 0) {
            pendingValue.splice(idx, 1);
            opt.classList.remove('checked');
          } else {
            const allOptions = dim.getOptions();
            const found = allOptions.find(o => o.value === val);
            if (found) pendingValue.push(found);
            opt.classList.add('checked');
          }
          updateMeta();
        });
      });
      if (dim.type === 'multi-search') {
        const sb = picker.querySelector('#picker-search');
        sb.addEventListener('input', () => {
          const q = sb.value.trim().toLowerCase();
          opts.forEach(opt => {
            const lbl = opt.querySelector('.opt-label').textContent.toLowerCase();
            const sub = (opt.querySelector('.opt-sub')?.textContent || '').toLowerCase();
            opt.style.display = (!q || lbl.includes(q) || sub.includes(q)) ? '' : 'none';
          });
        });
        sb.focus();
      }
    }

    picker.querySelector('.picker-apply').addEventListener('click', () => {
      filterState.advanced[pendingDimId] = pendingValue;
      closePicker();
      applyFilters();
    });
    picker.querySelector('.picker-cancel').addEventListener('click', () => {
      // se foi adicionado vazio (nunca aplicado), remove
      if (isEmpty(filterState.advanced[pendingDimId])) delete filterState.advanced[pendingDimId];
      closePicker();
      renderChips();
    });
    picker.querySelector('.picker-clear').addEventListener('click', () => {
      delete filterState.advanced[pendingDimId];
      closePicker();
      applyFilters();
    });
  }

  function computePreset(id) {
    const today = new Date(2026, 4, 19); // mock "hoje" alinhado aos dados (19/05/2026)
    const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    let from, to;
    switch (id) {
      case 'today':     from = to = fmt(today); break;
      case 'week': {
        const dow = today.getDay() || 7;
        const start = new Date(today); start.setDate(today.getDate() - (dow - 1));
        const end   = new Date(start); end.setDate(start.getDate() + 6);
        from = fmt(start); to = fmt(end); break;
      }
      case 'next7': {
        const end = new Date(today); end.setDate(today.getDate() + 7);
        from = fmt(today); to = fmt(end); break;
      }
      case 'next30': {
        const end = new Date(today); end.setDate(today.getDate() + 30);
        from = fmt(today); to = fmt(end); break;
      }
      case 'thismonth': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        from = fmt(start); to = fmt(end); break;
      }
      case 'lastmonth': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end   = new Date(today.getFullYear(), today.getMonth(), 0);
        from = fmt(start); to = fmt(end); break;
      }
      case 'thisyear': {
        const start = new Date(today.getFullYear(), 0, 1);
        const end   = new Date(today.getFullYear(), 11, 31);
        from = fmt(start); to = fmt(end); break;
      }
    }
    return { from, to };
  }

  /* ─── Visões (saved views) ──────────────────────────────── */
  const VIEWS_STORAGE_KEY = 'bemcomum.grid.savedViews';

  // Visões sugeridas (hardcoded, não-deletáveis — servem como exemplos)
  const SUGGESTED_VIEWS = [
    {
      id: 'sug:vencendo-30',
      name: 'Vencendo em 30 dias',
      state: () => ({
        status: 'todos',
        sort: 'fim-asc',
        advanced: { dataFim: computePreset('next30') }
      })
    },
    {
      id: 'sug:em-andamento-grande',
      name: 'Em andamento > R$ 100k',
      state: () => ({
        status: 'em-andamento',
        sort: 'valor-desc',
        advanced: { valorAtual: { min: 100000, max: null } }
      })
    },
    {
      id: 'sug:rascunhos',
      name: 'Rascunhos',
      state: () => ({
        status: 'rascunho',
        sort: 'num-desc',
        advanced: {}
      })
    },
    {
      id: 'sug:encerrados-ano',
      name: 'Encerrados este ano',
      state: () => ({
        status: 'encerrado',
        sort: 'fim-desc',
        advanced: { dataFim: computePreset('thisyear') }
      })
    }
  ];

  function loadSavedViews() {
    try { return JSON.parse(localStorage.getItem(VIEWS_STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function persistSavedViews(views) {
    localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(views));
  }

  function saveCurrentView(name) {
    const views = loadSavedViews();
    const newView = {
      id: 'usr:' + Date.now(),
      name: name.trim(),
      state: {
        status: filterState.status,
        sort: filterState.sort,
        advanced: JSON.parse(JSON.stringify(filterState.advanced))
      },
      filterCount: Object.keys(filterState.advanced).filter(k => !isEmpty(filterState.advanced[k])).length
    };
    views.unshift(newView);
    persistSavedViews(views);
    return newView;
  }

  function deleteView(id) {
    const views = loadSavedViews().filter(v => v.id !== id);
    persistSavedViews(views);
  }

  function applyViewState(state) {
    filterState.status = state.status;
    filterState.sort   = state.sort;
    filterState.advanced = JSON.parse(JSON.stringify(state.advanced || {}));

    // Refletir no chip de status
    $$('#status-chips .chip').forEach(c =>
      c.classList.toggle('active', c.dataset.status === state.status)
    );
    // Refletir no sort dropdown
    const sortBtn = $('#flt-sort');
    const sortVal = sortBtn.querySelector('.flt-val');
    if (sortVal && SORT_LABELS[state.sort]) {
      sortVal.textContent = SORT_LABELS[state.sort];
      sortBtn.classList.toggle('has-value', state.sort !== 'fim-asc');
    }
    // Refletir no header (seta de sort)
    const [k, dir] = (state.sort || 'fim-asc').split('-');
    $$('.grid-head .h').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
    const headMap = { num: 0, contratado: 1, valor: 5, fim: 7 };
    const idx = headMap[k];
    if (idx !== undefined) {
      const target = $$('.grid-head .h')[idx];
      if (target) target.classList.add(dir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
    // Refletir nas opções do sort menu
    $$('#menu-sort .item').forEach(i =>
      i.classList.toggle('is-active', i.dataset.sort === state.sort)
    );

    applyFilters();
  }

  function autoSuggestName() {
    const active = Object.entries(filterState.advanced).filter(([, v]) => !isEmpty(v));
    const parts = [];
    if (filterState.status !== 'todos') {
      const statusLbl = {
        'rascunho':'Rascunho','em-andamento':'Em andamento','a-vencer':'A vencer','encerrado':'Encerrado'
      }[filterState.status] || filterState.status;
      parts.push(statusLbl);
    }
    if (active.length === 1) {
      parts.push(FILTER_DIMS[active[0][0]].label);
    } else if (active.length > 1) {
      parts.push(`${active.length} filtros`);
    }
    return parts.join(' · ') || 'Nova visão';
  }

  function renderVisoesMenu() {
    const menu = $('#menu-visoes');
    const saved = loadSavedViews();

    let html = `<div class="label-group">Sugeridas</div>`;
    html += SUGGESTED_VIEWS.map(v => `
      <button class="view-item" data-view-id="${v.id}">
        <span class="ic">★</span>
        <span class="lbl">${v.name}</span>
      </button>
    `).join('');

    html += `<div class="label-group">Minhas Visões</div>`;
    if (saved.length === 0) {
      html += `<div class="empty-views">Salve combinações de filtros que você usa com frequência.</div>`;
    } else {
      html += saved.map(v => `
        <button class="view-item is-user" data-view-id="${v.id}">
          <span class="ic">${v.filterCount || 0}</span>
          <span class="lbl">${escapeHtml(v.name)}</span>
          <span class="del-view" data-delete-id="${v.id}" title="Excluir visão">×</span>
        </button>
      `).join('');
    }

    html += `
      <div class="save-section">
        <button class="view-item save-trigger" id="save-trigger">
          <span class="ic">+</span>
          <span class="lbl">Salvar visão atual</span>
        </button>
      </div>
    `;

    menu.innerHTML = html;
    bindVisoesMenuHandlers();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function bindVisoesMenuHandlers() {
    // Click numa visão = aplica
    $$('#menu-visoes .view-item:not(.save-trigger)').forEach(item => {
      item.addEventListener('click', e => {
        if (e.target.closest('.del-view')) return; // delete button handled separately
        e.stopPropagation();
        const id = item.dataset.viewId;
        const suggested = SUGGESTED_VIEWS.find(v => v.id === id);
        const userView  = loadSavedViews().find(v => v.id === id);

        if (suggested?.direct) {
          // Caso especial — recusados
          filterState.advanced = {};
          filterState.search = '';
          $$('#status-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.status === 'todos'));
          filterState.status = 'todos';
          const filtered = suggested.direct();
          render(filtered);
          updateBottomCount(filtered.length);
          updateTotals(filtered);
          renderChips();
          document.querySelector('.app').classList.toggle('has-advanced-filters', false);
          closeAllMenus();
          return;
        }
        if (suggested) {
          applyViewState(suggested.state());
        } else if (userView) {
          applyViewState(userView.state);
        }
        closeAllMenus();
      });
    });

    // Delete handler
    $$('#menu-visoes .del-view').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        const view = loadSavedViews().find(v => v.id === id);
        deleteView(id);
        renderVisoesMenu();
        toast(`Visão "${view?.name || ''}" excluída`);
      });
    });

    // Save trigger — transforma em input
    $('#save-trigger')?.addEventListener('click', e => {
      e.stopPropagation();
      const trigger = $('#save-trigger');
      const section = trigger.parentElement;
      const suggested = autoSuggestName();
      section.innerHTML = `
        <div class="save-input-row">
          <input type="text" id="view-name-input" placeholder="Nome da visão..." value="${escapeHtml(suggested)}" maxlength="60" />
          <button class="save-cancel" id="save-cancel" title="Cancelar">×</button>
          <button class="save-confirm" id="save-confirm">Salvar</button>
        </div>
      `;
      const input = $('#view-name-input');
      input.focus();
      input.select();

      const confirmSave = () => {
        const name = input.value.trim();
        if (!name) return;
        const created = saveCurrentView(name);
        renderVisoesMenu();
        toast(`Visão "${created.name}" salva`);
      };
      const cancelSave = () => { renderVisoesMenu(); };

      $('#save-confirm').addEventListener('click', e => { e.stopPropagation(); confirmSave(); });
      $('#save-cancel').addEventListener('click', e => { e.stopPropagation(); cancelSave(); });
      input.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter')  { e.preventDefault(); confirmSave(); }
        if (e.key === 'Escape') { e.preventDefault(); cancelSave(); }
      });
      input.addEventListener('input', () => {
        $('#save-confirm').disabled = !input.value.trim();
      });
    });
  }

  $('#btn-visoes').addEventListener('click', e => {
    e.stopPropagation();
    const menu = $('#menu-visoes');
    const btn = $('#btn-visoes');
    const wasOpen = menu.classList.contains('open');
    closeAllMenus();
    if (!wasOpen) {
      renderVisoesMenu();
      menu.classList.add('open');
      btn.classList.add('is-open');
    }
  });

  /* ─── Status chip filter ────────────────────────────────── */
  $$('#status-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('#status-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterState.status = chip.dataset.status;
      applyFilters();
    });
  });

  /* ─── Sort dropdown ─────────────────────────────────────── */
  function closeAllMenus() {
    $$('.flt-menu.open, .add-filter-menu.open, .visoes-menu.open, .bottombar-menu.open').forEach(m => m.classList.remove('open'));
    $$('.flt.is-open, .btn.is-open').forEach(b => b.classList.remove('is-open'));
    if (currentPicker) closePicker();
  }

  function bindFilterDropdown(btnId, menuId, onSelect) {
    const btn = $('#' + btnId);
    const menu = $('#' + menuId);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const wasOpen = menu.classList.contains('open');
      closeAllMenus();
      if (!wasOpen) { menu.classList.add('open'); btn.classList.add('is-open'); }
    });
    $$('.item', menu).forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        $$('.item', menu).forEach(i => i.classList.remove('is-active'));
        item.classList.add('is-active');
        onSelect(item.dataset.val || item.dataset.sort, item.textContent.trim(), btn);
        closeAllMenus();
      });
    });
  }

  const SORT_LABELS = {
    'fim-asc':         'Vigência ↑',
    'fim-desc':        'Vigência ↓',
    'valor-desc':      'Valor ↓',
    'valor-asc':       'Valor ↑',
    'contratado-asc':  'Contratado A-Z',
    'contratado-desc': 'Contratado Z-A',
    'num-asc':         'Número ↑',
    'num-desc':        'Número ↓'
  };
  bindFilterDropdown('flt-sort', 'menu-sort', (val, label, btn) => {
    filterState.sort = val;
    btn.querySelector('.flt-val').textContent = SORT_LABELS[val] || label;
    btn.classList.toggle('has-value', val !== 'fim-asc');
    const [k, dir] = val.split('-');
    $$('.grid-head .h').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
    // Head index: 0=Núm, 1=Contratado, 2=Objeto, 3=Tipo, 4=Programa, 5=ValorAtual, 6=Início, 7=Fim, 8=Aditivos, 9=Status
    const headMap = { num: 0, contratado: 1, valor: 5, fim: 7 };
    const idx = headMap[k];
    if (idx !== undefined) {
      const target = $$('.grid-head .h')[idx];
      if (target) target.classList.add(dir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
    applyFilters();
  });

  // Click fora fecha menus / pickers
  document.addEventListener('click', e => {
    if (e.target.closest('.flt-wrap')) return;
    if (e.target.closest('.picker')) return;
    if (e.target.closest('.f-chip')) return;
    closeAllMenus();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllMenus();
  });

  /* ─── Search ───────────────────────────────────────────── */
  $('#search-input').addEventListener('input', e => {
    filterState.search = e.target.value.trim();
    applyFilters();
  });

  /* ─── Toast ────────────────────────────────────────────── */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* ─── Initial render ───────────────────────────────────── */
  recomputeChipCounts();
  applyFilters();
})();
