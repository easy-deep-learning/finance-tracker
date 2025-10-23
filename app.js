// Finance Tracker - Client-side app with localStorage persistence
(function(){
  'use strict';

  // ---------------------- Storage & State ----------------------
  const STORAGE_KEY = 'finance-tracker/v1';

  /** @typedef {{
   *  id:string; type:'income'|'expense'; category:string; amount:number; date:string; note?:string;
   * }} Transaction
   */

  /** @typedef {{ id:string; category:string; amount:number }} Budget */

  /** @typedef {{ id:string; direction:'lent'|'borrowed'; person:string; principal:number; date:string; dueDate?:string; note?:string; payments: {id:string; date:string; amount:number}[]; closed?:boolean }} Debt */

  /** @typedef {{ id:string; type:'income'|'expense'; category:string; amount:number; frequency:'monthly'|'weekly'; startDate:string; endDate?:string }} Recurring */

  /** @typedef {{ payday:number; creditLimit:number; currency:string }} Settings */

  /** @type {{ transactions:Transaction[]; budgets:Budget[]; debts:Debt[]; recurring:Recurring[]; settings:Settings }} */
  const state = {
    transactions: [],
    budgets: [],
    debts: [],
    recurring: [],
    settings: { payday: 1, creditLimit: 0, currency: '₽' }
  };

  function save(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch(e){ console.error('Save failed', e); }
  }

  function load(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return;
      const data = JSON.parse(raw);
      state.transactions = Array.isArray(data.transactions) ? data.transactions : [];
      state.budgets = Array.isArray(data.budgets) ? data.budgets : [];
      state.debts = Array.isArray(data.debts) ? data.debts : [];
      state.recurring = Array.isArray(data.recurring) ? data.recurring : [];
      const s = data.settings || {};
      state.settings = {
        payday: clamp(toInt(s.payday, 1), 1, 28),
        creditLimit: toNum(s.creditLimit, 0),
        currency: typeof s.currency === 'string' && s.currency.trim() ? s.currency.trim() : '₽'
      };
    } catch(e){ console.error('Load failed', e); }
  }

  // ---------------------- Utils ----------------------
  function generateId(prefix='id'){ return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`; }
  function toNum(v, def=0){ const n = Number(v); return Number.isFinite(n) ? n : def; }
  function toInt(v, def=0){ const n = parseInt(v, 10); return Number.isFinite(n) ? n : def; }
  function clamp(n, min, max){ return Math.min(Math.max(n, min), max); }
  function isoToday(){ return new Date().toISOString().slice(0,10); }
  function fmtCurrency(n){ try { return new Intl.NumberFormat(undefined, { style:'currency', currency: guessCurrencyCode(state.settings.currency), maximumFractionDigits:2 }).format(n); } catch{ return `${n.toLocaleString()} ${state.settings.currency}`; } }
  function fmtNumber(n){ return n.toLocaleString(undefined, { maximumFractionDigits: 2 }); }
  function guessCurrencyCode(symbol){
    // Very small mapping. Falls back to symbol.
    const map = { '₽':'RUB', '₸':'KZT', '$':'USD', '€':'EUR', '£':'GBP', '₴':'UAH', '¥':'JPY' };
    return map[symbol] || (symbol.length === 3 ? symbol : 'RUB');
  }

  function parseMonthInput(val){ // yyyy-mm -> {y,m}
    if(!val) return null;
    const [y,m] = val.split('-').map(Number);
    if(!y||!m) return null; return { y, m };
  }

  // Period boundaries based on payday
  function getPeriodFor(date, payday){
    // date: Date
    // payday in [1..28]
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = payday;
    // Determine start of current period
    const startCandidate = new Date(d.getFullYear(), d.getMonth(), day);
    let start;
    if(d >= startCandidate){
      start = startCandidate;
    } else {
      // previous month
      start = new Date(d.getFullYear(), d.getMonth()-1, day);
    }
    const end = new Date(start.getFullYear(), start.getMonth()+1, start.getDate()); // next payday (exclusive)
    return { start, end };
  }
  function getCurrentPeriod(){ return getPeriodFor(new Date(), state.settings.payday); }

  function isWithin(dateStr, start, end){
    const d = new Date(dateStr);
    return d >= start && d < end;
  }

  // ---------------------- Derived Data ----------------------
  function computePeriodTotals(start, end){
    let income = 0, expense = 0;
    for(const t of state.transactions){
      if(!isWithin(t.date, start, end)) continue;
      if(t.type === 'income') income += t.amount; else expense += t.amount;
    }
    return { income, expense, balance: income - expense };
  }

  function aggregateExpensesByCategory(start, end){
    const map = new Map();
    for(const t of state.transactions){
      if(t.type !== 'expense') continue;
      if(!isWithin(t.date, start, end)) continue;
      const prev = map.get(t.category) || 0;
      map.set(t.category, prev + t.amount);
    }
    return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]);
  }

  function computeBudgetsProgress(start, end){
    // Returns [{category, plan, fact}]
    const results = [];
    for(const b of state.budgets){
      let spent = 0;
      for(const t of state.transactions){
        if(t.type !== 'expense') continue;
        if(t.category !== b.category) continue;
        if(!isWithin(t.date, start, end)) continue;
        spent += t.amount;
      }
      results.push({ category: b.category, plan: b.amount, fact: spent });
    }
    return results.sort((a,b)=> a.category.localeCompare(b.category));
  }

  function daysLeftInPeriod(start, end){
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msPerDay = 86400000;
    const remaining = Math.max(0, Math.ceil((end - today) / msPerDay));
    const passed = Math.max(0, Math.ceil((today - start) / msPerDay));
    return { remaining, passed };
  }

  // ---------------------- Rendering ----------------------
  let categoryChart;

  function renderDashboard(){
    const period = getCurrentPeriod();
    const totals = computePeriodTotals(period.start, period.end);
    const { remaining } = daysLeftInPeriod(period.start, period.end);
    const available = totals.income - totals.expense + state.settings.creditLimit;
    const daily = remaining > 0 ? available / remaining : available;

    byId('dash-income').textContent = fmtCurrency(totals.income);
    byId('dash-expense').textContent = fmtCurrency(totals.expense);
    byId('dash-balance').textContent = fmtCurrency(totals.balance);
    byId('dash-daily').textContent = fmtCurrency(daily);
    byId('dash-days-left').textContent = `Осталось дней: ${remaining}`;

    // Chart
    const data = aggregateExpensesByCategory(period.start, period.end);
    const labels = data.map(d=>d[0]);
    const values = data.map(d=>d[1]);

    const ctx = byId('categoryChart').getContext('2d');
    if(categoryChart){ categoryChart.destroy(); }
    categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Расходы',
          data: values,
          borderRadius: 6,
          backgroundColor: 'rgba(108, 140, 255, 0.6)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { ticks: { callback: (v)=>fmtNumber(v) }, beginAtZero: true }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  function renderCategorySuggestions(){
    const set = new Set(state.transactions.map(t=>t.category));
    // Add some defaults
    ['Продукты', 'Транспорт', 'Кафе', 'Коммуналка', 'Связь', 'Здоровье', 'Подписки', 'Одежда', 'Подарки', 'Зарплата', 'Фриланс', 'Кэшбэк']
      .forEach(c=>set.add(c));
    const dl = byId('category-suggestions');
    dl.innerHTML = '';
    for(const c of Array.from(set).sort((a,b)=>a.localeCompare(b))){
      const opt = document.createElement('option'); opt.value = c; dl.appendChild(opt);
    }
  }

  function renderEntries(){
    const tbody = byId('entries-table').querySelector('tbody');
    tbody.innerHTML = '';

    const typeFilter = byId('entries-type-filter').value;
    const monthVal = byId('entries-month-filter').value;
    const period = monthVal ? monthToPeriod(parseMonthInput(monthVal)) : getCurrentPeriod();

    const filtered = state.transactions
      .filter(t => (typeFilter === 'all' || t.type === typeFilter))
      .filter(t => isWithin(t.date, period.start, period.end))
      .sort((a,b)=> new Date(b.date) - new Date(a.date));

    for(const t of filtered){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(t.date)}</td>
        <td><span class="tag">${t.type === 'income' ? 'Доход' : 'Расход'}</span></td>
        <td>${escapeHtml(t.category)}</td>
        <td>${fmtCurrency(t.amount)}</td>
        <td>${escapeHtml(t.note || '')}</td>
        <td style="text-align:right">
          <button class="btn btn-secondary" data-action="delete" data-id="${t.id}">Удалить</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  function renderBudgets(){
    const wrap = byId('budgets-list');
    wrap.innerHTML = '';
    const period = getCurrentPeriod();
    const rows = computeBudgetsProgress(period.start, period.end);

    if(rows.length === 0){
      wrap.innerHTML = '<div class="muted">Бюджеты не заданы</div>';
      return;
    }

    for(const row of rows){
      const percent = row.plan > 0 ? Math.min(100, Math.round(100 * row.fact / row.plan)) : 0;
      const item = document.createElement('div');
      item.className = 'budget-item';
      item.innerHTML = `
        <div class="budget-head">
          <strong>${escapeHtml(row.category)}</strong>
          <div>
            <span class="tag">План: ${fmtCurrency(row.plan)}</span>
            <span class="tag">Факт: ${fmtCurrency(row.fact)}</span>
          </div>
        </div>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
          <div style="width:${percent}%"></div>
        </div>
      `;
      wrap.appendChild(item);
    }
  }

  function renderDebts(){
    const wrap = byId('debts-list');
    wrap.innerHTML = '';

    if(state.debts.length === 0){
      wrap.innerHTML = '<div class="muted">Долгов нет</div>';
      return;
    }

    for(const d of state.debts.sort((a,b)=> new Date(a.date) - new Date(b.date))){
      const paid = d.payments.reduce((s,p)=>s+p.amount,0);
      const outstanding = Math.max(0, d.direction === 'borrowed' ? d.principal - paid : d.principal - paid);
      const closed = !!d.closed || outstanding <= 0;

      const div = document.createElement('div');
      div.className = 'debt-item';
      div.innerHTML = `
        <div class="debt-head">
          <strong>${d.direction === 'borrowed' ? 'Я должен(на)' : 'Мне должны'}</strong>
          <span> • ${escapeHtml(d.person)}</span>
        </div>
        <div class="muted">от ${escapeHtml(d.date)} ${d.dueDate ? 'до ' + escapeHtml(d.dueDate) : ''}</div>
        <div style="margin:8px 0">
          <span class="tag">Сумма: ${fmtCurrency(d.principal)}</span>
          <span class="tag">Оплачено: ${fmtCurrency(paid)}</span>
          <span class="tag">Остаток: ${fmtCurrency(outstanding)}</span>
          ${closed ? '<span class="tag" style="border-color:#2c7; color:#6f8">Закрыт</span>' : ''}
        </div>
        <div class="debt-actions">
          <input type="number" step="0.01" min="0" placeholder="Платёж" data-pay-id="${d.id}" ${closed?'disabled':''} />
          <button class="btn" data-action="pay" data-id="${d.id}" ${closed?'disabled':''}>Добавить платёж</button>
          <button class="btn btn-secondary" data-action="close" data-id="${d.id}">${closed?'Открыть':'Закрыть'}</button>
          <button class="btn btn-secondary" data-action="delete-debt" data-id="${d.id}">Удалить</button>
        </div>
        ${d.note ? `<div class="muted" style="margin-top:6px">${escapeHtml(d.note)}</div>`: ''}
      `;
      wrap.appendChild(div);
    }
  }

  function renderRecurring(){
    const wrap = byId('recurring-list');
    wrap.innerHTML = '';
    if(state.recurring.length === 0){
      wrap.innerHTML = '<div class="muted">Повторяющихся операций нет</div>';
      return;
    }
    for(const r of state.recurring){
      const div = document.createElement('div');
      div.className = 'rec-item';
      const next = nextOccurrence(r, new Date());
      div.innerHTML = `
        <div class="rec-head"><strong>${r.type === 'expense' ? 'Расход' : 'Доход'}</strong> • ${escapeHtml(r.category)}</div>
        <div class="muted">Сумма: ${fmtCurrency(r.amount)} • Следующая дата: ${next ? fmtDate(next) : '—'}</div>
        <div class="rec-actions">
          <button class="btn" data-action="rec-post" data-id="${r.id}">Добавить за текущий период</button>
          <button class="btn btn-secondary" data-action="rec-delete" data-id="${r.id}">Удалить</button>
        </div>
      `;
      wrap.appendChild(div);
    }
  }

  function renderSettings(){
    byId('set-payday').value = String(state.settings.payday);
    byId('set-credit').value = String(state.settings.creditLimit);
    byId('set-currency').value = state.settings.currency;
  }

  function renderAll(){
    renderCategorySuggestions();
    renderDashboard();
    renderEntries();
    renderBudgets();
    renderDebts();
    renderRecurring();
    renderSettings();
  }

  // ---------------------- Helpers (DOM) ----------------------
  function byId(id){ return document.getElementById(id); }
  function on(el, ev, selOrHandler, handler){
    if(typeof selOrHandler === 'function'){
      el.addEventListener(ev, selOrHandler);
      return;
    }
    el.addEventListener(ev, e => {
      const t = e.target;
      const m = t.closest(selOrHandler);
      if(m) handler({...e, currentTarget: m, originalEvent: e});
    });
  }
  function escapeHtml(str){ return String(str).replace(/[&<>"]\/g, s=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[s])); }
  function fmtDate(d){ return new Date(d).toISOString().slice(0,10); }
  function monthToPeriod(m){
    // m = {y, m}; returns [start,end) using payday day-of-month, adjusted to include month selection
    const day = state.settings.payday;
    const start = new Date(m.y, m.m-1, day);
    const end = new Date(m.y, m.m, day);
    return { start, end };
  }

  // ---------------------- Events & Actions ----------------------
  function initNav(){
    const buttons = Array.from(document.querySelectorAll('.nav .nav-link'));
    buttons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const section = btn.dataset.section;
        buttons.forEach(b=>b.classList.toggle('active', b===btn));
        document.querySelectorAll('main .section').forEach(s=> s.classList.toggle('visible', s.id === section));
        // Re-render charts when dashboard becomes visible
        if(section === 'dashboard') setTimeout(renderDashboard, 0);
      });
    });
  }

  function initForms(){
    // Entry form
    const entryForm = byId('entry-form');
    entryForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(entryForm);
      /** @type {Transaction} */
      const tx = {
        id: generateId('tx'),
        type: fd.get('type') === 'income' ? 'income' : 'expense',
        category: String(fd.get('category')||'').trim(),
        amount: toNum(fd.get('amount')), 
        date: String(fd.get('date')||isoToday()),
        note: String(fd.get('note')||'').trim()
      };
      if(!tx.category || tx.amount <= 0){ return; }
      state.transactions.push(tx);
      save(); renderAll(); entryForm.reset();
      byId('entry-date').value = isoToday();
    });
    byId('entry-date').value = isoToday();

    on(byId('entries-table'), 'click', 'button[data-action="delete"]', (e)=>{
      const id = e.currentTarget.getAttribute('data-id');
      const idx = state.transactions.findIndex(t=>t.id===id);
      if(idx>=0){ state.transactions.splice(idx,1); save(); renderAll(); }
    });

    byId('entries-reset-filters').addEventListener('click', ()=>{
      byId('entries-type-filter').value = 'all';
      byId('entries-month-filter').value = '';
      renderEntries(); renderDashboard();
    });

    byId('entries-type-filter').addEventListener('change', ()=>{ renderEntries(); });
    byId('entries-month-filter').addEventListener('change', ()=>{ renderEntries(); renderDashboard(); });

    // Budget form
    const budgetForm = byId('budget-form');
    budgetForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const category = String(byId('budget-category').value||'').trim();
      const amount = toNum(byId('budget-amount').value);
      if(!category || amount <= 0) return;
      const existing = state.budgets.find(b=>b.category.toLowerCase()===category.toLowerCase());
      if(existing){ existing.amount = amount; }
      else { state.budgets.push({ id: generateId('bud'), category, amount }); }
      save(); renderBudgets();
      budgetForm.reset();
    });

    // Debts form
    const debtForm = byId('debt-form');
    debtForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      /** @type {Debt} */
      const debt = {
        id: generateId('debt'),
        direction: /** @type any */(byId('debt-direction').value) === 'lent' ? 'lent' : 'borrowed',
        person: String(byId('debt-person').value||'').trim(),
        principal: toNum(byId('debt-amount').value),
        date: String(byId('debt-date').value||isoToday()),
        dueDate: String(byId('debt-due').value||'') || undefined,
        note: String(byId('debt-note').value||'').trim() || undefined,
        payments: []
      };
      if(!debt.person || debt.principal <= 0) return;
      state.debts.push(debt); save(); renderDebts(); debtForm.reset(); byId('debt-date').value = isoToday();
    });
    byId('debt-date').value = isoToday();

    on(byId('debts-list'), 'click', 'button[data-action]', (e)=>{
      const action = e.currentTarget.getAttribute('data-action');
      const id = e.currentTarget.getAttribute('data-id');
      const debt = state.debts.find(d=>d.id===id);
      if(!debt) return;
      if(action === 'pay'){
        const input = document.querySelector(`input[data-pay-id="${id}"]`);
        const amount = toNum(input && input.value);
        if(amount>0){
          debt.payments.push({ id: generateId('pay'), date: isoToday(), amount });
          save(); renderDebts();
        }
      } else if(action === 'close'){
        debt.closed = !debt.closed; save(); renderDebts();
      } else if(action === 'delete-debt'){
        const idx = state.debts.findIndex(d=>d.id===id);
        if(idx>=0){ state.debts.splice(idx,1); save(); renderDebts(); }
      }
    });

    // Recurring form
    const recForm = byId('recurring-form');
    recForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      /** @type {Recurring} */
      const r = {
        id: generateId('rec'),
        type: /** @type any */(byId('rec-type').value) === 'income' ? 'income' : 'expense',
        category: String(byId('rec-category').value||'').trim(),
        amount: toNum(byId('rec-amount').value),
        frequency: /** @type any */(byId('rec-frequency').value) === 'weekly' ? 'weekly' : 'monthly',
        startDate: String(byId('rec-start').value||isoToday()),
        endDate: String(byId('rec-end').value||'') || undefined
      };
      if(!r.category || r.amount <= 0) return;
      state.recurring.push(r); save(); renderRecurring(); recForm.reset(); byId('rec-start').value = isoToday();
    });
    byId('rec-start').value = isoToday();

    on(byId('recurring-list'), 'click', 'button[data-action]', (e)=>{
      const action = e.currentTarget.getAttribute('data-action');
      const id = e.currentTarget.getAttribute('data-id');
      const r = state.recurring.find(x=>x.id===id);
      if(!r) return;
      if(action === 'rec-post'){
        // Add a transaction dated to next occurrence within current period
        const occ = nextOccurrence(r, new Date());
        const dateStr = fmtDate(occ || new Date());
        state.transactions.push({ id: generateId('tx'), type: r.type, category: r.category, amount: r.amount, date: dateStr, note: 'Повторение' });
        save(); renderAll();
      } else if(action === 'rec-delete'){
        const idx = state.recurring.findIndex(x=>x.id===id);
        if(idx>=0){ state.recurring.splice(idx,1); save(); renderRecurring(); }
      }
    });

    // Dashboard filters
    byId('dash-reset-month').addEventListener('click', ()=>{
      byId('dash-month-filter').value = '';
      renderDashboard();
    });
    byId('dash-month-filter').addEventListener('change', ()=>{
      // When user selects a month, adjust chart to that period
      const val = byId('dash-month-filter').value;
      const period = val ? monthToPeriod(parseMonthInput(val)) : getCurrentPeriod();
      const data = aggregateExpensesByCategory(period.start, period.end);
      const labels = data.map(d=>d[0]);
      const values = data.map(d=>d[1]);
      if(categoryChart){
        categoryChart.data.labels = labels;
        categoryChart.data.datasets[0].data = values;
        categoryChart.update();
      } else {
        renderDashboard();
      }
    });

    // Settings
    const settingsForm = byId('settings-form');
    settingsForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      state.settings.payday = clamp(toInt(byId('set-payday').value, 1), 1, 28);
      state.settings.creditLimit = toNum(byId('set-credit').value, 0);
      const cur = String(byId('set-currency').value||'').trim();
      state.settings.currency = cur || state.settings.currency;
      save(); renderAll();
    });

    // Data actions
    byId('btn-export').addEventListener('click', ()=>{
      const json = JSON.stringify(state, null, 2);
      byId('export-output').value = json;
      download('finance-tracker-data.json', json);
    });

    byId('import-file').addEventListener('change', async (e)=>{
      const file = e.target.files && e.target.files[0]; if(!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if(!data || typeof data !== 'object') throw new Error('Bad JSON');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        load(); renderAll(); alert('Импорт выполнен');
      } catch(err){ alert('Ошибка импорта: ' + err.message); }
      finally { e.target.value = ''; }
    });

    byId('btn-reset').addEventListener('click', ()=>{
      if(confirm('Точно удалить все данные?')){
        localStorage.removeItem(STORAGE_KEY);
        state.transactions = []; state.budgets = []; state.debts = []; state.recurring = []; state.settings = { payday: 1, creditLimit: 0, currency: '₽' };
        save(); renderAll();
      }
    });
  }

  function nextOccurrence(r, now){
    const start = new Date(r.startDate);
    const end = r.endDate ? new Date(r.endDate) : null;
    if(end && now > end) return null;
    if(r.frequency === 'weekly'){
      // advance weeks until >= now
      const d = new Date(start);
      while(d < now){ d.setDate(d.getDate() + 7); }
      if(end && d > end) return null;
      return d;
    } else {
      // monthly
      const d = new Date(start);
      while(d < now){ d.setMonth(d.getMonth() + 1); }
      if(end && d > end) return null;
      return d;
    }
  }

  function download(filename, content){
    const blob = new Blob([content], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  // ---------------------- Bootstrap ----------------------
  function main(){
    load();
    initNav();
    initForms();
    renderAll();
  }
  document.addEventListener('DOMContentLoaded', main);
})();
