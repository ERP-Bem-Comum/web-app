(function () {
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const modal     = $('#modal-novo-aditivo .modal');
  const backdrop  = $('#modal-novo-aditivo');
  const upload    = $('#upload-aditivo');
  const autoNum   = $('.auto-num', modal);
  const tipoCards = $$('.tipo-card', modal);
  const condRows  = $$('.cond-row', modal);
  const impTog    = $('#impacto-toggle');

  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
  }
  function closeModal(m) {
    m.classList.remove('open');
  }

  /* ── modo NOVO (limpo) ────────────────────────── */
  function setModoNovo() {
    modal.dataset.mode = 'novo';
    autoNum.textContent = 'AD 03-001/2026';
    // reset tipo cards
    tipoCards.forEach(c => c.classList.remove('active'));
    // hide all cond rows
    condRows.forEach(r => r.classList.remove('visible'));
    // clear inputs
    $$('input[data-field], textarea[data-field]', modal).forEach(el => { el.value = ''; });
    // reset impacto toggle
    $$('button', impTog).forEach((b, i) => b.classList.toggle('active', i === 0));
    // reset upload
    upload.classList.remove('has-file');
    $('.up-title', upload).textContent = 'Solte o arquivo aqui ou clique para escolher';
    $('.up-sub', upload).textContent   = 'PDF assinado · até 20MB';
    $('.up-action', upload).textContent = 'Escolher';
    // re-enable
    $$('input, textarea', modal).forEach(el => el.removeAttribute('readonly'));
  }

  /* ── modo SELADO (popula com dados da linha) ──── */
  function setModoSelado(data) {
    modal.dataset.mode = 'selado';
    autoNum.textContent = data.num || '';

    // Tipo card
    tipoCards.forEach(c => c.classList.toggle('active', c.dataset.tipo === data.tipo));
    // Cond rows
    condRows.forEach(r => r.classList.toggle('visible', r.dataset.cond === data.tipo));

    // Campos
    const setField = (name, value) => {
      const el = $(`[data-field="${name}"]`, modal);
      if (el) el.value = value || '';
    };
    setField('assinatura', data.assinatura);
    setField('inicio', data.inicio);
    setField('resumo', data.resumo);
    setField('novaDataFim', data.novaDataFim);
    setField('impactoValor', data.impactoValor);

    // Impacto toggle
    if (data.impactoTipo) {
      $$('button', impTog).forEach(b => {
        b.classList.toggle('active', b.dataset.impacto === data.impactoTipo);
      });
    }

    // Upload — preenche com arquivo existente
    if (data.fileName) {
      upload.classList.add('has-file');
      $('.up-title', upload).textContent = data.fileName;
      $('.up-sub', upload).textContent   = data.fileSize + ' · anexado';
      $('.up-action', upload).textContent = 'trocar';
    } else {
      upload.classList.remove('has-file');
    }

    // Readonly em todos os inputs/textareas
    $$('input, textarea', modal).forEach(el => el.setAttribute('readonly', ''));
  }

  /* ── Triggers ─────────────────────────────────── */
  // Abrir NOVO via [data-open]
  $$('[data-open="novo-aditivo"]').forEach(b => {
    b.addEventListener('click', () => {
      setModoNovo();
      openModal('modal-novo-aditivo');
    });
  });

  // Abrir SELADO ao clicar na linha inteira do documento
  $$('[data-doc]').forEach(row => {
    row.addEventListener('click', () => {
      try {
        const data = JSON.parse(row.dataset.doc);
        setModoSelado(data);
        openModal('modal-novo-aditivo');
      } catch (err) {
        console.error('data-doc parse error', err);
      }
    });
  });

  // Botão de download na linha — não deve abrir a modal selada
  $$('.adit-row .doc-act[title="Baixar documento"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      // mock — em produção, dispara download real
    });
  });

  /* ── Fechar handlers ──────────────────────────── */
  $$('.modal-backdrop').forEach(m => {
    m.addEventListener('mousedown', e => {
      if (e.target === m) closeModal(m);
    });
    $$('[data-close]', m).forEach(b => b.addEventListener('click', () => closeModal(m)));
  });
  // ESC fecha topmost
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const open = $$('.modal-backdrop.open').pop();
      if (open) closeModal(open);
    }
  });

  /* ── Tipo card selection ──────────────────────── */
  tipoCards.forEach(card => {
    card.addEventListener('click', () => {
      if (modal.dataset.mode === 'selado') return;
      tipoCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const tipo = card.dataset.tipo;
      condRows.forEach(r => r.classList.toggle('visible', r.dataset.cond === tipo));
    });
  });

  /* ── Impacto toggle ───────────────────────────── */
  if (impTog) {
    $$('button', impTog).forEach(b => {
      b.addEventListener('click', () => {
        if (modal.dataset.mode === 'selado') return;
        $$('button', impTog).forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      });
    });
  }

  /* ── Upload mock (sempre ativo) ───────────────── */
  upload.addEventListener('click', () => {
    if (upload.classList.contains('has-file')) return;
    upload.classList.add('has-file');
    $('.up-title', upload).textContent = 'novo_arquivo.pdf';
    $('.up-sub', upload).textContent   = '1.0 MB · enviado agora';
    $('.up-action', upload).textContent = 'trocar';
  });

  /* ── Excluir documento (selado) ────────────────── */
  const btnExcluir = $('#btn-excluir-doc');
  const motivoTA   = $('#motivo-exclusao');
  const btnConfirm = $('#btn-confirm-delete');

  if (btnExcluir) {
    btnExcluir.addEventListener('click', () => {
      if (motivoTA) motivoTA.value = '';
      openModal('modal-confirm-delete');
    });
  }
  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      // Validação leve: motivo é obrigatório nesta confirmação
      if (!motivoTA.value.trim()) {
        motivoTA.focus();
        motivoTA.style.borderColor = 'var(--red)';
        motivoTA.style.boxShadow   = '0 0 0 3px rgba(229,77,64,0.15)';
        return;
      }
      // Fechar ambos os modais (mock — em produção, dispararia o evento de exclusão)
      closeModal($('#modal-confirm-delete'));
      closeModal(backdrop);
    });
    motivoTA.addEventListener('input', () => {
      motivoTA.style.borderColor = '';
      motivoTA.style.boxShadow   = '';
    });
  }
})();
