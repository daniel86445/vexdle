(function () {
  const ITEMS = window.VEX_ITEMS;
  const COMBOS = window.VEX_COMBOS;
  const XP = window.VEX_COMBO_XP;
  const TIERS = window.VEX_TIERS;
  const BY_ID = window.VEX_BY_ID;
  const buildCtx = window.VEX_buildCtx;
  const comboXp = c => (typeof c.xp === 'number' ? c.xp : XP[c.id]);

  const EMPTY = ITEMS.find(i => i.cat === 'empty');
  const POOL = ITEMS.filter(i => i.cat !== 'empty').concat([EMPTY, EMPTY, EMPTY]); // empty is 3x as likely
  const LAUNCH = '2026-11-19';
  const STORE = 'vexdle:v1';
  const params = new URLSearchParams(location.search);
  const DEBUG = params.has('debug'); // unlimited rolls, nothing saved

  // ---------- day (resets at midnight Eastern) ----------
  const dayKey = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const dayNum = k => Math.round((Date.parse(k) - Date.parse(LAUNCH)) / 864e5) + 1;
  const TODAY = dayKey();

  // ---------- storage ----------
  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function save(s) { if (DEBUG) return; try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { } }
  const state = Object.assign({ rolls: {}, found: {} }, load());

  // ---------- rolling ----------
  function rnd(n) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  const rollSlots = () => Array.from({ length: 6 }, () => POOL[rnd(POOL.length)]);
  function score(slots) {
    const ctx = buildCtx(slots);
    const hits = COMBOS.filter(c => c.test(ctx)).map(c => ({ c, xp: comboXp(c) })).sort((a, b) => b.xp - a.xp);
    const itemXp = slots.reduce((a, i) => a + i.xp, 0);
    const cXp = hits.reduce((a, h) => a + h.xp, 0);
    const total = itemXp + cXp;
    let tier = 0;
    TIERS.forEach((t, k) => { if (t.min == null || total >= t.min) tier = k; });
    return { hits, itemXp, comboXp: cXp, total, tier };
  }

  // ---------- rendering ----------
  const $ = s => document.querySelector(s);
  const money = v => v == null ? 'price n/a' : v === 0 ? 'free' : '$' + (v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(2));
  const lbs = v => v == null ? '' : v === 0 ? '' : (v < 0.01 ? '<0.01' : v < 10 ? v.toFixed(2) : v.toFixed(1)) + ' lb';
  const CAT_LABEL = { structure: 'Structure', motion: 'Motion', hardware: 'Hardware', electronics: 'Electronics', pneumatics: 'Pneumatics', tools: 'Tools', kit: 'Kit', field: 'Field', manual: 'Manual', element: 'Game element', meme: 'Meme', empty: 'Empty' };

  function slotHTML(item, k, cls = '') {
    if (!item) return `<div class="slot placeholder ${cls}"><span class="num">${k + 1}</span><div class="imgwrap"></div><div class="body"><div class="name muted">?</div></div></div>`;
    if (item.cat === 'empty') return `<div class="slot empty ${cls}"><span class="num">${k + 1}</span><div class="imgwrap"></div><div class="body"><span class="chip">Empty</span><div class="name">Empty slot</div><div class="meta"><span class="xp neg">${item.xp} XP</span></div></div></div>`;
    const yt = item.img && item.img.includes('youtube');
    const fx = item.fx ? ` fx-${item.fx}` : '';
    const mood = item.xp < 0 ? ' bad' : item.xp >= 60 ? ' great' : '';
    let stamp = '';
    if (item.fx === 'manual') stamp = `<span class="stamp manual">GAME MANUAL</span>`;
    if (item.fx === 'manual-bad') stamp = `<span class="stamp bad">v0.1</span><span class="stamp manual">GAME MANUAL</span>`;
    if (item.sub === 'game-field') stamp = `<span class="stamp label">${item.unit}</span>`;
    if (item.pack) stamp += `<span class="stamp label">${item.pack}-pack</span>`;
    if (item.fx === 'white') stamp += `<span class="stamp label">WHITE</span>`;
    if (item.fx === 'black') stamp += `<span class="stamp label">BLACK</span>`;
    return `<div class="slot ${cls}${fx}${mood}">
      <span class="num">${k + 1}</span>
      <div class="imgwrap${yt ? ' yt' : ''}">${stamp}<img src="${item.img}" alt="${item.name.replace(/"/g, '&quot;')}" referrerpolicy="no-referrer" loading="eager" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'fallback',textContent:'${CAT_LABEL[item.cat]}'}))"></div>
      <div class="body">
        <span class="chip ${item.cat}">${CAT_LABEL[item.cat] || item.cat}</span>
        <div class="name">${item.name}</div>
        <div class="meta"><span class="xp${item.xp < 0 ? ' neg' : ''}">${item.xp > 0 ? '+' : ''}${item.xp} XP</span><span>${money(item.price)}</span><span>${lbs(item.weight)}</span></div>
      </div></div>`;
  }
  const renderSlots = (slots, cls) => { $('#slots').innerHTML = Array.from({ length: 6 }, (_, k) => slotHTML(slots && slots[k], k, cls)).join(''); };

  function comboHTML(c, xp, opts = {}) {
    return `<li class="combo${xp < 0 ? ' neg' : ''}"><span class="cn">${c.name}${opts.isNew ? '<span class="new">NEW</span>' : ''}</span><span class="cx">${xp > 0 ? '+' : ''}${xp}</span><span class="cd">${c.desc}</span>${opts.times ? `<span class="times">hit ${opts.times}×</span>` : ''}</li>`;
  }

  function renderResult(slots, res, newIds = new Set()) {
    $('#result').classList.remove('hidden');
    $('#awardName').textContent = TIERS[res.tier].name;
    $('#awardLadder').innerHTML = TIERS.map((t, k) => `<span class="${k < res.tier ? 'on' : k === res.tier ? 'cur' : ''}" title="${t.name}"></span>`).join('');
    $('#totalXp').textContent = res.total.toLocaleString();
    $('#itemXp').textContent = res.itemXp;
    $('#comboXp').textContent = res.comboXp.toLocaleString();
    $('#comboCount').textContent = res.hits.length;
    $('#comboList').innerHTML = res.hits.length ? res.hits.map(h => comboHTML(h.c, h.xp, { isNew: newIds.has(h.c.id) })).join('') : '<li class="muted">No combos this time.</li>';
    $('#shareBtn').onclick = () => share(slots, res);
  }

  function renderCollection() {
    const found = Object.keys(state.found);
    $('#foundCount').textContent = found.length;
    $('#collectionNote').textContent = found.length ? `${found.length} of ${COMBOS.length} combos found. You only see a combo after you've hit it.` : `You haven't found any of the ${COMBOS.length} combos yet. Roll to start.`;
    const list = COMBOS.filter(c => state.found[c.id]).sort((a, b) => comboXp(b) - comboXp(a));
    $('#collectionList').innerHTML = list.map(c => comboHTML(c, comboXp(c), { times: state.found[c.id] })).join('');
    $('#guestXp').textContent = Object.values(state.rolls).reduce((a, r) => a + (r.total || 0), 0).toLocaleString();
  }

  const EMOJI = { structure: '⬜', motion: '⚙️', hardware: '🔩', electronics: '🔌', pneumatics: '💨', tools: '🔧', kit: '📦', field: '🟩', manual: '📘', element: '🟠', meme: '💀', empty: '⬛' };
  function share(slots, res) {
    const row = slots.map(i => i.id === 'override-game-manual-v0-1' ? '🚫' : EMOJI[i.cat]).join('');
    const best = res.hits[0] ? `\nBest combo: ${res.hits[0].c.name} (+${res.hits[0].xp})` : '';
    const text = `VEXdle #${dayNum(TODAY)} · ${TIERS[res.tier].name}\n${res.total.toLocaleString()} XP · ${res.hits.length} combos\n${row}${best}\n${location.origin}${location.pathname}`;
    const done = () => { const t = $('#shareToast'); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => prompt('Copy your result:', text)); else prompt('Copy your result:', text);
  }

  // ---------- roll animation ----------
  function preload(items) { return Promise.all(items.filter(i => i.img).map(i => new Promise(r => { const im = new Image(); im.referrerPolicy = 'no-referrer'; im.onload = im.onerror = r; im.src = i.img; setTimeout(r, 2500); }))); }
  async function animateRoll(final) {
    const btn = $('#rollBtn'); btn.disabled = true; btn.textContent = 'Rolling…';
    await preload(final);
    renderSlots(null);
    const slotsEl = () => [...document.querySelectorAll('.slot')];
    const locked = new Array(6).fill(false);
    const start = performance.now();
    await new Promise(resolve => {
      const tick = () => {
        const t = performance.now() - start;
        slotsEl().forEach((el, k) => {
          if (locked[k]) return;
          const stopAt = 700 + k * 380;
          const html = t >= stopAt ? slotHTML(final[k], k, 'locked') : slotHTML(POOL[rnd(POOL.length)], k, 'spinning');
          if (t >= stopAt) locked[k] = true;
          el.outerHTML = html;
        });
        if (locked.every(Boolean)) resolve(); else setTimeout(tick, 85);
      };
      tick();
    });
  }

  async function doRoll() {
    const slots = rollSlots();
    await animateRoll(slots);
    const res = score(slots);
    const newIds = new Set(res.hits.filter(h => !state.found[h.c.id]).map(h => h.c.id));
    res.hits.forEach(h => { state.found[h.c.id] = (state.found[h.c.id] || 0) + 1; });
    if (!DEBUG) state.rolls[TODAY] = { ids: slots.map(s => s.id), total: res.total, tier: res.tier };
    save(state);
    renderResult(slots, res, newIds);
    renderCollection();
    updateButton();
  }

  function updateButton() {
    const btn = $('#rollBtn');
    if (DEBUG) { btn.disabled = false; btn.textContent = 'Roll again (debug)'; $('#rollNote').textContent = 'Debug mode: unlimited rolls, nothing is saved.'; return; }
    if (state.rolls[TODAY]) { btn.disabled = true; btn.textContent = 'Rolled for today'; tickCountdown(); }
    else { btn.disabled = false; btn.textContent = "Roll today's 6"; }
  }
  function tickCountdown() {
    const now = new Date();
    const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const next = new Date(et); next.setHours(24, 0, 0, 0);
    const ms = next - et; const h = Math.floor(ms / 36e5), m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    $('#rollNote').textContent = `Next roll in ${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    if (dayKey() !== TODAY) location.reload(); else setTimeout(tickCountdown, 1000);
  }

  // ---------- nav ----------
  document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(x => x.classList.toggle('active', x === b));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + b.dataset.view));
  }));

  // ---------- init ----------
  $('#dayLabel').textContent = `Day #${dayNum(TODAY)}`;
  $('#poolSize').textContent = (POOL.length - 3).toLocaleString();
  $('#comboTotal').textContent = COMBOS.length;
  $('#ladderList').innerHTML = TIERS.map(t => `<li>${t.name}<span>${t.min == null ? 'lowest scores' : t.min.toLocaleString() + '+ XP'}</span></li>`).join('') + '<li>Worlds Excellence<span>the day\'s #1 roll on the leaderboard</span></li>';
  $('#rollBtn').addEventListener('click', doRoll);
  const today = !DEBUG && state.rolls[TODAY];
  if (today) {
    const slots = today.ids.map(id => BY_ID[id] || EMPTY);
    renderSlots(slots);
    renderResult(slots, score(slots));
  } else renderSlots(null);
  renderCollection();
  updateButton();

  // test hook for screenshots: ?show=id,id,id,id,id,id renders a fixed roll without saving
  if (params.get('show')) {
    const slots = params.get('show').split(',').map(id => BY_ID[id] || EMPTY);
    renderSlots(slots); renderResult(slots, score(slots));
  }
})();
