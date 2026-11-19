// How each item earns XP. Every item's XP is the sum of these parts, shown to the player.
(function (root) {
  const ITEMS = root.VEX_ITEMS;
  const GAMES = root.VEX_GAMES;
  const CAT_BASE = { structure: 10, motion: 10, hardware: 5, electronics: 30, pneumatics: 20, tools: 8, kit: 40, field: 40, manual: 15, element: 20, meme: 0, empty: 0 };
  const CAT_NAME = { structure: 'Structure', motion: 'Motion', hardware: 'Hardware', electronics: 'Electronics', pneumatics: 'Pneumatics', tools: 'Tools', kit: 'Kit', field: 'Field', manual: 'Manual', element: 'Game element', meme: 'Meme', empty: 'Empty' };
  const SPECIAL = {
    'v5-robot-brain': ['The Brain', 80], 'v5-controller': ['Controller', 50], 'v5-robot-battery-li-ion-1100mah': ['Battery', 30],
    'v5-gps-sensor': ['GPS', 30], 'ai-vision-sensor': ['AI Vision', 25], 'v5-robot-radio': ['Radio', 10],
    'full-field-setup': ['Full field', 150], 'portable-competition-field-perimeter': ['Perimeter', 60],
    'championship-event-trophy-pack': ['Trophies', 60], 'qualifying-event-trophy-pack': ['Trophies', 45],
    'v5-pneumatics-kit': ['Full kit', 30], 'robotics-engineering-notebook': ['Notebook', 20],
    'step-drill-bit': ['Drill bit', 15],
  };
  const SUB_BONUS = { sensor: ['Sensor', 15], motor: ['Motor', 20], cartridge: ['Cartridge', 5], wheel: ['Wheel', 5], gear: ['Gear', 3], 'game-field': ['Game field', 20], cylinder: ['Cylinder', 8], bundle: ['Bundle', 20] };
  const MEME = {
    'stripped-screw': -60, 'dead-battery': -120, 'battery-at-12': -50, 'brain-with-a-cracked-screen': -180, 'smart-port-that-stopped-working': -100,
    'overheated-motor': -70, 'snapped-rubber-band': -25, 'zip-tie-holding-the-whole-robot-together': 120, 'bent-shaft': -35, 'lost-hex-key': -25,
    'unplugged-smart-cable': -50, 'auton-that-only-drives-forward': 30, 'controller-disconnected-mid-match': -100, 'robot-over-the-size-limit': -70,
    'engineering-notebook-written-the-night-before': -35, 'bag-of-mystery-screws': 20,
  };
  const gameIdx = Object.fromEntries(GAMES.map((g, k) => [g.key, k]));

  function parts(i) {
    const p = [];
    if (i.cat === 'empty') return [['Empty slot', 0]];
    if (i.id === 'override-game-manual-v0-1') return [['Manual', 15], ['Version 0.1', -515]];
    p.push([CAT_NAME[i.cat], CAT_BASE[i.cat]]);
    if (MEME[i.id] != null) p.push([MEME[i.id] < 0 ? 'Bad luck' : 'Lucky', MEME[i.id]]);
    if (i.mat === 'aluminum') p.push(['Aluminum', 10]);
    if ((i.tags || []).includes('hs')) p.push(['High strength', 8]);
    if (SPECIAL[i.id]) p.push(SPECIAL[i.id]);
    else if (SUB_BONUS[i.sub]) p.push(SUB_BONUS[i.sub]);
    if (i.cat !== 'meme' && i.price > 0) { const v = Math.round(4 * Math.log2(1 + i.price)); if (v) p.push(['Value', v]); }
    if (i.pack > 1) p.push([`${i.pack}-pack`, Math.round(4 * Math.log2(i.pack))]);
    if (i.season === 'override') p.push(['Current season', 25]);
    else if (i.season && (i.cat === 'field' || i.cat === 'manual') && gameIdx[i.season] < 12) p.push(['Vintage', (12 - gameIdx[i.season]) * 3]);
    return p;
  }
  ITEMS.forEach(i => { i.xpParts = parts(i); i.xp = i.xpParts.reduce((a, x) => a + x[1], 0); });
})(typeof window !== 'undefined' ? window : globalThis);
