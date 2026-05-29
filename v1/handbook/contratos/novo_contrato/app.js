(function () {
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ── Mock: dados do contratado pré-selecionado ──────────── */
  const MOCK_CONTRATADO = {
    name: 'Patricia Brun Ribeiro da Frota',
    fantasia: 'Bambu Educação',
    kind: 'PJ · Fornecedor',
    cnpj: 'CNPJ 37.364.305/0001-92',
    bank: {
      banco: '077 — Banco Inter S.A.',
      ag: '0001-9',
      conta: '6433553',
      dv: '4',
      pixKind: 'CNPJ',
      pix: '37.364.305/0001-92'
    }
  };

  /* ── Selecionar contratado (mock — 1 clique) ─────────────── */
  function selecionarContratado() {
    document.body.classList.add('contratado-selected');
    $('#hero-name').innerHTML = `${MOCK_CONTRATADO.name}<span class="fantasia">· ${MOCK_CONTRATADO.fantasia}</span>`;
    $('#hero-meta').textContent = MOCK_CONTRATADO.cnpj;
    $('#hero-kind').textContent = MOCK_CONTRATADO.kind;

    // Habilita bank fields + autopopula
    $('#bank-sub').textContent = 'puxado do cadastro do contratado · pode ser ajustado';
    const b = MOCK_CONTRATADO.bank;
    enableBank();
    $('#f-banco .value').textContent = b.banco;
    $('#f-banco .value').classList.remove('placeholder');
    $('#f-ag').value = b.ag;
    $('#f-conta').value = b.conta;
    $('#f-dv').value = b.dv;
    $('#f-pix-kind .value').textContent = b.pixKind;
    $('#f-pix-kind .value').classList.remove('placeholder');
    $('#f-pix').value = b.pix;
    updateChecklist();
  }

  function trocarContratado() {
    document.body.classList.remove('contratado-selected');
    disableBank();
    updateChecklist();
  }

  function enableBank() {
    ['#f-banco', '#f-pix-kind'].forEach(sel => $(sel).classList.remove('is-disabled'));
    $$('.section:nth-of-type(2) .input.is-disabled').forEach(el => el.classList.remove('is-disabled'));
    $$('#f-ag, #f-conta, #f-dv, #f-pix').forEach(el => el.removeAttribute('disabled'));
  }
  function disableBank() {
    ['#f-banco', '#f-pix-kind'].forEach(sel => {
      const el = $(sel);
      el.classList.add('is-disabled');
      el.querySelector('.value').textContent = '—';
      el.querySelector('.value').classList.add('placeholder');
    });
    $$('#f-ag, #f-conta, #f-dv, #f-pix').forEach(el => {
      el.setAttribute('disabled', '');
      el.closest('.input').classList.add('is-disabled');
      el.value = '';
    });
    $('#bank-sub').textContent = 'selecione um contratado primeiro';
  }

  $('#select-contratado').addEventListener('click', selecionarContratado);
  $('#trocar-contratado').addEventListener('click', trocarContratado);

  /* ── Sidebar number: atualiza com o Valor Original ──────── */
  function fmtBRL(n) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  $('#f-valor').addEventListener('input', e => {
    const raw = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
    const n = parseFloat(raw) || 0;
    const sb = $('#sb-number');
    if (n === 0) {
      sb.classList.add('empty');
      sb.querySelector('.main').textContent = '0';
      sb.querySelector('.cents').textContent = ',00';
    } else {
      sb.classList.remove('empty');
      const [int, dec] = fmtBRL(n).split(',');
      sb.querySelector('.main').textContent = int;
      sb.querySelector('.cents').textContent = ',' + dec;
    }
    updateChecklist();
  });

  /* ── Sidebar vigência: espelha as datas ─────────────────── */
  function bindDate(inputId, sbId) {
    $(inputId).addEventListener('input', e => {
      const v = e.target.value.trim();
      const el = $(sbId);
      if (v) { el.textContent = v; el.classList.remove('empty'); }
      else   { el.textContent = '—'; el.classList.add('empty'); }
      updateChecklist();
    });
  }
  bindDate('#f-inicio', '#sb-inicio');
  bindDate('#f-fim', '#sb-fim');

  /* ── Selects (mock: clique cicla por valores) ───────────── */
  const SELECT_VALUES = {
    tipo: ['Fornecedor', 'Cliente'],
    modelo: ['Serviço', 'Produto', 'Misto'],
    acordo: ['Não', 'Sim'],
    programa: ['EPV — Apoio Regional', 'PFP — Formação de Professores', 'PIA — Iniciativas Aceleradas'],
    plano: ['2026 EPV 1.0 · Consultorias', '2026 EPV 2.0 · Oficinas', '2026 PFP 1.0 · Bolsas']
  };
  $$('.input.is-select[data-field]').forEach(sel => {
    const field = sel.dataset.field;
    let idx = -1;
    sel.addEventListener('click', () => {
      const values = SELECT_VALUES[field] || [];
      if (!values.length) return;
      idx = (idx + 1) % values.length;
      const val = values[idx];
      const valEl = sel.querySelector('.value');
      valEl.textContent = val;
      valEl.classList.remove('placeholder');
      updateChecklist();
    });
  });

  /* ── Objeto input ──────────────────────────────────────── */
  $('#f-objeto').addEventListener('input', updateChecklist);

  /* ── Upload mock ────────────────────────────────────────── */
  const up = $('#upload-contrato');
  up.addEventListener('click', () => {
    if (up.classList.contains('has-file')) return;
    up.classList.add('has-file');
    $('.up-title', up).textContent = 'contrato_0002_2026_assinado.pdf';
    $('.up-sub', up).textContent   = '2.1 MB · enviado agora';
    $('.up-action', up).textContent = 'trocar';
    updateChecklist();
  });

  /* ── Checklist: avalia o estado dos campos ──────────────── */
  function isFilled(sel) {
    const el = $(sel);
    if (!el) return false;
    if (el.tagName === 'INPUT') return el.value.trim().length > 0;
    const v = el.querySelector('.value');
    return v && !v.classList.contains('placeholder');
  }
  function updateChecklist() {
    const status = {
      contratado: document.body.classList.contains('contratado-selected'),
      contrato:   isFilled('[data-field="tipo"]') && isFilled('[data-field="modelo"]') && isFilled('#f-objeto'),
      valor:      isFilled('#f-valor'),
      vigencia:   isFilled('#f-inicio') && isFilled('#f-fim'),
      programa:   isFilled('[data-field="programa"]') && isFilled('[data-field="plano"]'),
      documento:  up.classList.contains('has-file')
    };
    let done = 0;
    Object.entries(status).forEach(([k, ok]) => {
      const it = $(`[data-req="${k}"]`);
      if (it) it.classList.toggle('done', ok);
      if (ok) done++;
    });
    $('#cl-done').textContent = done;
    $('#btn-salvar').disabled = done < 6;
  }

  // estado inicial
  updateChecklist();
})();
