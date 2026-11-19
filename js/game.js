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
  const DEBUG = params.has('debug'); // unlimited fast rolls, nothing saved
  const TEST = params.has('test');   // unlimited rolls with the full daily animation, daily roll not used up
  const UNLIMITED = DEBUG || TEST;

  // ---------- day (resets at midnight Eastern) ----------
  const dayKey = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const dayNum = k => Math.round((Date.parse(k) - Date.parse(LAUNCH)) / 864e5) + 1;
  const TODAY = dayKey();

  // ---------- storage ----------
  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function save(s) { if (DEBUG) return; try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { } }
  const state = Object.assign({ rolls: {}, found: {}, examples: {} }, load());

  // ---------- rolling ----------
  function rnd(n) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  const rollSlots = () => Array.from({ length: 6 }, () => POOL[rnd(POOL.length)]);
  function score(slots) {
    const ctx = buildCtx(slots);
    const hits = COMBOS.filter(c => c.test(ctx)).map(c => ({ c, xp: comboXp(c) })).sort((a, b) => a.xp - b.xp); // worst -> best
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
    const mood = item.xp < 0 ? ' bad' : item.xp >= 120 ? ' great' : '';
    let stamp = '';
    if (item.fx === 'manual') stamp = `<span class="stamp manual">GAME MANUAL</span>`;
    if (item.fx === 'manual-bad') stamp = `<span class="stamp bad">v0.1</span><span class="stamp manual">GAME MANUAL</span>`;
    if (item.sub === 'game-field') stamp = `<span class="stamp label">${item.unit}</span>`;
    if (item.pack) stamp += `<span class="stamp label">${item.pack}-pack</span>`;
    if (item.fx === 'white') stamp += `<span class="stamp label">WHITE</span>`;
    if (item.fx === 'black') stamp += `<span class="stamp label">BLACK</span>`;
    const why = (item.xpParts || []).filter(([, v]) => v !== 0).map(([n, v]) => `${n} ${v >= 0 ? '+' : ''}${v}`).join(' · ');
    return `<div class="slot ${cls}${fx}${mood}" title="${why.replace(/"/g, '&quot;')} = ${item.xp} XP">
      <span class="num">${k + 1}</span>
      <div class="imgwrap${yt ? ' yt' : ''}">${stamp}<img src="${item.img}" alt="${item.name.replace(/"/g, '&quot;')}" referrerpolicy="no-referrer" loading="eager" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'fallback',textContent:'${CAT_LABEL[item.cat]}'}))"></div>
      <div class="body">
        <span class="chip ${item.cat}">${CAT_LABEL[item.cat] || item.cat}</span>
        <div class="name">${item.name}</div>
        <div class="meta"><span class="xp${item.xp < 0 ? ' neg' : ''}">${item.xp > 0 ? '+' : ''}${item.xp} XP</span></div>
      </div></div>`;
  }
  const renderSlots = (slots, cls) => { $('#slots').innerHTML = Array.from({ length: 6 }, (_, k) => slotHTML(slots && slots[k], k, cls)).join(''); };

  // Which slots made a combo happen: swap each slot for a blank stand-in and see if the combo breaks.
  const STANDIN = { id: '_standin', name: '~', cat: '_none', sub: '_none', xp: 0, tags: [], price: 0, weight: 0 };
  function keySlots(slots, combo) {
    // greedy: blank out every slot the combo doesn't need; whatever is left is the smallest set that still triggers it
    const s2 = slots.slice(); const keep = [];
    for (let k = 0; k < s2.length; k++) {
      const orig = s2[k]; s2[k] = STANDIN;
      if (!combo.test(buildCtx(s2))) { s2[k] = orig; keep.push(k); }
    }
    return keep.length ? keep : slots.map((_, k) => k).filter(k => slots[k].cat !== 'empty');
  }
  function exampleHTML(ex) {
    if (!ex || !ex.length) return '';
    return `<div class="ex">${ex.map(e => {
      const it = BY_ID[e.id] || EMPTY;
      const pic = it.cat === 'empty' ? '<span class="ex-empty"></span>' : `<img src="${it.img}" alt="" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">`;
      return `<span class="ex-i" title="${(e.slot != null ? 'Slot ' + (e.slot + 1) + ': ' : '') + it.name.replace(/"/g, '&quot;')}">${pic}${e.slot != null ? `<b>${e.slot + 1}</b>` : ''}</span>`;
    }).join('')}</div>`;
  }
  function partRowHTML(item, k) {
    const pic = item.cat === 'empty' ? '<span class="ex-empty"></span>' : `<img src="${item.img}" alt="" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">`;
    const chips = (item.xpParts || []).filter(([, v]) => v !== 0).map(([n, v]) => `<span class="pc${v < 0 ? ' neg' : ''}">${n} <b>${v >= 0 ? '+' : ''}${v}</b></span>`).join('');
    return `<li class="part-row"><span class="ex-i">${pic}<b>${k + 1}</b></span><span class="pr-main"><span class="pr-name">${item.cat === 'empty' ? 'Empty slot' : item.name}</span><span class="pr-chips">${chips}</span></span><span class="cx${item.xp < 0 ? ' neg' : ''}">${item.xp >= 0 ? '+' : ''}${item.xp}</span></li>`;
  }
  function comboHTML(c, xp, opts = {}) {
    return `<li class="combo${xp < 0 ? ' neg' : ''}"><span class="cn">${c.name}${opts.isNew ? '<span class="new">NEW</span>' : ''}</span><span class="cx">${xp > 0 ? '+' : ''}${xp} XP</span><span class="cd">${c.desc}</span>${opts.times ? `<span class="times">hit ${opts.times}×</span>` : ''}${exampleHTML(opts.example)}</li>`;
  }
  const exampleFor = (slots, c) => keySlots(slots, c).map(k => ({ id: slots[k].id, slot: k }));

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const tierOf = total => { let t = 0; TIERS.forEach((x, k) => { if (x.min == null || total >= x.min) t = k; }); return t; };
  function setAward(tier, reveal) {
    $('#awardName').textContent = reveal ? TIERS[tier].name : '…';
    $('#awardLadder').innerHTML = TIERS.map((t, k) => `<span class="${k < tier ? 'on' : k === tier ? 'cur' : ''}" title="${t.name}"></span>`).join('');
  }
  function setTotal(v) { $('#totalXp').textContent = Math.round(v).toLocaleString(); }
  async function countTo(from, to, ms) {
    const t0 = performance.now();
    while (true) {
      const p = Math.min(1, (performance.now() - t0) / ms);
      setTotal(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      setAward(tierOf(from + (to - from) * p), false);
      if (p >= 1) return; await sleep(30);
    }
  }

  function flashSlots(ks, bad) {
    const els = document.querySelectorAll('#slots .slot');
    ks.forEach(k => { const el = els[k]; if (!el) return; el.classList.remove('flash', 'flash-bad'); void el.offsetWidth; el.classList.add(bad ? 'flash-bad' : 'flash'); });
  }

  // Static result (page reload): everything at once.
  function renderResult(slots, res, newIds = new Set()) {
    $('#result').classList.remove('hidden', 'revealing');
    setAward(res.tier, true); $('#award').classList.add('revealed');
    setTotal(res.total);
    $('#itemXp').textContent = res.itemXp;
    $('#comboXp').textContent = res.comboXp.toLocaleString();
    $('#comboCount').textContent = res.hits.length;
    $('#partsList').innerHTML = slots.map(partRowHTML).join('');
    $('#comboList').innerHTML = res.hits.length ? res.hits.map(h => comboHTML(h.c, h.xp, { isNew: newIds.has(h.c.id), example: exampleFor(slots, h.c) })).join('') : '<li class="muted">No combos this time.</li>';
    $('#shareBtn').onclick = () => share(slots, res);
  }

  // Dramatic result: item XP first, then combos one at a time from worst to best, award last.
  async function revealResult(slots, res, newIds, slow) {
    const r = $('#result');
    r.classList.remove('hidden'); r.classList.add('revealing'); $('#award').classList.remove('revealed');
    $('#comboList').innerHTML = ''; setTotal(0); setAward(0, false);
    $('#itemXp').textContent = res.itemXp; $('#comboXp').textContent = '0'; $('#comboCount').textContent = '0';
    r.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#partsList').innerHTML = '';
    await sleep(slow ? 700 : 300);
    let running = 0, cx = 0;
    for (let k = 0; k < slots.length; k++) {
      const tpl = document.createElement('template'); tpl.innerHTML = partRowHTML(slots[k], k);
      const el = tpl.content.firstElementChild; el.classList.add('appear');
      $('#partsList').appendChild(el); flashSlots([k], slots[k].xp < 0);
      await countTo(running, running + slots[k].xp, slow ? 350 : 120);
      running += slots[k].xp;
      await sleep(slow ? 300 : 80);
    }
    if (!res.hits.length) $('#comboList').innerHTML = '<li class="muted">No combos this time.</li>';
    for (let k = 0; k < res.hits.length; k++) {
      const h = res.hits[k];
      const last = k === res.hits.length - 1;
      const big = h.xp >= 100 || h.xp <= -100;
      await sleep(slow ? (last ? 1400 : big ? 1100 : 650) : 250);
      const tpl = document.createElement('template');
      const ex = exampleFor(slots, h.c);
      tpl.innerHTML = comboHTML(h.c, h.xp, { isNew: newIds.has(h.c.id), example: ex });
      flashSlots(ex.map(e => e.slot), h.xp < 0);
      const el = tpl.content.firstElementChild; el.classList.add('appear'); if (big) el.classList.add('big');
      $('#comboList').appendChild(el);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });  // list is column-reverse: newest (best so far) sits on top
      cx += h.xp; $('#comboXp').textContent = cx.toLocaleString(); $('#comboCount').textContent = k + 1;
      await countTo(running, running + h.xp, slow ? (big ? 700 : 350) : 150);
      running += h.xp;
    }
    await sleep(slow ? 1000 : 300);
    setAward(res.tier, true); $('#award').classList.add('revealed');
    r.classList.remove('revealing');
    $('#award').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#shareBtn').onclick = () => share(slots, res);
  }

  function renderCollection() {
    const found = Object.keys(state.found);
    $('#foundCount').textContent = found.length;
    $('#collectionNote').textContent = found.length ? `${found.length} of ${COMBOS.length} combos found. You only see a combo after you've hit it.` : `You haven't found any of the ${COMBOS.length} combos yet. Roll to start.`;
    const list = COMBOS.filter(c => state.found[c.id]).sort((a, b) => comboXp(a) - comboXp(b)); // column-reverse: best ends up on top
    $('#collectionList').innerHTML = list.map(c => comboHTML(c, comboXp(c), { times: state.found[c.id], example: state.examples[c.id] })).join('');
    $('#guestXp').textContent = Object.values(state.rolls).reduce((a, r) => a + (r.total || 0), 0).toLocaleString();
  }

  const EMOJI = { structure: '⬜', motion: '⚙️', hardware: '🔩', electronics: '🔌', pneumatics: '💨', tools: '🔧', kit: '📦', field: '🟩', manual: '📘', element: '🟠', meme: '💀', empty: '⬛' };
  function share(slots, res) {
    const row = slots.map(i => i.id === 'override-game-manual-v0-1' ? '🚫' : EMOJI[i.cat]).join('');
    const top = res.hits[res.hits.length - 1];
    const best = top && top.xp > 0 ? `\nBest combo: ${top.c.name} (+${top.xp})` : '';
    const text = `VEXdle #${dayNum(TODAY)} · ${TIERS[res.tier].name}\n${res.total.toLocaleString()} XP · ${res.hits.length} combos\n${row}${best}\n${location.origin}${location.pathname}`;
    const done = () => { const t = $('#shareToast'); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => prompt('Copy your result:', text)); else prompt('Copy your result:', text);
  }

  // ---------- roll animation ----------
  function preload(items) { return Promise.all(items.filter(i => i.img).map(i => new Promise(r => { const im = new Image(); im.referrerPolicy = 'no-referrer'; im.onload = im.onerror = r; im.src = i.img; setTimeout(r, 2500); }))); }
  // One slot at a time: each spins, slows down, hesitates, then locks in.
  async function animateRoll(final, slow) {
    const btn = $('#rollBtn'); btn.disabled = true; btn.textContent = 'Rolling…';
    $('#result').classList.add('hidden');
    const spinPool = Array.from({ length: 28 }, () => POOL[rnd(POOL.length)]);
    await preload(final.concat(spinPool));
    renderSlots(null);
    const slotEl = k => document.querySelectorAll('.slot')[k];
    for (let k = 0; k < 6; k++) {
      // constant-speed spin, no slowdown
      const tickMs = 70, spinMs = slow ? 1300 : 500;
      const t0 = performance.now(); let prev = null;
      while (performance.now() - t0 < spinMs) {
        let pick; do { pick = spinPool[rnd(spinPool.length)]; } while (pick === prev);
        prev = pick;
        slotEl(k).outerHTML = slotHTML(pick, k, 'spinning');
        await sleep(tickMs);
      }
      slotEl(k).outerHTML = slotHTML(final[k], k, 'locked');
      const it = final[k];
      const special = it.xp >= 120 || it.xp < 0;
      await sleep(slow ? (special ? 900 : 450) : 150);
    }
  }

  async function doRoll() {
    const slots = rollSlots();
    const res = score(slots);
    const newIds = new Set(res.hits.filter(h => !state.found[h.c.id]).map(h => h.c.id));
    // save first, so a refresh mid-animation can't give a second daily roll
    res.hits.forEach(h => {
      state.found[h.c.id] = (state.found[h.c.id] || 0) + 1;
      if (!state.examples[h.c.id]) state.examples[h.c.id] = exampleFor(slots, h.c).map(e => ({ id: e.id }));
    });
    if (!UNLIMITED) state.rolls[TODAY] = { ids: slots.map(s => s.id), total: res.total, tier: res.tier };
    save(state);
    const slow = !DEBUG; // the daily roll takes its time
    await animateRoll(slots, slow);
    await revealResult(slots, res, newIds, slow);
    renderCollection();
    updateButton();
  }

  function updateButton() {
    const btn = $('#rollBtn');
    if (DEBUG) { btn.disabled = false; btn.textContent = 'Roll again (debug)'; $('#rollNote').textContent = 'Debug mode: unlimited rolls, nothing is saved.'; return; }
    if (TEST) { btn.disabled = false; btn.textContent = 'Roll again (test)'; $('#rollNote').textContent = 'Test mode: roll as many times as you want. Your daily roll is not used up.'; return; }
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
  const today = !UNLIMITED && state.rolls[TODAY];
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
