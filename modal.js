// =============================================================================
//  modal.js — lightweight modal + confirm helper. Global `Modal`.
// =============================================================================
window.Modal = (function () {
  let back = null;
  function ensure() {
    if (back) return back;
    back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal"><div class="modal__head"><h3></h3>
      <button class="icon-btn" data-close style="width:32px;height:32px"><svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <div class="modal__body"></div><div class="modal__foot"></div></div>`;
    document.body.appendChild(back);
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    return back;
  }
  function open({ title = '', body = '', okText = 'OK', cancelText = 'Cancel', onOk = null, hideCancel = false, wide = false }) {
    const b = ensure();
    b.querySelector('.modal').classList.toggle('modal--lg', !!wide);
    b.querySelector('.modal__head h3').textContent = title;
    b.querySelector('.modal__body').innerHTML = body;
    const foot = b.querySelector('.modal__foot');
    foot.innerHTML = '';
    if (!hideCancel) {
      const c = document.createElement('button'); c.className = 'btn btn--ghost'; c.textContent = cancelText;
      c.onclick = close; foot.appendChild(c);
    }
    const ok = document.createElement('button'); ok.className = 'btn btn--primary'; ok.textContent = okText;
    ok.onclick = () => { const r = onOk ? onOk() : true; if (r !== false) close(); };
    foot.appendChild(ok);
    requestAnimationFrame(() => b.classList.add('show'));
    return b;
  }
  function close() { back && back.classList.remove('show'); }
  function confirm(title, msg, onYes, danger = false) {
    open({ title, body: `<p class="muted">${msg}</p>`, okText: danger ? 'Delete' : 'Confirm',
      onOk: () => { onYes && onYes(); return true; } });
    if (danger) { const ok = back.querySelector('.modal__foot .btn--primary'); ok.className = 'btn btn--danger'; }
  }
  return { open, close, confirm };
})();
