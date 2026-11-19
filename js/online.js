// Shared leaderboard through Supabase. No sign-in: each browser gets a random secret id
// and the server gives it the next "Player N" number. One saved roll per browser per day.
(function (root) {
  const URL = 'https://rpldloaumktwauhijwbb.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_HXxO_f2KbHCStfY4s-uBsg_kDizzYPU'; // publishable key, safe to ship
  const PID_KEY = 'vexdle:pid';
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  let pid; try { pid = localStorage.getItem(PID_KEY); if (!pid) { pid = uuid(); localStorage.setItem(PID_KEY, pid); } } catch (e) { pid = uuid(); }
  async function rpc(fn, body) {
    const r = await fetch(URL + fn, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    if (!r.ok) throw new Error(`${fn} failed (${r.status})`);
    return r.json();
  }
  root.VEX_ONLINE = {
    pid,
    register: () => rpc('register_player', { p_id: pid }),
    submit: (items, xp, tier) => rpc('submit_roll', { p_id: pid, p_items: items, p_xp: xp, p_tier: tier }),
    leaderboard: (n = 50) => rpc('leaderboard', { p_limit: n }),
    today: (n = 50) => rpc('today_board', { p_limit: n }),
    playerRolls: (num, n = 7) => rpc('player_rolls', { p_num: num, p_limit: n }),
    me: () => rpc('my_standing', { p_id: pid }).then(r => r[0] || null),
  };
})(window);
