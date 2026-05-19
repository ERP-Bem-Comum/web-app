/* ═══════════════════════════════════════════════════════════
   Interactividade — herdada do v3, adaptada pro design v1
   ═══════════════════════════════════════════════════════════ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const fmt = n => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBR = n => 'R$ ' + fmt(n);
function parseBR(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d,-]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/* ─── 1. Live calc ───────────────────────────────────────── */
let lastLiquido = 7935;
function getRet(id) { return parseBR($('#' + id)?.value || '0'); }

function recompute(pulseField) {
  const bruto  = parseBR($('#input-bruto').value);
  const iss    = getRet('input-iss');
  const irrf   = getRet('input-irrf');
  const inss   = getRet('input-inss');
  const pis    = getRet('input-pis');
  const cofins = getRet('input-cofins');
  const csll   = getRet('input-csll');
  const ret = iss + irrf + inss + pis + cofins + csll;
  const liq = bruto - ret;

  const retMap = { iss, irrf, inss, pis, cofins, csll };
  $$('#composition .row[data-retencao]').forEach(row => {
    const k = row.dataset.retencao;
    const v = row.querySelector('.v');
    if (v && retMap[k] !== undefined) v.textContent = '- ' + fmtBR(retMap[k]);
  });
  $('#composition .row.bruto .v').textContent = fmtBR(bruto);

  animateNumber($('#sidebar-net'), lastLiquido, liq, 280, n => fmtBR(n));
  animateNumber($('#titulo-principal'), lastLiquido, liq, 280, n => fmtBR(n));
  lastLiquido = liq;

  const net = $('.net-block');
  net.classList.remove('pulse');
  void net.offsetWidth;
  net.classList.add('pulse');

  if (pulseField) {
    pulseField.classList.remove('flash');
    void pulseField.offsetWidth;
    pulseField.classList.add('flash');
  }
}

function animateNumber(el, from, to, duration, formatter) {
  if (!el) return;
  const start = performance.now();
  function step(t) {
    const p = Math.min(1, (t - start) / duration);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = formatter(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ─── 2. Input focus + auto-save ─────────────────────────── */
$$('.input').forEach(inp => {
  const innerInput = inp.querySelector('input');
  const isSelect = inp.classList.contains('is-select');

  inp.addEventListener('click', () => {
    if (isSelect) {
      inp.classList.add('focused');
    } else if (innerInput) {
      innerInput.focus();
    }
  });

  if (innerInput) {
    innerInput.addEventListener('focus', () => {
      if (document.body.classList.contains('sealed')) {
        innerInput.blur();
        inp.classList.add('shake');
        setTimeout(() => inp.classList.remove('shake'), 380);
        return;
      }
      inp.classList.add('focused');
    });
    innerInput.addEventListener('blur', () => inp.classList.remove('focused'));
    innerInput.addEventListener('input', () => {
      if (inp.dataset.retencao || innerInput.id === 'input-bruto') {
        recompute(inp);
      }
      bumpAutoSave();
    });
  }

  // Tooltip
  inp.addEventListener('mouseenter', () => {
    if (inp.classList.contains('ocr-ok') || inp.classList.contains('ocr-divergent')) {
      const tip = $('#tip');
      const r = inp.getBoundingClientRect();
      tip.textContent = inp.classList.contains('ocr-divergent')
        ? '⚠ Divergente do padrão · revise'
        : '📄 Origem: leitura do PDF';
      tip.style.left = (r.left + r.width / 2 - 80) + 'px';
      tip.style.top = (r.top - 32) + 'px';
      tip.classList.add('show');
    }
  });
  inp.addEventListener('mouseleave', () => $('#tip').classList.remove('show'));
});

/* ─── 3. Auto-save ───────────────────────────────────────── */
const saveStatus = $('#save-status');
let lastSavedAt = Date.now();
function bumpAutoSave() {
  saveStatus.textContent = 'Salvando…';
  clearTimeout(bumpAutoSave._t);
  bumpAutoSave._t = setTimeout(() => {
    lastSavedAt = Date.now();
    saveStatus.textContent = 'Auto-salvo · há um instante';
    showToast('Rascunho salvo');
  }, 600);
}
setInterval(() => {
  if (saveStatus.textContent.startsWith('Salvando')) return;
  const sec = Math.floor((Date.now() - lastSavedAt) / 1000);
  if (sec < 5) saveStatus.textContent = 'Auto-salvo · há um instante';
  else if (sec < 60) saveStatus.textContent = `Auto-salvo · há ${sec}s`;
  else saveStatus.textContent = `Auto-salvo · há ${Math.floor(sec/60)} min`;
}, 4000);

/* ─── 4. Toast ───────────────────────────────────────────── */
const toast = $('#toast');
const toastMsg = $('#toast-msg');
let toastTimer;
function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

/* ─── 5. Modais ──────────────────────────────────────────── */
function openModal(id) {
  const m = $('#' + id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const first = m.querySelector('input:not([disabled])');
    if (first) first.focus();
  }, 100);
}
function closeModal(m) {
  m.classList.remove('open');
  document.body.style.overflow = '';
}
$$('.modal-backdrop').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m); });
  m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(m)));
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const open = $('.modal-backdrop.open');
    if (open) closeModal(open);
    closeSelectMenu();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    $('#btn-approve').click();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    $('#btn-draft').click();
  }
});

/* Open modals from form */
$('#open-fornecedor-modal')?.addEventListener('click', e => { e.preventDefault(); openModal('modal-fornecedor'); });
$('#open-aprovador-modal')?.addEventListener('click', () => openModal('modal-aprovador'));
$('#open-forma')?.addEventListener('click', e => { e.stopPropagation(); openModal('modal-forma'); });
$('#btn-add-fornecedor')?.addEventListener('click', () => openModal('modal-novo-fornecedor'));
$('#open-novo-forn-from-search')?.addEventListener('click', () => {
  closeModal($('#modal-fornecedor'));
  setTimeout(() => openModal('modal-novo-fornecedor'), 200);
});

/* Double-click no divergente → modal */
document.addEventListener('dblclick', e => {
  const div = e.target.closest('.input.ocr-divergent');
  if (div) openModal('modal-divergencia');
});

/* ─── 6. Divergência: choices + confirm ──────────────────── */
$$('#modal-divergencia .choice').forEach(c => {
  c.addEventListener('click', () => {
    $$('#modal-divergencia .choice').forEach(o => o.classList.remove('selected'));
    c.classList.add('selected');
  });
});
$('#confirm-divergence')?.addEventListener('click', () => {
  const sel = $('#modal-divergencia .choice.selected')?.dataset.choice;
  closeModal($('#modal-divergencia'));
  if (sel === 'corrigir') {
    const inp = $('#input-iss');
    inp.value = 'R$ 500,00';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    $('#field-iss').classList.remove('ocr-divergent');
    showToast('ISS ajustado para R$ 500,00 — auditoria registrada');
  } else if (sel === 'aceitar') {
    showToast('Divergência aceita · assinatura registrada na trilha');
  } else if (sel === 'contatar') {
    showToast('Notificação enviada ao fornecedor');
  }
});

/* ─── 7. Validação ISS → scroll + focus ──────────────────── */
$('#val-iss')?.addEventListener('click', () => {
  const anchor = $('#input-iss');
  const wrap = anchor.closest('.input');
  wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    anchor.focus();
    wrap.classList.add('shake');
    setTimeout(() => wrap.classList.remove('shake'), 400);
  }, 350);
});
$$('#composition .row.divergent').forEach(row => {
  row.addEventListener('click', () => $('#val-iss').click());
});

/* ─── 8. Aprovador modal: select + confirm ───────────────── */
$$('#modal-aprovador .result').forEach(r => {
  r.addEventListener('click', () => {
    $$('#modal-aprovador .result').forEach(o => o.classList.remove('focused'));
    r.classList.add('focused');
  });
});
$('#confirm-aprovador')?.addEventListener('click', () => {
  const sel = $('#modal-aprovador .result.focused');
  if (!sel) return;
  $('#open-aprovador-modal').dataset.aprovador = sel.dataset.aprovador;
  $('#aprovador-initials').textContent = sel.dataset.initials;
  $('#aprovador-name').textContent = sel.dataset.name;
  $('#aprovador-role').textContent = sel.dataset.role;
  closeModal($('#modal-aprovador'));
  showToast(`Aprovador definido: ${sel.dataset.name}`);
});

/* Buscar Fornecedor — keyboard nav */
const fornInput = $('#forn-search');
fornInput?.addEventListener('keydown', e => {
  const arr = $$('#forn-results .result');
  let idx = arr.findIndex(r => r.classList.contains('focused'));
  if (e.key === 'ArrowDown') { e.preventDefault(); idx = (idx + 1) % arr.length; }
  else if (e.key === 'ArrowUp') { e.preventDefault(); idx = (idx - 1 + arr.length) % arr.length; }
  else if (e.key === 'Enter') {
    e.preventDefault();
    showToast('Fornecedor selecionado');
    closeModal($('#modal-fornecedor'));
    return;
  } else return;
  arr.forEach((r, i) => r.classList.toggle('focused', i === idx));
  arr[idx].scrollIntoView({ block: 'nearest' });
});
$$('#forn-results .result').forEach(r => {
  r.addEventListener('click', () => {
    $$('#forn-results .result').forEach(o => o.classList.remove('focused'));
    r.classList.add('focused');
    setTimeout(() => {
      showToast('Fornecedor selecionado');
      closeModal($('#modal-fornecedor'));
    }, 200);
  });
});

/* ─── 9. Novo fornecedor — PJ/PF toggle + confirm ────────── */
$$('#novo-forn-tipo button').forEach(b => {
  b.addEventListener('click', () => {
    $$('#novo-forn-tipo button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    const isPF = b.dataset.val === 'PF';
    const doc = $('#novo-forn-doc');
    const nome = $('#novo-forn-nome');
    if (doc) doc.placeholder = isPF ? '000.000.000-00' : '00.000.000/0000-00';
    if (nome) nome.placeholder = isPF ? 'Nome completo' : 'Empresa Ltda';
  });
});
$('#confirm-novo-fornecedor')?.addEventListener('click', () => {
  const nome = $('#novo-forn-nome')?.value?.trim();
  const doc  = $('#novo-forn-doc')?.value?.trim();
  if (!nome || !doc) {
    showToast('Razão Social e CNPJ/CPF são obrigatórios');
    return;
  }
  closeModal($('#modal-novo-fornecedor'));
  showToast(`Fornecedor "${nome}" cadastrado`);
});

/* ─── 10. Forma de pagamento: pick + extras ──────────────── */
const PAY_EXTRAS = {
  'PIX': null,
  'TED': null,
  'Transferência': null,
  'Cartão': { ic: '▢', k: 'Cartão corporativo:', v: 'Visa Business **** 4719' }
};
function applyForma(forma) {
  const formaVal = $('[data-field="forma"] .value');
  if (formaVal) formaVal.textContent = forma;
  const host = $('#pay-extras-host');
  if (!host) return;
  host.innerHTML = '';

  if (forma === 'Boleto') {
    host.innerHTML = `
      <div class="pay-barras-input">
        <div class="br-head">
          <label>Linha digitável (47–48 dígitos)</label>
          <span class="validate" id="barras-status">✓ válido</span>
        </div>
        <input type="text" id="input-cod-barras" inputmode="numeric" value="23793.39001 60000.123456 78901.234567 8 98760000485000" />
      </div>`;
    const codInp = $('#input-cod-barras');
    const status = $('#barras-status');
    codInp.addEventListener('input', () => {
      const len = codInp.value.replace(/\D/g, '').length;
      if (len === 47 || len === 48) {
        status.style.color = 'var(--green-deep)';
        status.textContent = '✓ válido';
      } else if (len === 0) {
        status.style.color = 'var(--ink-5)';
        status.textContent = 'aguardando';
      } else {
        status.style.color = 'var(--red-deep)';
        status.textContent = `⚠ ${len}/47`;
      }
    });
  } else if (forma === 'Outro') {
    host.innerHTML = `
      <div class="pay-note-input">
        <div class="nh"><label>Observação</label></div>
        <input type="text" id="input-pay-note" placeholder="Descreva como o pagamento será feito" />
      </div>`;
  } else if (PAY_EXTRAS[forma]) {
    const cfg = PAY_EXTRAS[forma];
    host.innerHTML = `<div class="pay-extras"><span>${cfg.ic}</span><span class="k">${cfg.k}</span><span class="v">${cfg.v}</span></div>`;
  }
}
$$('#modal-forma .forma-card').forEach(card => {
  card.addEventListener('click', () => {
    const forma = card.dataset.forma;
    $$('#modal-forma .forma-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    setTimeout(() => {
      applyForma(forma);
      closeModal($('#modal-forma'));
      showToast(`Forma de pagamento: ${forma}`);
    }, 180);
  });
});

/* ─── 11. Select menu com .with-menu ─────────────────────── */
let openMenuFor = null;
function closeSelectMenu() {
  if (!openMenuFor) return;
  openMenuFor.classList.remove('menu-open');
  const m = openMenuFor.querySelector('.select-menu');
  if (m) m.classList.remove('open');
  openMenuFor = null;
}
function positionSelectMenu(wrap, menu) {
  const rect = wrap.getBoundingClientRect();
  const menuMax = 320;
  const gap = 4;
  const vh = window.innerHeight;
  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  if (spaceBelow >= menuMax + gap || spaceBelow >= spaceAbove) {
    menu.style.top = (rect.bottom + gap) + 'px';
    menu.style.maxHeight = Math.min(menuMax, spaceBelow - 12) + 'px';
  } else {
    const maxH = Math.min(menuMax, spaceAbove - 12);
    menu.style.top = (rect.top - maxH - gap) + 'px';
    menu.style.maxHeight = maxH + 'px';
  }
  menu.style.left = rect.left + 'px';
  menu.style.width = rect.width + 'px';
}
function openSelectMenu(wrap) {
  closeSelectMenu();
  let menu = wrap.querySelector('.select-menu');
  if (!menu) {
    let options = [];
    try { options = JSON.parse(wrap.dataset.options || '[]'); } catch (e) {}
    menu = document.createElement('div');
    menu.className = 'select-menu';
    const cur = wrap.querySelector('.value')?.textContent?.trim();
    menu.innerHTML = options.map(o => {
      const sel = o.label === cur ? ' selected' : '';
      return `<button class="opt${sel}" data-value="${o.label}">
        <div class="opt-body">
          <div class="opt-label">${o.label}</div>
          ${o.sub ? `<div class="opt-sub">${o.sub}</div>` : ''}
        </div>
        <svg class="check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5L6.5 12 13 4.5"/></svg>
      </button>`;
    }).join('');
    wrap.appendChild(menu);
    menu.querySelectorAll('.opt').forEach(opt => {
      opt.addEventListener('click', e => {
        e.stopPropagation();
        const v = opt.dataset.value;
        const valEl = wrap.querySelector('.value');
        if (valEl) valEl.textContent = v;
        closeSelectMenu();
        bumpAutoSave();
        // Trigger subcategoria sync if cat changed
        if (wrap.dataset.field === 'cat') syncSubcategoria();
      });
    });
  } else {
    const cur = wrap.querySelector('.value')?.textContent?.trim();
    menu.querySelectorAll('.opt').forEach(o => {
      o.classList.toggle('selected', o.dataset.value === cur);
    });
  }
  positionSelectMenu(wrap, menu);
  requestAnimationFrame(() => {
    wrap.classList.add('menu-open');
    menu.classList.add('open');
    openMenuFor = wrap;
  });
}
$$('.is-select.with-menu').forEach(wrap => {
  wrap.addEventListener('click', e => {
    if (e.target.closest('.select-menu')) return;
    e.stopPropagation();
    if (openMenuFor === wrap) closeSelectMenu();
    else openSelectMenu(wrap);
  });
});
document.addEventListener('click', () => closeSelectMenu());
window.addEventListener('scroll', () => { if (openMenuFor) closeSelectMenu(); }, true);
window.addEventListener('resize', () => {
  if (openMenuFor) {
    const menu = openMenuFor.querySelector('.select-menu');
    if (menu) positionSelectMenu(openMenuFor, menu);
  }
});

/* ─── 12. Subcategoria depende de Categoria ──────────────── */
const SUBCAT_BY_CAT = {
  'Consultoria': [
    { label: 'Técnica', sub: 'Arquitetura, engenharia de software, infra' },
    { label: 'Estratégica', sub: 'Planejamento, advisory, gestão' },
    { label: 'Jurídica', sub: 'Pareceres, contratos, compliance' },
    { label: 'Contábil', sub: 'Auditoria, fiscal, tributária' }
  ],
  'Manutenção': [
    { label: 'Predial', sub: 'Reformas, instalações, conservação' },
    { label: 'Equipamentos', sub: 'Máquinas, mobiliário, ar-condicionado' },
    { label: 'Veículos', sub: 'Frota, revisões, peças' },
    { label: 'TI', sub: 'Hardware, redes, servidores' }
  ],
  'Materiais': [
    { label: 'Escritório', sub: 'Papelaria, suprimentos, mobiliário' },
    { label: 'Limpeza', sub: 'Produtos químicos, descartáveis' },
    { label: 'Construção', sub: 'Insumos, ferramentas, acabamento' }
  ],
  'Software': [
    { label: 'SaaS', sub: 'Assinaturas recorrentes' },
    { label: 'Licenças', sub: 'Compra perpétua de software' },
    { label: 'Desenvolvimento', sub: 'Customizações, integrações' }
  ],
  'Treinamento': [
    { label: 'Cursos', sub: 'Capacitação técnica e comportamental' },
    { label: 'Certificações', sub: 'Provas, taxas de certificação' },
    { label: 'Eventos', sub: 'Congressos, palestras, workshops' }
  ],
  'Outros': [
    { label: 'Diversos', sub: 'Sem subcategorização definida' }
  ]
};
function syncSubcategoria() {
  const catWrap = $('[data-field="cat"]');
  const subWrap = $('[data-field="subcat"]');
  if (!catWrap || !subWrap) return;
  const cat = catWrap.querySelector('.value')?.textContent?.trim();
  const opts = SUBCAT_BY_CAT[cat] || SUBCAT_BY_CAT['Outros'];
  subWrap.dataset.options = JSON.stringify(opts);
  const curSub = subWrap.querySelector('.value')?.textContent?.trim();
  const valid = opts.some(o => o.label === curSub);
  if (!valid) {
    const v = subWrap.querySelector('.value');
    if (v) v.textContent = opts[0].label;
  }
  const cached = subWrap.querySelector('.select-menu');
  if (cached) cached.remove();
}

/* ─── 13. Approve flow ───────────────────────────────────── */
const btnApprove = $('#btn-approve');
btnApprove.addEventListener('click', () => {
  if (btnApprove.disabled) return;
  btnApprove.disabled = true;
  const original = btnApprove.innerHTML;
  btnApprove.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:1.5px solid white;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></span> Enviando…';
  setTimeout(() => {
    btnApprove.innerHTML = '✓ Enviado';
    btnApprove.style.background = 'var(--green)';
    const stage = $('#stage-pill');
    stage.textContent = 'Em Aprovação';
    stage.style.background = 'var(--amber-bg-2)';
    stage.style.color = 'var(--amber-deep)';
    showToast('Documento enviado para Ana Carvalho (Aprovador)');
    setTimeout(() => {
      btnApprove.disabled = false;
      btnApprove.innerHTML = original;
      btnApprove.style.background = '';
    }, 3200);
  }, 1100);
});

/* ─── 14. Discard + Salvar rascunho + Reabrir ────────────── */
$('#btn-discard')?.addEventListener('click', () => showToast('Rascunho descartado'));
$('#btn-draft')?.addEventListener('click', () => {
  bumpAutoSave();
  showToast('Rascunho salvo');
});

function setSealed(on) {
  document.body.classList.toggle('sealed', on);
  const banner = $('#lock-banner');
  if (banner) banner.style.display = on ? '' : 'none';
  const stage = $('#stage-pill');
  stage.textContent = on ? 'Selado' : 'Rascunho';
  if (on) {
    $$('.input input').forEach(i => i.setAttribute('readonly', 'readonly'));
  } else {
    $$('.input input').forEach(i => i.removeAttribute('readonly'));
  }
}
$('#reopen')?.addEventListener('click', () => {
  setSealed(false);
  showToast('Documento reaberto · status volta a Rascunho');
});

/* ─── 15. Categorização — Alterar contrato ───────────────── */
$('#open-contract')?.addEventListener('click', () => {
  showToast('Alterar contrato — abriria modal de busca');
});

function updateContrato(t) {
  const pill = $('#open-contract');
  if (!pill) return;
  const c = t.contrato || { form: 'Sem Contrato', num: '', label: 'Documento sem vínculo contratual', status: 'Livre' };
  pill.querySelector('.cn-label').textContent = c.form || 'Contrato';
  pill.querySelector('.cn-id').textContent    = c.num || '';
  pill.querySelector('.situ-text').textContent = c.status || 'Ativo';
}

/* ─── 16. DOC TYPES — schema e troca de documento ────────── */

const DOC_TYPES = {
  'NFS-e': {
    label: 'NFS-e',
    sub: 'Nota Fiscal de Serviço Eletrônica',
    desc: 'Serviços contratados de PJ — gera retenções tributárias',
    glyph: 'SF', color: 'teal', fiscal: true,
    docId: 'DOC-2026-0847',
    fornecedor: {
      kind: 'PJ',
      name: 'Patricia Brun Ribeiro da Frota',
      fantasia: 'Bambu Educação',
      docNumber: 'CNPJ 37.364.305/0001-92',
      avatar: 'BE',
      meta: 'Contratada desde jan/2025'
    },
    identif: {
      numero: '0847 · A1', competencia: '05/2026',
      emissao: '02/05/2026', vencimento: '10/06/2026',
      bruto: 10000, descricao: 'Assessoria técnica · maio/2026'
    },
    retencoes: [
      { id: 'iss',    label: 'ISS',    value: 350,  divergent: true, pct: '3,5%' },
      { id: 'irrf',   label: 'IRRF',   value: 150,  pct: '1,5%' },
      { id: 'inss',   label: 'INSS',   value: 1100, pct: '11%' },
      { id: 'pis',    label: 'PIS',    value: 65,   pct: '0,65%' },
      { id: 'cofins', label: 'COFINS', value: 300,  pct: '3%' },
      { id: 'csll',   label: 'CSLL',   value: 100,  pct: '1%' }
    ],
    titulos: [
      { kind: 'ISS',  to: 'SEFIN Fortaleza', amt: 350, divergent: true },
      { kind: 'IRRF', to: 'Receita Federal', amt: 150 },
      { kind: 'INSS', to: 'Receita Federal', amt: 1100 },
      { kind: 'CSRF', to: 'Receita Federal', amt: 465 }
    ],
    formaPag: 'PIX',
    contrato: { form: 'Contrato', num: '0001/2026', label: 'EPV — Apoio Regional · Assessoria técnica', status: 'Em andamento' }
  },

  'DANFE': {
    label: 'DANFE',
    sub: 'Documento Auxiliar da NF-e',
    desc: 'Produtos / mercadorias — ICMS informativo, IPI e federais retidos',
    glyph: 'NF', color: 'teal', fiscal: true,
    docId: 'DOC-2026-0091',
    fornecedor: {
      kind: 'PJ',
      name: 'Distribuidora Atlas Ltda',
      docNumber: 'CNPJ 34.829.117/0001-22',
      avatar: 'DA',
      meta: 'Fornecedor recorrente · 14 NF-es em 2026'
    },
    identif: {
      numero: '00091 · 1', competencia: '04/2026',
      emissao: '28/04/2026', vencimento: '28/05/2026',
      bruto: 18500, descricao: 'Equipamentos de TI · pedido 4421'
    },
    extras: [
      { id: 'chave-acesso', label: 'Chave de Acesso · NF-e', value: '2304 2608 4291 1200 0122 5500 1000 0910 9114 1234 5670', mono: true, full: true, hint: '44 dígitos · validada na SEFAZ-CE em 28/04/2026', readonly: true }
    ],
    retencoes: [
      { id: 'ipi',    label: 'IPI',    value: 925,    pct: '5%' },
      { id: 'irrf',   label: 'IRRF',   value: 277.50, pct: '1,5%' },
      { id: 'pis',    label: 'PIS',    value: 120.25, pct: '0,65%' },
      { id: 'cofins', label: 'COFINS', value: 555,    pct: '3%' },
      { id: 'csll',   label: 'CSLL',   value: 185,    pct: '1%' }
    ],
    titulos: [
      { kind: 'IPI',  to: 'Receita Federal', amt: 925 },
      { kind: 'IRRF', to: 'Receita Federal', amt: 277.50 },
      { kind: 'CSRF', to: 'Receita Federal', amt: 860.25 }
    ],
    formaPag: 'Boleto',
    contrato: { form: 'Ordem de Compra', num: 'OC-4421', label: 'MAN — Manutenção Operacional · Equipamentos de TI', status: 'Em execução' }
  },

  'RPA': {
    label: 'RPA',
    sub: 'Recibo de Pagamento Autônomo',
    desc: 'Pessoa física autônoma — INSS, IRRF tabela progressiva, ISS',
    glyph: 'RP', color: 'teal', fiscal: true,
    docId: 'DOC-2026-RPA-014',
    fornecedor: {
      kind: 'PF',
      name: 'João Mendes da Silva',
      docNumber: 'CPF 142.857.301-95',
      avatar: 'JM',
      meta: 'Autônomo · profissional liberal'
    },
    identif: {
      numero: '014/2026 · —', competencia: '05/2026',
      emissao: '08/05/2026', vencimento: '15/05/2026',
      bruto: 3500, descricao: 'Diagramação editorial · projeto Anuário 2026'
    },
    retencoes: [
      { id: 'inss', label: 'INSS PF', value: 385,    pct: '11% / teto' },
      { id: 'irrf', label: 'IRRF',    value: 174.30, pct: 'tabela progr.' },
      { id: 'iss',  label: 'ISS',     value: 175,    pct: '5%' }
    ],
    titulos: [
      { kind: 'ISS',  to: 'SEFIN Fortaleza', amt: 175 },
      { kind: 'INSS', to: 'Receita Federal', amt: 385 },
      { kind: 'IRRF', to: 'Receita Federal', amt: 174.30 }
    ],
    formaPag: 'PIX',
    contrato: { form: 'Ordem de Serviço', num: 'OS-014/2026', label: 'Diagramação editorial · projeto Anuário 2026', status: 'Ativo' }
  },

  'Fatura': {
    label: 'Fatura',
    sub: 'Fatura comercial',
    desc: 'Cobrança comercial — retenções condicionais',
    glyph: 'FT', color: 'gray', fiscal: 'partial',
    docId: 'DOC-2026-FT-329',
    fornecedor: {
      kind: 'PJ',
      name: 'Cloud Brasil Hosting S.A.',
      docNumber: 'CNPJ 19.847.220/0001-08',
      avatar: 'CB',
      meta: 'Serviço recorrente · mensal'
    },
    identif: {
      numero: '329 · —', competencia: '05/2026',
      emissao: '01/05/2026', vencimento: '20/05/2026',
      bruto: 2480, descricao: 'Hospedagem em nuvem · plano Business · maio/2026'
    },
    retencoes: [],
    titulos: [],
    formaPag: 'PIX',
    contrato: { form: 'Contrato', num: '0018/2024', label: 'Infraestrutura de TI · renovação anual', status: 'Em andamento' }
  },

  'Boleto': {
    label: 'Boleto',
    sub: 'Boleto bancário',
    desc: 'Pagamento com código de barras — sem retenções',
    glyph: 'BL', color: 'gray', fiscal: false,
    docId: 'DOC-2026-BL-552',
    fornecedor: {
      kind: 'PJ',
      name: 'Imóveis Centro Ltda',
      docNumber: 'CNPJ 27.482.913/0001-66',
      avatar: 'IC',
      meta: 'Locador · aluguel comercial'
    },
    identif: {
      numero: '552 · —', competencia: '05/2026',
      emissao: '05/05/2026', vencimento: '15/05/2026',
      bruto: 4850, descricao: 'Aluguel sala 1402 · maio/2026'
    },
    retencoes: [],
    titulos: [],
    formaPag: 'Boleto',
    contrato: { form: 'Termo de Quitação', num: 'TQ-552', label: 'Aluguel sala 1402 · maio/2026', status: 'A vencer' }
  },

  'Recibo': {
    label: 'Recibo',
    sub: 'Recibo simples',
    desc: 'Lançamento manual sem aderência fiscal',
    glyph: 'RC', color: 'gray', fiscal: false,
    docId: 'DOC-2026-RC-018',
    fornecedor: {
      kind: 'PJ',
      name: 'Auto Posto Líder',
      docNumber: 'CNPJ 09.473.182/0001-30',
      avatar: 'AL',
      meta: 'Despesa eventual'
    },
    identif: {
      numero: '018 · —', competencia: '05/2026',
      emissao: '09/05/2026', vencimento: '09/05/2026',
      bruto: 287.50, descricao: 'Combustível · frota viatura A'
    },
    retencoes: [],
    titulos: [],
    formaPag: 'PIX',
    contrato: { form: 'Sem Contrato', num: '', label: 'Despesa avulsa', status: 'Livre' }
  },

  'Guia': {
    label: 'Guia',
    sub: 'Guia de Recolhimento (DARF · GPS)',
    desc: 'Recolhimento de tributo já apurado — sem retenções',
    glyph: 'GD', color: 'amber', fiscal: false,
    docId: 'DOC-2026-GD-DARF-220',
    fornecedor: {
      kind: 'PJ',
      name: 'Receita Federal do Brasil',
      docNumber: 'Órgão federal',
      avatar: 'RF',
      meta: 'Recolhimento de tributo ciclo anterior'
    },
    identif: {
      numero: 'DARF 1708 · —', competencia: '04/2026',
      emissao: '01/05/2026', vencimento: '20/05/2026',
      bruto: 1567.55, descricao: 'IRRF · período de apuração abr/2026'
    },
    retencoes: [],
    titulos: [],
    formaPag: 'TED',
    contrato: { form: 'Sem Contrato', num: '', label: 'Recolhimento tributário avulso', status: 'Livre' }
  }
};

let currentDocType = 'NFS-e';
const brl = n => 'R$ ' + fmt(n);

/* ─── PDF Templates (estilo v1: Fraunces + circular seal) ── */
function pdfTotals(t) {
  const ret = t.retencoes.reduce((s, r) => s + r.value, 0);
  const liq = t.identif.bruto - ret;
  if (!t.fiscal || ret === 0) {
    return `<div class="pdf-totals"><div class="line net"><span class="k">Total</span><span class="v">${brl(t.identif.bruto)}</span></div></div>`;
  }
  return `<div class="pdf-totals">
    <div class="line"><span class="k">Valor Bruto</span><span class="v">${brl(t.identif.bruto)}</span></div>
    <div class="line"><span class="k">Total Retenções</span><span class="v">- ${brl(ret)}</span></div>
    <div class="line net"><span class="k">Valor Líquido</span><span class="v">${brl(liq)}</span></div>
  </div>`;
}

function pdfNFSe(t) {
  return `
    <div class="pdf-head">
      <div class="seal">SF</div>
      <div style="flex:1"><h2>Nota Fiscal de Serviço Eletrônica</h2><div class="pdf-sub">Prefeitura Municipal de Fortaleza · SEFIN</div></div>
      <div class="pdf-num"><div>Número</div><strong>${t.identif.numero.split(' ')[0]}</strong><div>Série ${t.identif.numero.split('· ')[1]||'A1'}</div></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Prestador de Serviços</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">${t.fornecedor.name}</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">${t.fornecedor.docNumber.replace(/^\w+\s/, '')}</span></div>
      <div class="pdf-row"><span class="k">Endereço</span><span class="v">Av. Antônio Sales, 1854 · Fortaleza/CE</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Tomador</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Discriminação do Serviço</div>
      <table class="pdf-table"><thead><tr><th>Item</th><th>Descrição</th><th class="right">Valor (R$)</th></tr></thead><tbody>
        <tr><td>1.</td><td>${t.identif.descricao}</td><td class="right">${fmt(t.identif.bruto)}</td></tr>
      </tbody></table>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Datas e Identificação</div>
      <div class="pdf-row"><span class="k">Emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row"><span class="k">Competência</span><span class="v">${t.identif.competencia}</span></div>
      <div class="pdf-row"><span class="k">Cód. Serviço</span><span class="v">01.05 — Consultoria em TI</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Retenções</div>
      <table class="pdf-table"><tbody>
        ${t.retencoes.map(r => `<tr><td>${r.label} (<strong>${r.pct}</strong>)</td><td class="right">${fmt(r.value)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    ${pdfTotals(t)}`;
}

function pdfDANFE(t) {
  return `
    <div class="pdf-head">
      <div class="seal">NF</div>
      <div style="flex:1"><h2>DANFE · NF-e</h2><div class="pdf-sub">Documento Auxiliar da NF-e · SEFAZ</div></div>
      <div class="pdf-num"><div>Número</div><strong>${t.identif.numero.split(' ')[0]}</strong><div>Série 1</div></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Emitente</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">${t.fornecedor.name}</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">${t.fornecedor.docNumber.replace(/^\w+\s/, '')}</span></div>
      <div class="pdf-row"><span class="k">IE</span><span class="v">06.123.487-9 · CE</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Destinatário</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Itens da Nota</div>
      <table class="pdf-table"><thead><tr><th>NCM</th><th>Descrição</th><th class="right">Qtd</th><th class="right">Valor</th></tr></thead><tbody>
        <tr><td>8471.30</td><td>Notebook corporativo i7 16GB SSD512</td><td class="right">5</td><td class="right">${fmt(t.identif.bruto)}</td></tr>
      </tbody></table>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Datas · ICMS · Chave</div>
      <div class="pdf-row"><span class="k">Emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row"><span class="k">CFOP</span><span class="v">5101 — Venda</span></div>
      <div class="pdf-row"><span class="k">ICMS (12%)</span><span class="v">R$ 2.220,00 · informativo</span></div>
      <div class="pdf-row"><span class="k">Chave de Acesso</span><span class="v" style="font-family:'JetBrains Mono',monospace;font-size:9px;">2304 2608 4291 1200 0122 5500</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Retenções Federais</div>
      <table class="pdf-table"><tbody>
        ${t.retencoes.map(r => `<tr><td>${r.label} (${r.pct})</td><td class="right">${fmt(r.value)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    ${pdfTotals(t)}`;
}

function pdfRPA(t) {
  return `
    <div class="pdf-head">
      <div class="seal">RP</div>
      <div style="flex:1"><h2>Recibo de Pagamento a Autônomo</h2><div class="pdf-sub">Pessoa Física · ISS Fortaleza</div></div>
      <div class="pdf-num"><div>RPA Nº</div><strong>${t.identif.numero.split(' ')[0]}</strong></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Beneficiário (Pessoa Física)</div>
      <div class="pdf-row"><span class="k">Nome completo</span><span class="v">${t.fornecedor.name}</span></div>
      <div class="pdf-row"><span class="k">CPF</span><span class="v">${t.fornecedor.docNumber.replace(/^\w+\s/, '')}</span></div>
      <div class="pdf-row"><span class="k">PIS/NIT</span><span class="v">128.4729.4920-3</span></div>
      <div class="pdf-row"><span class="k">Profissão</span><span class="v">Designer Gráfico — Autônomo</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Pagador</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Serviço Prestado</div>
      <div class="pdf-row"><span class="k">Descrição</span><span class="v">${t.identif.descricao}</span></div>
      <div class="pdf-row"><span class="k">Emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row"><span class="k">Valor Bruto</span><span class="v">${brl(t.identif.bruto)}</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Retenções de Pessoa Física</div>
      <table class="pdf-table"><tbody>
        ${t.retencoes.map(r => `<tr><td>${r.label} (${r.pct})</td><td class="right">${fmt(r.value)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    ${pdfTotals(t)}
    <div class="pdf-section" style="margin-top: 14px;">
      <p style="font-size: 10px; color: var(--ink-3); line-height: 1.5; margin: 0; font-style: italic;">Declaro ter recebido a importância líquida acima discriminada, dando plena e geral quitação do serviço prestado.</p>
      <div style="margin-top: 18px; border-top: 1px solid var(--ink-2); padding-top: 4px; width: 200px; font-size: 9px; color: var(--ink-5); text-align: center;">${t.fornecedor.name}</div>
    </div>`;
}

function pdfFatura(t) {
  return `
    <div class="pdf-head">
      <div class="seal">FT</div>
      <div style="flex:1"><h2>Fatura Comercial</h2><div class="pdf-sub">${t.fornecedor.name}</div></div>
      <div class="pdf-num"><div>Fatura Nº</div><strong>${t.identif.numero.split(' ')[0]}</strong></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Cliente</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Cobrança</div>
      <table class="pdf-table"><thead><tr><th>Descrição</th><th class="right">Valor</th></tr></thead><tbody>
        <tr><td>${t.identif.descricao}</td><td class="right">${fmt(t.identif.bruto)}</td></tr>
      </tbody></table>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Datas</div>
      <div class="pdf-row"><span class="k">Emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row"><span class="k">Vencimento</span><span class="v" style="font-weight:600;">${t.identif.vencimento}</span></div>
    </div>
    ${pdfTotals(t)}
    <div class="pdf-section" style="margin-top: 16px;">
      <div class="pdf-section-title">Forma de pagamento sugerida</div>
      <div class="pdf-row"><span class="k">PIX</span><span class="v" style="font-family:'JetBrains Mono',monospace;font-size:10px;">${t.fornecedor.docNumber.replace(/^\w+\s/, '')}</span></div>
    </div>`;
}

function pdfBoleto(t) {
  return `
    <div class="pdf-head">
      <div class="seal" style="background:var(--paper-beige);font-size:11px;">237</div>
      <div style="flex:1"><h2>Boleto Bancário</h2><div class="pdf-sub">Bradesco S.A.</div></div>
      <div class="pdf-num"><div>Vencimento</div><strong>${t.identif.vencimento}</strong></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Beneficiário</div>
      <div class="pdf-row"><span class="k">Nome</span><span class="v">${t.fornecedor.name}</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">${t.fornecedor.docNumber.replace(/^\w+\s/, '')}</span></div>
      <div class="pdf-row"><span class="k">Agência/Conta</span><span class="v">0298 / 12490-7</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Pagador</div>
      <div class="pdf-row"><span class="k">Nome</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Documento</div>
      <div class="pdf-row"><span class="k">Descrição</span><span class="v">${t.identif.descricao}</span></div>
      <div class="pdf-row"><span class="k">Vencimento</span><span class="v" style="font-weight:600;">${t.identif.vencimento}</span></div>
      <div class="pdf-row"><span class="k">Valor</span><span class="v" style="font-weight:700;color:var(--ink-1);">${brl(t.identif.bruto)}</span></div>
    </div>
    <div style="margin-top: 18px; padding: 12px 0; border-top: 1px solid var(--ink-1); border-bottom: 1px solid var(--ink-1);">
      <div style="font-size: 8.5px; color: var(--ink-5); margin-bottom: 6px; letter-spacing: 0.1em;">LINHA DIGITÁVEL</div>
      <div style="font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 11px; letter-spacing: 0.5px; color: var(--ink-1);">23793.39001 60000.123456 78901.234567 8 98760000485000</div>
      <div style="margin-top: 10px; height: 36px; background: repeating-linear-gradient(90deg, var(--ink-1), var(--ink-1) 2px, transparent 2px, transparent 5px, var(--ink-1) 5px, var(--ink-1) 8px, transparent 8px, transparent 11px); width: 100%;"></div>
    </div>`;
}

function pdfRecibo(t) {
  return `
    <div class="pdf-head">
      <div class="seal">RC</div>
      <div style="flex:1"><h2>Recibo</h2><div class="pdf-sub">Documento simples · não fiscal</div></div>
      <div class="pdf-num"><div>Nº</div><strong>${t.identif.numero.split(' ')[0]}</strong></div>
    </div>
    <div class="pdf-section" style="margin-top: 24px;">
      <p style="font-size: 12px; line-height: 1.7; color: var(--ink-2); margin: 0;">
        Recebi de <strong>Bem Comum Tecnologia S/A</strong>, CNPJ 48.295.610/0001-44,
        a importância de <strong>${brl(t.identif.bruto)}</strong>
        referente a <strong>${t.identif.descricao}</strong>,
        dando plena e total quitação.
      </p>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Emitido por</div>
      <div class="pdf-row"><span class="k">Nome</span><span class="v">${t.fornecedor.name}</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">${t.fornecedor.docNumber.replace(/^\w+\s/, '')}</span></div>
      <div class="pdf-row"><span class="k">Data</span><span class="v">${t.identif.emissao}</span></div>
    </div>
    ${pdfTotals(t)}
    <div style="margin-top: 40px; border-top: 1px solid var(--ink-2); padding-top: 4px; width: 240px; margin-left: auto; margin-right: auto; font-size: 10px; color: var(--ink-5); text-align: center;">${t.fornecedor.name}</div>`;
}

function pdfGuia(t) {
  return `
    <div class="pdf-head">
      <div class="seal" style="background:var(--amber-bg-2);color:var(--amber-deep);">RF</div>
      <div style="flex:1"><h2>DARF · Documento de Arrecadação</h2><div class="pdf-sub">Ministério da Fazenda · Receita Federal</div></div>
      <div class="pdf-num"><div>Cód. Receita</div><strong>1708</strong></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Contribuinte</div>
      <div class="pdf-row"><span class="k">Razão Social</span><span class="v">Bem Comum Tecnologia S/A</span></div>
      <div class="pdf-row"><span class="k">CNPJ</span><span class="v">48.295.610/0001-44</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Apuração</div>
      <div class="pdf-row"><span class="k">Cód. Receita</span><span class="v"><strong>1708</strong> — IRRF · Remuneração de Serviços</span></div>
      <div class="pdf-row"><span class="k">Período</span><span class="v">04/2026</span></div>
      <div class="pdf-row"><span class="k">Emissão</span><span class="v">${t.identif.emissao}</span></div>
      <div class="pdf-row"><span class="k">Vencimento</span><span class="v" style="font-weight:600;color:var(--red-deep);">${t.identif.vencimento}</span></div>
    </div>
    <div class="pdf-section">
      <div class="pdf-section-title">Valores</div>
      <div class="pdf-row"><span class="k">Valor do Principal</span><span class="v" style="font-weight:600;">${brl(t.identif.bruto)}</span></div>
      <div class="pdf-row"><span class="k">Multa / Juros</span><span class="v">R$ 0,00</span></div>
      <div class="pdf-row" style="border-top: 1px solid var(--ink-1); margin-top: 6px; padding-top: 6px;"><span class="k" style="font-weight:600;color:var(--ink-1);">Total a Recolher</span><span class="v" style="font-weight:700;color:var(--ink-1);">${brl(t.identif.bruto)}</span></div>
    </div>
    <div style="margin-top: 18px; padding: 10px 14px; background: var(--amber-bg); border-left: 3px solid var(--amber); border-radius: 4px; font-size: 10.5px; color: var(--ink-3); line-height: 1.5;">
      <strong>Atenção:</strong> recolhimento de tributo já retido em ciclo anterior. Não gera retenções adicionais.
    </div>`;
}

const PDF_RENDERERS = {
  'NFS-e': pdfNFSe, 'DANFE': pdfDANFE, 'RPA': pdfRPA,
  'Fatura': pdfFatura, 'Boleto': pdfBoleto, 'Recibo': pdfRecibo, 'Guia': pdfGuia
};

/* ─── Build tipo cards no modal ─── */
function buildTipoGrid() {
  const grid = $('#tipo-grid');
  grid.innerHTML = '';
  Object.entries(DOC_TYPES).forEach(([key, t]) => {
    const card = document.createElement('button');
    card.className = 'tipo-card' + (key === currentDocType ? ' selected' : '');
    card.dataset.tipo = key;
    card.dataset.color = t.color;
    const fiscalPill = t.fiscal === true ? '<span class="fiscal-pill">Fiscal</span>'
      : t.fiscal === 'partial' ? '<span class="fiscal-pill partial">Parcial</span>'
      : '<span class="fiscal-pill none">Não-fiscal</span>';
    card.innerHTML = `
      <div class="glyph">${t.glyph}</div>
      <div class="info">
        <div class="nm">${t.label} ${fiscalPill}</div>
        <div class="sub">${t.sub}</div>
        <div class="desc">${t.desc}</div>
      </div>`;
    card.addEventListener('click', () => {
      $$('.tipo-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      setTimeout(() => {
        setDocType(key);
        closeModal($('#modal-tipo'));
      }, 180);
    });
    grid.appendChild(card);
  });
}

/* ─── setDocType — orquestração ─── */
function setDocType(key) {
  const t = DOC_TYPES[key];
  if (!t) return;
  currentDocType = key;

  // Hero — overline reflete kind (PJ → Fornecedor · PJ, PF → Beneficiário · PF)
  $('.hero .name').textContent = t.fornecedor.name;
  $('.hero .cnpj').textContent = t.fornecedor.docNumber;
  $('#hero-overline').textContent = t.fornecedor.kind === 'PF'
    ? 'Beneficiário · PF'
    : 'Fornecedor · PJ';
  $('#hero-alter-label').textContent = t.fornecedor.kind === 'PF'
    ? 'Alterar pessoa'
    : 'Alterar fornecedor';

  // Tipo field
  $('[data-field="tipo"] .value').textContent = t.label;

  // Identif
  $('[data-field="numero"] input').value = t.identif.numero;
  $('[data-field="competencia"] input').value = t.identif.competencia;
  $('[data-field="emissao"] input').value = t.identif.emissao;
  $('[data-field="vencimento"] input').value = t.identif.vencimento;
  $('[data-field="descricao"] input').value = t.identif.descricao;
  $('#input-bruto').value = brl(t.identif.bruto);

  // Extras na Identificação (chave de acesso da DANFE, etc.)
  rebuildExtras(t);

  // Retenções
  rebuildRetencoes(t);

  // Composição
  rebuildComposicao(t);

  // Net block (líquido + vencimento)
  const totRet = t.retencoes.reduce((s, r) => s + r.value, 0);
  const liq = t.identif.bruto - totRet;
  $('#sidebar-net').textContent = brl(liq);
  $('.net-block .due .due-date').textContent = t.identif.vencimento;
  lastLiquido = liq;

  // Títulos
  rebuildTitulos(t);

  // Forma de pagamento + extras
  $('[data-field="forma"] .value').textContent = t.formaPag;
  applyForma(t.formaPag);

  // Contrato — entity-card (sempre visível, com fallback "Sem Contrato")
  updateContrato(t);

  // Validação ISS — só mostra se tem divergência
  const valIss = $('#val-iss');
  const divergent = t.retencoes.find(r => r.divergent);
  valIss.style.display = divergent ? '' : 'none';
  if (divergent) {
    valIss.dataset.anchor = `input-${divergent.id}`;
    valIss.querySelector('.label-txt').textContent = `Alíquota ${divergent.id.toUpperCase()} divergente do padrão`;
  }

  // PDF preview
  const pdfEl = $('.pdf');
  if (pdfEl && PDF_RENDERERS[key]) pdfEl.innerHTML = PDF_RENDERERS[key](t);

  // Preview filename
  const filename = `${key.replace(/[^a-zA-Z0-9]/g, '_')}_2026_${t.identif.numero.split(' ')[0]}.pdf`;
  $('.preview-head .label').innerHTML = `<span class="doc-emoji">📄</span> ${filename} · página 1/1`;

  // Fade animation
  ['.form', '.preview', '.sidebar'].forEach(sel => {
    const el = $(sel);
    if (el) {
      el.classList.remove('swap-fade');
      void el.offsetWidth;
      el.classList.add('swap-fade');
    }
  });

  showToast(`Tipo alterado para ${t.label}`);
}

function rebuildExtras(t) {
  // Encontra a section Identificação (h3 = "Identificação")
  const sections = $$('.form .section');
  const identifSection = sections.find(s => s.querySelector('h3')?.textContent === 'Identificação');
  if (!identifSection) return;

  // Remove extras antigos
  $$('.field-row.is-extra', identifSection).forEach(r => r.remove());

  if (!t.extras || t.extras.length === 0) return;

  t.extras.forEach(e => {
    const row = document.createElement('div');
    row.className = 'field-row is-extra ' + (e.full ? 'wide' : 'cols-2');
    const monoStyle = e.mono ? 'font-family: \'JetBrains Mono\', monospace; font-size: 12px; letter-spacing: 0.3px;' : '';
    const readonlyAttr = e.readonly ? 'readonly' : '';
    row.innerHTML = `
      <div class="field">
        <label>${e.label}</label>
        <div class="input ocr-ok">
          <input type="text" value="${e.value}" style="${monoStyle}" ${readonlyAttr} />
        </div>
        ${e.hint ? `<div class="extra-hint">${e.hint}</div>` : ''}
      </div>`;
    identifSection.appendChild(row);

    // Wire input
    const inp = row.querySelector('input');
    const wrap = row.querySelector('.input');
    inp.addEventListener('focus', () => wrap.classList.add('focused'));
    inp.addEventListener('blur', () => wrap.classList.remove('focused'));
    inp.addEventListener('input', () => bumpAutoSave());
    // Tooltip on hover
    wrap.addEventListener('mouseenter', () => {
      const tip = $('#tip');
      const r = wrap.getBoundingClientRect();
      tip.textContent = '📄 Origem: leitura do PDF';
      tip.style.left = (r.left + r.width / 2 - 80) + 'px';
      tip.style.top = (r.top - 32) + 'px';
      tip.classList.add('show');
    });
    wrap.addEventListener('mouseleave', () => $('#tip').classList.remove('show'));
  });
}

function rebuildRetencoes(t) {
  // Encontra a section pelo h3 (não tem ID hoje)
  const sections = $$('.form .section');
  const retSection = sections.find(s => s.querySelector('h3')?.textContent === 'Retenções');
  if (!retSection) return;

  // Remove field-rows existentes (mas mantém section-head)
  $$('.field-row', retSection).forEach(r => r.remove());

  if (t.retencoes.length === 0) {
    retSection.style.display = 'none';
    return;
  }
  retSection.style.display = '';

  // Build the cols-6 row de retenções
  const row = document.createElement('div');
  row.className = 'field-row cols-6';
  t.retencoes.forEach(r => {
    const ocrClass = r.divergent ? 'ocr-divergent' : 'ocr-ok';
    const fieldHtml = `
      <div class="field">
        <label>${r.label}</label>
        <div class="input ${ocrClass}" data-retencao="${r.id}" ${r.divergent ? 'id="field-iss"' : ''}>
          <input type="text" value="${brl(r.value)}" id="input-${r.id}" />
        </div>
      </div>`;
    row.insertAdjacentHTML('beforeend', fieldHtml);
  });
  retSection.appendChild(row);

  // Reforma row (sempre presente para tipos fiscais)
  if (t.fiscal === true) {
    const reformaRow = document.createElement('div');
    reformaRow.className = 'field-row cols-6';
    reformaRow.style.marginTop = '10px';
    reformaRow.innerHTML = `
      <div class="field"><label>CBS</label><div class="input is-info"><input type="text" value="R$ 0,00" readonly tabindex="-1" /></div></div>
      <div class="field"><label>IBS Municipal</label><div class="input is-info"><input type="text" value="R$ 0,00" readonly tabindex="-1" /></div></div>
      <div class="field"><label>IBS Estadual</label><div class="input is-info"><input type="text" value="R$ 0,00" readonly tabindex="-1" /></div></div>
      <div></div><div></div><div></div>`;
    retSection.appendChild(reformaRow);
  }

  // Re-wire novos inputs (focus, blur, input, double-click on divergent)
  $$('.input input', retSection).forEach(inp => {
    const wrap = inp.closest('.input');
    inp.addEventListener('focus', () => {
      if (document.body.classList.contains('sealed')) {
        inp.blur(); wrap.classList.add('shake');
        setTimeout(() => wrap.classList.remove('shake'), 380);
        return;
      }
      wrap.classList.add('focused');
    });
    inp.addEventListener('blur', () => wrap.classList.remove('focused'));
    inp.addEventListener('input', () => {
      if (wrap.dataset.retencao) recompute(wrap);
      bumpAutoSave();
    });
    // Hover tooltip
    wrap.addEventListener('mouseenter', () => {
      if (wrap.classList.contains('ocr-ok') || wrap.classList.contains('ocr-divergent')) {
        const tip = $('#tip');
        const r = wrap.getBoundingClientRect();
        tip.textContent = wrap.classList.contains('ocr-divergent') ? '⚠ Divergente do padrão · revise' : '📄 Origem: leitura do PDF';
        tip.style.left = (r.left + r.width / 2 - 80) + 'px';
        tip.style.top = (r.top - 32) + 'px';
        tip.classList.add('show');
      }
    });
    wrap.addEventListener('mouseleave', () => $('#tip').classList.remove('show'));
  });
}

function rebuildComposicao(t) {
  const comp = $('#composition');
  if (!comp) return;
  let html = `<div class="row bruto"><span class="k">Valor Bruto</span><span class="v">${brl(t.identif.bruto)}</span></div>`;
  if (t.retencoes.length > 0) {
    html += `<div class="sep"></div>`;
    t.retencoes.forEach(r => {
      const divCls = r.divergent ? 'divergent' : '';
      html += `<div class="row tax ${divCls}" data-retencao="${r.id}"><span class="k">${r.label} (${r.pct})</span><span class="v">- ${brl(r.value)}</span></div>`;
    });
  }
  html += `
    <div class="sep"></div>
    <div class="row"><span class="k">Descontos</span><span class="v">R$ 0,00</span></div>
    <div class="row"><span class="k">Juros / Multa</span><span class="v">R$ 0,00</span></div>`;
  comp.innerHTML = html;

  // Re-wire divergent row click
  $$('#composition .row.divergent').forEach(row => {
    row.addEventListener('click', () => $('#val-iss')?.click());
  });
}

function rebuildTitulos(t) {
  const titles = $('.titles');
  if (!titles) return;
  const totRet = t.retencoes.reduce((s, r) => s + r.value, 0);
  const liq = t.identif.bruto - totRet;

  let childrenHTML = '';
  if (t.titulos && t.titulos.length > 0) {
    childrenHTML = `<div class="title-children">` + t.titulos.map(c => `
      <div class="title-child ${c.divergent ? 'divergent' : ''}">
        <span class="kind">${c.kind}</span>
        <span class="to">${c.to}</span>
        <span class="amt">${brl(c.amt)}</span>
      </div>`).join('') + `</div>`;
  }

  titles.innerHTML = `
    <div class="title-parent">
      <span class="kind">${t.label}</span>
      <span class="name">${t.fornecedor.name}</span>
      <span class="amt" id="titulo-principal">${brl(liq)}</span>
    </div>
    ${childrenHTML}`;
}

/* Click no Tipo field → abre modal */
$('#open-tipo')?.addEventListener('click', () => {
  buildTipoGrid();
  openModal('modal-tipo');
});
