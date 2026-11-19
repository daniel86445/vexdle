// VEXdle combos. Each combo has a fixed XP value.
// XP for most combos is set from how rare the combo is (see tools/calibrate.js -> js/combo-xp.js).
// Combos with an explicit `xp` here keep that value (used for the joke/negative ones).
(function (root) {
  const ITEMS = root.VEX_ITEMS;
  const GAMES = root.VEX_GAMES;
  const BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

  // ---------- context built once per roll ----------
  function buildCtx(slots) {
    const real = slots.filter(s => s.cat !== 'empty');
    const count = (arr, key) => { const m = {}; arr.forEach(x => { const k = key(x); if (k != null) m[k] = (m[k] || 0) + 1; }); return m; };
    const tagCount = {};
    real.forEach(i => (i.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const sum = (f) => real.reduce((a, i) => a + (f(i) || 0), 0);
    return {
      slots, real,
      n: real.length,
      empties: slots.length - real.length,
      byId: count(real, i => i.id),
      byCat: count(real, i => i.cat),
      bySub: count(real, i => i.sub),
      bySeason: count(real, i => i.season),
      byMat: count(real, i => i.mat),
      byTag: tagCount,
      price: sum(i => i.price),
      weight: sum(i => i.weight),
      size: sum(i => i.size),
      pieces: real.reduce((a, i) => a + (i.pack || 1), 0),
      has: id => slots.some(s => s.id === id),
      cnt: id => slots.filter(s => s.id === id).length,
      tag: t => tagCount[t] || 0,
      idx: pred => slots.findIndex(pred),
    };
  }

  const C = [];
  const def = (id, name, desc, test, xp) => C.push({ id, name, desc, test, xp });
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
  const WORD = { 2: 'Pair', 3: 'Trio', 4: 'Quad', 5: 'Five-Stack', 6: 'Full House' };
  const teeth = i => { const m = /^(\d+)T /.exec(i.name); return m ? +m[1] : null; };
  const isPos = arr => arr.length > 1;
  const nondecreasing = arr => arr.every((v, k) => k === 0 || arr[k - 1] <= v);
  const nonincreasing = arr => arr.every((v, k) => k === 0 || arr[k - 1] >= v);
  const strictInc = arr => arr.every((v, k) => k === 0 || arr[k - 1] < v);
  const strictDec = arr => arr.every((v, k) => k === 0 || arr[k - 1] > v);

  // ===== A. category stacks =====
  const CAT_NAMES = {
    structure: ['Metal Pile', 'Frame Job', 'Chassis Builder', 'Scrap Yard', 'All Metal'],
    motion: ['Moving Parts', 'Drivetrain Drafts', 'Gearhead', 'Spin Cycle', 'Perpetual Motion'],
    hardware: ['Loose Hardware', 'Screw Jar', 'Hardware Drawer', 'Hardware Store', 'Hardware Hoarder'],
    electronics: ['Wired', 'Plugged In', 'Circuit Board', 'Electrical Fire', 'Full Electronics'],
    pneumatics: ['Air Supply', 'Pressurized', 'Hissing', 'Air Show', 'Pure Pneumatics'],
    tools: ['Toolbox', 'Pit Crew', 'Tool Wall', 'Tool Hoarder', 'Only Tools, No Robot'],
    kit: ['Bundle Up', 'Kit Collector', 'Warehouse Order', 'Purchase Order Denied', 'Infinite Budget'],
    field: ['Field Trip', 'Field Crew', 'Field Reset', 'Event Partner', 'Venue Owner'],
    manual: ['Light Reading', 'Rules Lawyer', 'Q&A Regular', 'GDC Member', 'Wrote the Manual'],
    element: ['Game Pieces', 'Scoring Run', 'Hoarding Elements', 'Match Loads', 'Element Monopoly'],
    meme: ['Bad Day', 'Rough Tournament', 'Cursed Robot', 'Disaster Season', 'Peak VEX Experience'],
  };
  Object.entries(CAT_NAMES).forEach(([cat, names]) => range(2, 6).forEach(k =>
    def(`cat-${cat}-${k}`, names[k - 2], `${k}+ ${cat} items`, c => (c.byCat[cat] || 0) >= k)));

  // ===== B. sub-type stacks =====
  const SUBS = {
    'c-channel': 'C-Channel', angle: 'Angle', plate: 'Plate', bar: 'Bar', gusset: 'Gusset', wheel: 'Wheel', gear: 'Gear',
    sprocket: 'Sprocket', shaft: 'Shaft', bearing: 'Bearing', collar: 'Shaft Collar', standoff: 'Standoff', screw: 'Screw',
    nut: 'Nut', sensor: 'Sensor', motor: 'Motor', cartridge: 'Cartridge', wall: 'Wall', tile: 'Tile', 'game-field': 'Field',
    pin: 'Pin', 'rubber-band': 'Rubber Band', cylinder: 'Cylinder', tool: 'Tool', chain: 'Chain', retainer: 'Retainer',
    fitting: 'Fitting', kit: 'Kit', bundle: 'Bundle', coupler: 'Coupler', trophy: 'Trophy', cable: 'Cable', bracket: 'Bracket',
  };
  Object.entries(SUBS).forEach(([sub, nm]) => range(2, 5).forEach(k =>
    def(`sub-${sub}-${k}`, `${nm} ${WORD[k]}`, `${k}+ ${nm.toLowerCase()} items`, c => (c.bySub[sub] || 0) >= k)));

  // ===== C. duplicates =====
  const maxDup = c => Math.max(0, ...Object.values(c.byId));
  const dupGroups = c => Object.values(c.byId).filter(v => v >= 2).sort((a, b) => b - a);
  def('dup-2', 'Déjà Vu', 'The same item twice', c => maxDup(c) >= 2);
  def('dup-3', 'Three of a Kind', 'The same item three times', c => maxDup(c) >= 3);
  def('dup-4', 'Four of a Kind', 'The same item four times', c => maxDup(c) >= 4);
  def('dup-5', 'Five of a Kind', 'The same item five times', c => maxDup(c) >= 5);
  def('dup-6', 'Six of a Kind', 'All six slots are the same item', c => maxDup(c) >= 6);
  def('dup-2-2', 'Two Pair', 'Two different items, each twice', c => dupGroups(c).length >= 2);
  def('dup-2-2-2', 'Three Pair', 'Three different items, each twice', c => dupGroups(c).length >= 3);
  def('dup-3-2', 'Full Send', 'One item three times and another twice', c => { const g = dupGroups(c); return g[0] >= 3 && g[1] >= 2; });
  def('dup-3-3', 'Twin Towers', 'Two items, three of each', c => { const g = dupGroups(c); return g[0] >= 3 && g[1] >= 3; });
  def('all-unique', 'No Repeats', 'Six different real items', c => c.n === 6 && Object.keys(c.byId).length === 6);
  def('unit-and-pack', 'Buy in Bulk', 'A part and its own multi-pack', c => c.real.some(i => i.unit && c.byId[i.unit]));
  def('unit-and-pack-2', 'Restock', 'Two parts that each appear with their own pack', c => c.real.filter(i => i.unit && c.byId[i.unit]).length >= 2);

  // ===== D. specific doubles for notable items =====
  ITEMS.filter(i => i.cat !== 'empty' && i.xp >= 9 && !i.id.includes('v0-1')).forEach(i => {
    def(`double-${i.id}`, `Double ${i.name}`, `Two ${i.name}`, c => (c.byId[i.id] || 0) >= 2);
  });

  // ===== E. price =====
  [[10000, 'Five Figures'], [5000, 'Grant Money'], [2500, 'Sponsor Funded'], [1000, 'Four Figures'], [500, 'Big Spender'], [250, 'Fundraiser Target']]
    .forEach(([v, nm]) => def(`price-gt-${v}`, nm, `Roll is worth over $${v.toLocaleString()}`, c => c.price > v));
  [[50, 'Budget Build'], [20, 'Pocket Change'], [10, 'Under a Tenner'], [5, 'Five Dollar Robot'], [1, 'Spare Change']]
    .forEach(([v, nm]) => def(`price-lt-${v}`, nm, `Roll is worth under $${v} (6 real items)`, c => c.n === 6 && c.price < v));
  def('price-zero', 'Free Real Estate', 'Six real items that cost $0 together', c => c.n === 6 && c.price === 0);
  def('price-asc', 'Price Is Right', 'Prices go up slot by slot (no empties)', c => c.n === 6 && strictInc(c.slots.map(s => s.price || 0)));
  def('price-desc', 'Clearance Sale', 'Prices go down slot by slot (no empties)', c => c.n === 6 && strictDec(c.slots.map(s => s.price || 0)));
  def('price-each-100', 'Premium Only', 'Every slot costs over $100', c => c.n === 6 && c.slots.every(s => (s.price || 0) > 100));
  def('price-each-1', 'Dollar Store', 'Every slot costs under $1', c => c.n === 6 && c.slots.every(s => (s.price || 0) < 1));
  def('price-mix', 'Rich and Poor', 'One item over $500 and one under $1', c => c.real.some(i => i.price > 500) && c.real.some(i => (i.price || 0) < 1));
  def('price-round', 'Exact Change', 'Total price ends in .00', c => c.n > 0 && Math.round(c.price * 100) % 100 === 0 && c.price > 0);
  def('price-99', 'Nine-Nine', 'Every item price ends in .99', c => c.n === 6 && c.real.every(i => Math.round(i.price * 100) % 100 === 99));

  // ===== F. weight =====
  [[200, 'Forklift Needed'], [100, 'Heavy Freight'], [50, 'Two-Person Lift'], [20, 'Heavy Bot']]
    .forEach(([v, nm]) => def(`w-gt-${v}`, nm, `Over ${v} lb total`, c => c.weight > v));
  [[0.1, 'Featherweight'], [0.02, 'Weightless'], [0.005, 'Basically Air']]
    .forEach(([v, nm]) => def(`w-lt-${v}`, nm, `Six real items under ${v} lb total`, c => c.n === 6 && c.weight < v));
  def('w-asc', 'Getting Heavier', 'Weights go up slot by slot', c => c.n === 6 && strictInc(c.slots.map(s => s.weight || 0)));
  def('w-desc', 'Getting Lighter', 'Weights go down slot by slot', c => c.n === 6 && strictDec(c.slots.map(s => s.weight || 0)));

  // ===== G. size =====
  def('size-gt-60', 'Long Haul', 'Over 60" of sized parts', c => c.size > 60);
  def('size-gt-30', 'Stretch', 'Over 30" of sized parts', c => c.size > 30);
  def('size-asc', 'Size Order', '4+ sized parts, getting bigger left to right', c => { const s = c.slots.filter(x => x.size).map(x => x.size); return s.length >= 4 && strictInc(s); });
  def('size-desc', 'Shrink Ray', '4+ sized parts, getting smaller left to right', c => { const s = c.slots.filter(x => x.size).map(x => x.size); return s.length >= 4 && strictDec(s); });
  def('size-same', 'Measure Twice', '3+ parts with the exact same size', c => { const m = {}; c.real.forEach(i => { if (i.size) m[i.size] = (m[i.size] || 0) + 1; }); return Object.values(m).some(v => v >= 3); });
  def('size-tiny', 'Small Parts', '3+ parts 1/4" or smaller', c => c.real.filter(i => i.size && i.size <= 0.25).length >= 3);

  // ===== H. material (aluminum beats steel) =====
  [2, 3, 4, 5, 6].forEach(k => def(`al-${k}`, ['Lightweight', 'Aluminum Club', 'Anodized', 'Aircraft Grade', 'Pure Aluminum'][k - 2], `${k}+ aluminum parts`, c => (c.byMat.aluminum || 0) >= k));
  [2, 3, 4, 5, 6].forEach(k => def(`st-${k}`, ['Steel Yourself', 'Heavy Metal', 'Zinc Plated', 'Tank Build', 'Man of Steel'][k - 2], `${k}+ steel parts`, c => (c.byMat.steel || 0) >= k));
  def('al-gt-st', 'Weight Savings', 'More aluminum than steel (2+ aluminum)', c => (c.byMat.aluminum || 0) >= 2 && (c.byMat.aluminum || 0) > (c.byMat.steel || 0));
  def('mat-alt', 'Mixed Metals', 'Aluminum and steel alternate across 4+ slots in a row', c => { let run = 1, best = 1; for (let k = 1; k < 6; k++) { const a = c.slots[k - 1].mat, b = c.slots[k].mat; if (a && b && a !== b && /steel|aluminum/.test(a + b)) { run++; best = Math.max(best, run); } else run = 1; } return best >= 4; });

  // ===== I. order / pattern =====
  def('pal-cat', 'Mirror Image', 'Slot categories read the same forwards and backwards', c => { const s = c.slots.map(x => x.cat); return s.join() === [...s].reverse().join() && new Set(s).size > 1; });
  def('pal-item', 'Perfect Mirror', 'Slot items read the same forwards and backwards', c => { const s = c.slots.map(x => x.id); return s.join() === [...s].reverse().join() && new Set(s).size > 1; });
  def('bookends', 'Bookends', 'First and last slot are the same item', c => c.slots[0].id === c.slots[5].id && c.slots[0].cat !== 'empty');
  def('sandwich', 'Sandwich', 'Same item on both sides of a different item', c => range(0, 3).some(k => c.slots[k].id === c.slots[k + 2].id && c.slots[k].id !== c.slots[k + 1].id && c.slots[k].cat !== 'empty'));
  def('adjacent', 'Back to Back', 'The same item in two neighbouring slots', c => range(0, 4).some(k => c.slots[k].id === c.slots[k + 1].id && c.slots[k].cat !== 'empty'));
  def('alt-cat', 'Zipper', 'Two categories alternate across all six slots', c => { const s = c.slots.map(x => x.cat); return s[0] !== s[1] && s.every((v, k) => v === s[k % 2]); });
  def('cats-5', 'Well Rounded', '5+ different categories', c => Object.keys(c.byCat).length >= 5);
  def('cats-6', 'Renaissance Robot', '6 different categories', c => Object.keys(c.byCat).length >= 6);
  def('one-cat', 'Specialist', 'All six real items from one category', c => c.n === 6 && Object.keys(c.byCat).length === 1);
  def('abc', 'Alphabetical', 'Item names in A-Z order', c => c.n === 6 && nondecreasing(c.slots.map(s => s.name.toLowerCase())) && new Set(c.slots.map(s => s.id)).size > 2);
  def('zyx', 'Reverse Alphabetical', 'Item names in Z-A order', c => c.n === 6 && nonincreasing(c.slots.map(s => s.name.toLowerCase())) && new Set(c.slots.map(s => s.id)).size > 2);
  def('same-letter-3', 'Alliteration', '3+ items starting with the same letter', c => { const m = {}; c.real.forEach(i => { const l = i.name.replace(/^[^A-Za-z]+/, '')[0]; m[l] = (m[l] || 0) + 1; }); return Object.values(m).some(v => v >= 3); });
  def('numbers', 'By the Numbers', 'Every real item has a number in its name', c => c.n === 6 && c.real.every(i => /\d/.test(i.name)));
  def('first-big', 'Lead with Money', 'Slot 1 is the most expensive item', c => c.n === 6 && c.slots[0].price > 0 && c.slots.every(s => (s.price || 0) <= c.slots[0].price) && c.slots.slice(1).every(s => (s.price || 0) < c.slots[0].price));
  def('last-big', 'Saved the Best', 'Slot 6 is the most expensive item', c => c.n === 6 && c.slots[5].price > 0 && c.slots.slice(0, 5).every(s => (s.price || 0) < c.slots[5].price));

  // ===== J. empty slots =====
  def('empty-1', 'Missed a Spot', 'At least one empty slot', c => c.empties >= 1);
  def('empty-2', 'Half Packed', 'Two empty slots', c => c.empties >= 2);
  def('empty-3', 'Ghost Town', 'Three empty slots', c => c.empties >= 3);
  def('empty-4', 'Forgot the Robot', 'Four empty slots', c => c.empties >= 4);
  def('empty-5', 'Lonely Part', 'Five empty slots', c => c.empties >= 5);
  def('empty-6', 'No-Show', 'All six slots empty', c => c.empties >= 6);
  def('empty-first', 'Slow Start', 'Slot 1 is empty', c => c.slots[0].cat === 'empty');
  def('empty-last', 'Ran Out of Time', 'Slot 6 is empty', c => c.slots[5].cat === 'empty');
  def('empty-adj', 'Big Gap', 'Two empty slots side by side', c => range(0, 4).some(k => c.slots[k].cat === 'empty' && c.slots[k + 1].cat === 'empty'));
  def('empty-ends', 'Hollow', 'First and last slots both empty', c => c.slots[0].cat === 'empty' && c.slots[5].cat === 'empty');
  def('empty-bundle', 'Unopened Box', 'An empty slot next to a kit or bundle', c => range(0, 4).some(k => (c.slots[k].cat === 'empty' && c.slots[k + 1].cat === 'kit') || (c.slots[k].cat === 'kit' && c.slots[k + 1].cat === 'empty')));

  // ===== K. seasons =====
  GAMES.forEach((g, gi) => {
    const field = `${g.key}-field`, manual = `${g.key}-game-manual`;
    def(`season-${g.key}-2`, `${g.name} Season`, `2+ items from ${g.name} (${g.years})`, c => (c.bySeason[g.key] || 0) >= 2);
    def(`season-${g.key}-3`, `${g.name} Veteran`, `3+ items from ${g.name}`, c => (c.bySeason[g.key] || 0) >= 3);
    def(`rtfm-${g.key}`, `Read the ${g.name} Manual`, `${g.name} field and its game manual`, c => c.has(field) && c.has(manual));
    if (ITEMS.some(i => i.cat === 'element' && i.season === g.key))
      def(`full-game-${g.key}`, `Full ${g.name} Game`, `${g.name} field, manual and a game element`, c => c.has(field) && c.has(manual) && c.real.some(i => i.cat === 'element' && i.season === g.key));
  });
  def('wrong-manual', 'Wrong Rulebook', 'A field with a manual from a different game', c => c.real.some(f => f.sub === 'game-field' && c.real.some(m => m.cat === 'manual' && m.season !== f.season)));
  def('cortex-3', 'Cortex Nostalgia', '3+ items from pre-V5 games (2007-2019)', c => c.tag('cortex') >= 3);
  def('cortex-5', 'Old School', '5+ items from pre-V5 games', c => c.tag('cortex') >= 5);
  def('v5era-3', 'V5 Generation', '3+ items from V5-era games (2019+)', c => c.real.filter(i => (i.tags || []).includes('v5') && i.season).length >= 3);
  const seasonIdx = Object.fromEntries(GAMES.map((g, k) => [g.key, k]));
  def('chrono', 'Time Traveler', '3+ game items in chronological order', c => { const s = c.slots.filter(x => x.season && x.sub !== 'full').map(x => seasonIdx[x.season]); return s.length >= 3 && strictInc(s); });
  def('chrono-rev', 'Back to the Future', '3+ game items in reverse chronological order', c => { const s = c.slots.filter(x => x.season && x.sub !== 'full').map(x => seasonIdx[x.season]); return s.length >= 3 && strictDec(s); });
  def('back-to-back-seasons', 'Consecutive Seasons', 'Items from two back-to-back games', c => { const s = Object.keys(c.bySeason).map(k => seasonIdx[k]); return s.some(a => s.includes(a + 1)); });
  def('first-and-latest', 'Then and Now', 'Bridge Battle and Override items together', c => c.bySeason['bridge-battle'] && c.bySeason.override);
  def('manuals-3-games', 'Library Card', 'Manuals from 3 different games', c => new Set(c.real.filter(i => i.cat === 'manual').map(i => i.season)).size >= 3);
  def('fields-3-games', 'World Tour', 'Fields from 3 different games', c => new Set(c.real.filter(i => i.sub === 'game-field').map(i => i.season)).size >= 3);
  def('manual-free-and-pricy', 'Free and Expensive', 'A free manual and something over $1,000', c => c.real.some(i => i.cat === 'manual') && c.real.some(i => i.price > 1000));

  // ===== L. Override Game Manual v0.1 (the worst thing in the game) =====
  const v01 = 'override-game-manual-v0-1';
  def('v01-1', 'Day One Rules', 'Rolled Override Game Manual v0.1', c => c.cnt(v01) >= 1, -25);
  def('v01-2', 'Q&A Spiral', 'Two copies of Override Manual v0.1', c => c.cnt(v01) >= 2, -100);
  def('v01-3', 'Rule Change Incoming', 'Three copies of Override Manual v0.1', c => c.cnt(v01) >= 3, -250);
  def('v01-4', 'Disqualified', 'Four copies of Override Manual v0.1', c => c.cnt(v01) >= 4, -500);
  def('v01-5', 'Banned from the Event', 'Five copies of Override Manual v0.1', c => c.cnt(v01) >= 5, -800);
  def('v01-6', 'The Worst Roll in VEX', 'Six copies of Override Manual v0.1. Nothing is worse.', c => c.cnt(v01) >= 6, -2000);
  def('v01-update', 'Version Control', 'Override Manual v0.1 and the current Override manual', c => c.has(v01) && c.has('override-game-manual'));
  def('v01-field', 'Playing by Old Rules', 'Override Manual v0.1 with the Override field', c => c.has(v01) && c.has('override-field'), -10);

  // ===== M. themed combos =====
  const T = (id, name, desc, test, xp) => def('t-' + id, name, desc, test, xp);
  const sub = (c, s) => c.bySub[s] || 0;
  const cat = (c, s) => c.byCat[s] || 0;
  const hasName = (c, re) => c.real.some(i => re.test(i.name));
  const cntName = (c, re) => c.real.filter(i => re.test(i.name)).length;
  // electronics
  T('power-on', 'Power On', 'Brain and battery', c => c.has('v5-robot-brain') && c.has('v5-robot-battery-li-ion-1100mah'));
  T('drive-ready', 'Ready to Drive', 'Brain, battery and controller', c => c.has('v5-robot-brain') && c.has('v5-robot-battery-li-ion-1100mah') && c.has('v5-controller'));
  T('wireless', 'Wireless', 'Brain, controller and radio', c => c.has('v5-robot-brain') && c.has('v5-controller') && c.has('v5-robot-radio'));
  T('full-control', 'Full Control System', 'Brain, battery, controller and radio', c => ['v5-robot-brain', 'v5-robot-battery-li-ion-1100mah', 'v5-controller', 'v5-robot-radio'].every(c.has));
  T('motor-brain', 'Plugged In', 'Brain and a motor', c => c.has('v5-robot-brain') && sub(c, 'motor') >= 1);
  T('motor-cart', 'Cartridge Installed', 'Motor and a gear cartridge', c => sub(c, 'motor') >= 1 && sub(c, 'cartridge') >= 1);
  T('rgb', 'RGB', 'Red, green and blue cartridges', c => ['smart-motor-36-1-cartridge-100-rpm', 'smart-motor-18-1-cartridge-200-rpm', 'smart-motor-6-1-cartridge-600-rpm'].every(c.has));
  T('blue-motor-wheel', 'Speed Demon', '600 RPM cartridge, a motor and a wheel', c => c.has('smart-motor-6-1-cartridge-600-rpm') && sub(c, 'motor') >= 1 && sub(c, 'wheel') >= 1);
  T('red-arm', 'Torque Monster', '100 RPM cartridge with a big gear', c => c.has('smart-motor-36-1-cartridge-100-rpm') && c.real.some(i => teeth(i) >= 60));
  T('motor-11-55', 'Mixed Motors', '11W and 5.5W motors together', c => c.has('v5-smart-motor-11w') && c.has('v5-smart-motor-5-5w'));
  T('odom', 'Odometry', 'Two rotation sensors and an inertial sensor', c => c.cnt('rotation-sensor') >= 2 && c.has('inertial-sensor'));
  T('odom-lite', 'Tracking Wheel', 'Rotation sensor and an omni wheel', c => c.has('rotation-sensor') && c.tag('omni') >= 1);
  T('gps-field', 'GPS Lock', 'GPS sensor and a field wall or perimeter', c => c.has('v5-gps-sensor') && (sub(c, 'wall') || sub(c, 'perimeter')));
  T('gps-no-field', 'Lost Signal', 'GPS sensor with no field wall around', c => c.has('v5-gps-sensor') && !sub(c, 'wall') && !sub(c, 'perimeter'));
  T('vision', 'Eyes on the Prize', 'AI Vision sensor and a game element', c => c.has('ai-vision-sensor') && cat(c, 'element') >= 1);
  T('optical-ring', 'Color Sort', 'Optical sensor and a colored game element', c => c.has('optical-sensor') && c.real.some(i => i.cat === 'element' && /ring|pin|ball|block|triball/.test(i.sub)));
  T('line-tile', 'Line Follower', 'Line tracker and a field tile', c => c.real.some(i => /^line-tracker/.test(i.id)) && sub(c, 'tile') >= 1);
  T('sensors-3', 'Sensor Suite', '3 different sensors', c => new Set(c.real.filter(i => i.sub === 'sensor').map(i => i.id)).size >= 3);
  T('sensors-5', 'Sensor Overload', '5 different sensors', c => new Set(c.real.filter(i => i.sub === 'sensor').map(i => i.id)).size >= 5);
  T('three-wire', '3-Wire Era', '3-wire expander and a 3-wire sensor', c => c.has('3-wire-expander') && c.tag('3-wire') >= 2);
  T('cable-mess', 'Cable Management?', '3+ cable items', c => c.tag('cable') >= 3);
  T('crimp', 'Custom Cables', 'Crimping tool, cable stock and connectors', c => c.has('smart-cable-crimping-tool') && c.has('smart-cable-stock-8m') && hasName(c, /Smart Cable Connector/));
  T('charger', 'Charged Up', 'Battery and battery charger', c => c.has('v5-robot-battery-charger') && (c.has('v5-robot-battery-li-ion-1100mah') || c.has('dead-battery')));
  // drivetrains
  T('drivetrain', 'Drivetrain', 'A motor and 2 wheels', c => sub(c, 'motor') >= 1 && sub(c, 'wheel') >= 2);
  T('tank', 'Tank Drive', '2 motors and 2 traction wheels', c => sub(c, 'motor') >= 2 && c.tag('traction') >= 2);
  T('x-drive', 'X-Drive', '4 omni wheels', c => c.tag('omni') >= 4);
  T('holonomic', 'Holonomic', '3 omni wheels', c => c.tag('omni') >= 3);
  T('mecanum', 'Mecanum Drive', '2 mecanum wheels', c => c.tag('mecanum') >= 2);
  T('mecanum-4', 'Strafe King', '4 mecanum wheels', c => c.tag('mecanum') >= 4);
  T('omni-trac', 'Hybrid Drive', 'Omni and traction wheels together', c => c.tag('omni') >= 1 && c.tag('traction') >= 1);
  T('wheel-sizes', 'Mismatched Wheels', '3 different wheel sizes', c => new Set(c.real.filter(i => i.sub === 'wheel' && i.size).map(i => i.size)).size >= 3);
  T('same-wheel-size', 'Matching Set', '3 wheels of the same diameter', c => { const m = {}; c.real.filter(i => i.sub === 'wheel').forEach(i => { m[i.size] = (m[i.size] || 0) + 1; }); return Object.values(m).some(v => v >= 3); });
  T('six-motor', '6-Motor Drive', '3+ motors', c => sub(c, 'motor') >= 3);
  T('flex-intake', 'Flex Wheel Intake', '2 compression wheels and a motor', c => c.tag('flex') >= 2 && sub(c, 'motor') >= 1);
  T('tread', 'Tank Treads', 'Tread links and a sprocket', c => c.has('tread-links') && sub(c, 'sprocket') >= 1);
  // gears & chain
  const gearRatio = (c, r) => { const t = c.real.map(teeth).filter(Boolean); return t.some(a => t.some(b => a * r === b)); };
  [[2, 'Double Up'], [3, '3:1 Torque'], [4, '4:1 Reduction'], [5, '5:1 Grinder'], [6, '6:1 Lift'], [7, '7:1 Overkill']]
    .forEach(([r, nm]) => T(`ratio-${r}`, nm, `Two gears or sprockets with a ${r}:1 ratio`, c => gearRatio(c, r)));
  T('gear-train', 'Gear Train', '3 different gears', c => new Set(c.real.filter(i => i.sub === 'gear' && teeth(i)).map(teeth)).size >= 3);
  T('chain-drive', 'Chain Drive', 'A sprocket and chain', c => sub(c, 'sprocket') >= 1 && sub(c, 'chain') >= 1);
  T('chain-2', 'Chained Up', '2 sprockets and chain', c => sub(c, 'sprocket') >= 2 && sub(c, 'chain') >= 1);
  T('hs-mix', 'High Strength', '3+ high-strength parts', c => c.tag('hs') >= 3);
  T('hs-shaft-bearing', 'Supported Shaft', 'High-strength shaft and a bearing', c => c.real.some(i => i.sub === 'shaft' && (i.tags || []).includes('hs')) && sub(c, 'bearing') >= 1);
  T('shaft-collar', 'Captured', 'A shaft and a shaft collar', c => sub(c, 'shaft') >= 1 && sub(c, 'collar') >= 1);
  T('shaft-wheel', 'Axle', 'A shaft, a wheel and a bearing', c => sub(c, 'shaft') >= 1 && sub(c, 'wheel') >= 1 && sub(c, 'bearing') >= 1);
  T('long-shaft', 'Lance', '24" high strength shaft', c => hasName(c, /^24" High Strength Shaft/));
  T('ujoint', 'Bend It', 'Universal joint and a shaft', c => hasName(c, /Universal Joint/) && sub(c, 'shaft') >= 1);
  T('turntable', 'Turret', 'Turntable bearing and a motor', c => c.has('turntable-bearing-kit-v2') && sub(c, 'motor') >= 1);
  T('linear', 'Linear Lift', 'Linear motion kit and a motor', c => c.has('linear-motion-kit-v2') && sub(c, 'motor') >= 1);
  T('winch', 'Hang Time', 'Winch kit and a motor', c => c.has('winch-and-pulley-kit') && sub(c, 'motor') >= 1);
  T('flywheel', 'Flywheel', 'Flywheel weight, a motor and the 600 RPM cartridge', c => hasName(c, /Flywheel Weight/) && sub(c, 'motor') >= 1 && c.has('smart-motor-6-1-cartridge-600-rpm'));
  T('flywheel-lite', 'Spin Up Shooter', 'Flywheel weight and Spin Up item', c => hasName(c, /Flywheel Weight/) && c.bySeason['spin-up']);
  T('intake', 'Intake', 'Intake rollers or flex wheels and a motor', c => (hasName(c, /Intake Roller/) || c.tag('flex')) && sub(c, 'motor') >= 1);
  T('band-launch', 'Catapult', '2 rubber bands and a big gear', c => c.tag('band') >= 2 && c.real.some(i => teeth(i) >= 36));
  // structure & hardware
  T('nut-bolt', 'Nut and Bolt', 'A screw and a nut', c => sub(c, 'screw') >= 1 && sub(c, 'nut') >= 1);
  T('nylock', 'Locked In', 'Nylock nut and a screw', c => hasName(c, /Nylock Nut/) && sub(c, 'screw') >= 1);
  T('keps-c', 'Keps on Metal', 'Keps nut, screw and C-channel', c => hasName(c, /Keps Nut/) && sub(c, 'screw') >= 1 && sub(c, 'c-channel') >= 1);
  T('right-tool-star', 'Right Tool', 'Star drive screw and a star key or screwdriver', c => c.real.some(i => i.sub === 'screw' && (i.tags || []).includes('star')) && c.real.some(i => i.sub === 'tool' && (i.tags || []).includes('star')));
  T('right-tool-hex', 'Old Reliable', 'Hex screw and a hex key', c => c.real.some(i => i.sub === 'screw' && (i.tags || []).includes('hex')) && c.real.some(i => i.sub === 'tool' && (i.tags || []).includes('hex')));
  T('wrong-tool', 'Wrong Bit', 'Star drive screw and only a hex key', c => c.real.some(i => i.sub === 'screw' && (i.tags || []).includes('star')) && c.real.some(i => (i.tags || []).includes('hex') && i.sub === 'tool') && !c.real.some(i => i.sub === 'tool' && (i.tags || []).includes('star')));
  T('standoff-stack', 'Standoff Tower', '3 standoffs', c => sub(c, 'standoff') >= 3);
  T('standoff-retain', 'Retained', 'Standoff retainer and a standoff', c => hasName(c, /Standoff Retainer/) && sub(c, 'standoff') >= 1);
  T('nut-retain', 'No Wrench Needed', 'Nut retainer and a nut', c => hasName(c, /Nut Retainer/) && sub(c, 'nut') >= 1);
  T('gusset-c', 'Reinforced', 'A gusset and C-channel', c => sub(c, 'gusset') >= 1 && sub(c, 'c-channel') >= 1);
  T('45-gusset-c', 'Forty-Five', '45 degree gusset and an aluminum C-channel', c => hasName(c, /^45 Degree Gusset/) && c.real.some(i => i.sub === 'c-channel' && i.mat === 'aluminum'));
  T('c-and-l', 'C and L', 'A C-channel and an L-channel', c => sub(c, 'c-channel') >= 1 && c.tag('l-channel') >= 1);
  T('chassis', 'Chassis', '2 C-channels, 2 wheels and a motor', c => sub(c, 'c-channel') >= 2 && sub(c, 'wheel') >= 2 && sub(c, 'motor') >= 1);
  T('u-channel', 'U-Turn', 'U-channel and a C-channel', c => sub(c, 'u-channel') >= 1 && sub(c, 'c-channel') >= 1);
  T('plate-bar', 'Flat Pack', 'A plate and a bar', c => sub(c, 'plate') >= 1 && sub(c, 'bar') >= 1);
  T('25-35', '25 and 35', 'A 25-hole and a 35-hole structure piece', c => c.real.some(i => i.cat === 'structure' && /x25\b|x25 /.test(i.name)) && c.real.some(i => i.cat === 'structure' && /x35/.test(i.name)));
  T('zip-band', 'Held Together', 'Zip tie and a rubber band', c => c.tag('zip') >= 1 && c.tag('band') >= 1);
  T('zips-3', 'Zip Tie Engineering', '3 zip tie items', c => c.tag('zip') >= 3);
  T('bands-3', 'Rubber Band Powered', '3 rubber band items', c => c.tag('band') >= 3);
  T('washer-spacer', 'Shimmed', 'A washer and a spacer', c => sub(c, 'washer') >= 1 && sub(c, 'spacer') >= 1);
  T('clawbot', 'Clawbot', 'Clawbot structure and the claw kit', c => c.has('v5-clawbot-structure-aluminum') && c.has('claw-kit-v2'));
  T('clawbot-full', 'Clawbot Complete', 'Clawbot structure, claw kit, brain and a motor', c => c.has('v5-clawbot-structure-aluminum') && c.has('claw-kit-v2') && c.has('v5-robot-brain') && sub(c, 'motor') >= 1);
  T('bracket-gear', 'Gearbox', 'Gearbox bracket and a gear', c => sub(c, 'bracket') >= 1 && sub(c, 'gear') >= 1);
  T('hinge-band', 'Spring Loaded', 'Hinge and a rubber band', c => c.has('hinge') && c.tag('band') >= 1);
  // pneumatics
  T('pneu-sys', 'Pneumatic System', 'Air tank, cylinder and solenoid', c => c.has('air-tank-200ml') && sub(c, 'cylinder') >= 1 && c.has('double-acting-solenoid'));
  T('pneu-wings', 'Wings', '2 pneumatic cylinders', c => sub(c, 'cylinder') >= 2);
  T('pneu-tank-tube', 'Plumbing', 'Air tank and tubing', c => c.has('air-tank-200ml') && c.has('v5-pneumatic-tubing-3m'));
  T('pneu-reg', 'Regulated', 'Pressure regulator and an air tank', c => c.has('pneumatic-pressure-regulator') && c.has('air-tank-200ml'));
  T('pneu-kit-plus', 'Extra Air', 'Pneumatics kit and a spare pneumatic part', c => c.has('v5-pneumatics-kit') && cat(c, 'pneumatics') >= 2);
  T('pneu-cyl-sizes', 'Every Stroke', '25, 50 and 75mm cylinders', c => ['25mm-stroke-pneumatic-cylinder', '50mm-stroke-pneumatic-cylinder', '75mm-stroke-pneumatic-cylinder'].every(c.has));
  T('pneu-clamp', 'Mogo Clamp', 'A cylinder and a High Stakes or Tipping Point item', c => sub(c, 'cylinder') >= 1 && (c.bySeason['high-stakes'] || c.bySeason['tipping-point']));
  T('pneu-wings-ou', 'Over Under Wings', 'Cylinder and an Over Under item', c => sub(c, 'cylinder') >= 1 && c.bySeason['over-under']);
  // field
  const wIdx = (c, color) => c.slots.findIndex(s => s.id === `${color}-field-wall`);
  T('white-gt-black', 'White > Black', 'A white wall rolled before a black wall', c => { const w = wIdx(c, 'white'), b = wIdx(c, 'black'); return w >= 0 && b >= 0 && w < b; });
  T('black-gt-white', 'Black > White', 'A black wall rolled before a white wall', c => { const w = wIdx(c, 'white'), b = wIdx(c, 'black'); return w >= 0 && b >= 0 && b < w; });
  T('walls-2', 'Corner', '2 field walls', c => sub(c, 'wall') >= 2);
  T('walls-4', 'Four Walls', '4 field walls', c => sub(c, 'wall') >= 4);
  T('walls-white-3', 'Whiteout', '3 white walls', c => c.cnt('white-field-wall') >= 3);
  T('walls-black-3', 'Blackout', '3 black walls', c => c.cnt('black-field-wall') >= 3);
  T('wall-tile', 'Field Corner', 'A wall and a field tile', c => sub(c, 'wall') >= 1 && sub(c, 'tile') >= 1);
  T('perimeter-tiles', 'Field Built', 'Field perimeter and a tile set', c => c.has('portable-competition-field-perimeter') && sub(c, 'tile') >= 1);
  T('full-field-plus', 'Event Ready', 'Full Field Setup and the Smart Field Controller', c => c.has('full-field-setup') && c.has('smart-field-controller'));
  T('full-field-manual', 'Ready for Override', 'Full Field Setup and the Override manual', c => c.has('full-field-setup') && c.has('override-game-manual'));
  T('field-ctrl-brain', 'Connected to Field Control', 'Smart Field Controller and a brain', c => c.has('smart-field-controller') && c.has('v5-robot-brain'));
  T('tile-bag', 'Packed Up', 'Tile bag and tiles', c => c.has('competition-tile-bag') && sub(c, 'tile') >= 1);
  T('field-plates', 'Bolted Down', 'Field element plates and a game element', c => c.has('field-element-plates-4-pack') && cat(c, 'element') >= 1);
  // elements
  T('triballs-2', 'Triball Pair', '2 triballs', c => c.cnt('over-under-triball') >= 2);
  T('rings-3', 'Ring Stack', '3 High Stakes rings', c => c.cnt('high-stakes-ring') >= 3);
  T('blocks-3', 'Block Party', '3 Push Back blocks', c => c.cnt('push-back-block') >= 3);
  T('pins-all', 'Full Pin Set', 'All four Override pin colors', c => ['override-red-blue-pin', 'override-red-yellow-pin', 'override-blue-yellow-pin', 'override-yellow-yellow-pin'].every(c.has));
  T('pin-cup', 'Capped', 'An Override pin and a cup', c => sub(c, 'pin') >= 1 && c.has('override-cup'));
  T('pins-3', 'Pin Collector', '3 Override pins', c => sub(c, 'pin') >= 3);
  T('pins-red-blue', 'Alliance Colors', 'Red/blue pin with a red/yellow and a blue/yellow pin', c => ['override-red-blue-pin', 'override-red-yellow-pin', 'override-blue-yellow-pin'].every(c.has));
  T('cups-2', 'Cup Stack', '2 Override cups', c => c.cnt('override-cup') >= 2);
  T('ball-era', 'Ball Games', 'Change Up ball and an Over Under triball', c => c.has('change-up-ball') && c.has('over-under-triball'));
  T('element-tour', 'Element Tour', 'Game elements from 3 different games', c => new Set(c.real.filter(i => i.cat === 'element').map(i => i.season)).size >= 3);
  T('game-kit-2', 'Two Seasons Stocked', '2 different full game kits', c => new Set(c.real.filter(i => (i.tags || []).includes('game-kit')).map(i => i.id)).size >= 2);
  // kits, money, events
  T('starter-super', 'Upgrade Path', 'Starter Kit and Super Kit', c => c.has('vex-v5-competition-starter-kit') && c.has('vex-v5-competition-super-kit'));
  T('bundles-2', 'Purchase Order', '2 classroom bundles', c => c.has('vex-v5-classroom-starter-bundle') && c.has('vex-v5-classroom-super-bundle'));
  T('bundle-and-screw', 'Forgot One Screw', 'A bundle and a single screw', c => sub(c, 'bundle') >= 1 && c.real.some(i => i.sub === 'screw' && !i.pack));
  T('trophy-notebook', 'Excellence Material', 'A trophy pack and the engineering notebook', c => sub(c, 'trophy') >= 1 && c.has('robotics-engineering-notebook'));
  T('trophy-meme', 'Undeserved', 'A trophy pack and a meme item', c => sub(c, 'trophy') >= 1 && cat(c, 'meme') >= 1);
  T('trophy-both', 'Trophy Case', 'Both trophy packs', c => c.has('championship-event-trophy-pack') && c.has('qualifying-event-trophy-pack'));
  T('inspection-pass', 'Passed Inspection', 'Sizing tool and license plate kit', c => c.has('on-field-robot-expansion-sizing-tool') && c.has('vex-v5-competition-license-plate-kit'));
  T('inspection-fail', "Didn't Pass Inspection", 'Sizing tool and an oversized robot', c => c.has('on-field-robot-expansion-sizing-tool') && c.has('robot-over-the-size-limit'), -15);
  T('safety-first', 'Safety First', 'Safety glasses and a tool', c => c.has('vex-safety-glasses') && sub(c, 'tool') >= 1);
  T('safety-drill', 'Wear Your Glasses', 'Safety glasses and the step drill bit', c => c.has('vex-safety-glasses') && c.has('step-drill-bit'));
  T('notebook-manual', 'Did the Research', 'Engineering notebook and a game manual', c => c.has('robotics-engineering-notebook') && cat(c, 'manual') >= 1);
  T('notebook-pair', 'Two Notebooks', 'A real notebook and one written the night before', c => c.has('robotics-engineering-notebook') && c.has('engineering-notebook-written-the-night-before'));
  T('pit', 'Pit Setup', 'A tool kit, a battery and a charger', c => c.real.some(i => (i.tags || []).includes('tool') && (i.tags || []).includes('kit')) && c.has('v5-robot-battery-li-ion-1100mah') && c.has('v5-robot-battery-charger'));
  T('mystery-screws', 'Sorting Day', 'Bag of mystery screws and a real screw', c => c.has('bag-of-mystery-screws') && sub(c, 'screw') >= 1);
  // memes
  T('stripped-drill', 'Extraction', 'Stripped screw and the step drill bit', c => c.has('stripped-screw') && c.has('step-drill-bit'));
  T('stripped-star', 'Should Have Used Star Drive', 'Stripped screw and a star drive key', c => c.has('stripped-screw') && c.real.some(i => i.sub === 'tool' && (i.tags || []).includes('star')));
  T('dead-brain', 'Spare Brain', 'Cracked brain and a working brain', c => c.has('brain-with-a-cracked-screen') && c.has('v5-robot-brain'));
  T('dead-battery-2', 'Nothing Works', 'Dead battery and a disconnected controller', c => c.has('dead-battery') && c.has('controller-disconnected-mid-match'), -10);
  T('hot-motor-6', 'Thermal Throttling', 'Overheated motor and 2 other motors', c => c.has('overheated-motor') && sub(c, 'motor') >= 2);
  T('zip-hero-snap', 'Held Together by Hope', 'Zip tie hero and a snapped rubber band', c => c.has('zip-tie-holding-the-whole-robot-together') && c.has('snapped-rubber-band'));
  T('auton-forward', 'Win Point Anyway', 'Forward-only auton and a field', c => c.has('auton-that-only-drives-forward') && (sub(c, 'game-field') || c.has('full-field-setup')));
  T('lost-key-screw', 'Where Did It Go', 'Lost hex key and a hex screw', c => c.has('lost-hex-key') && c.real.some(i => i.sub === 'screw' && (i.tags || []).includes('hex')));
  T('unplugged-brain', 'Check Your Cables', 'Unplugged cable and a brain', c => c.has('unplugged-smart-cable') && c.has('v5-robot-brain'));
  T('dead-port-motor', 'Swap Ports', 'Dead smart port and a motor', c => c.has('smart-port-that-stopped-working') && sub(c, 'motor') >= 1);
  T('bent-shaft-collar', 'Still Spins', 'Bent shaft and a shaft collar', c => c.has('bent-shaft') && sub(c, 'collar') >= 1);
  T('memes-and-trophy', 'Against All Odds', '2 memes and a trophy pack', c => cat(c, 'meme') >= 2 && sub(c, 'trophy') >= 1);
  T('low-battery-match', 'Swap the Battery', 'Battery at 12% and a full battery', c => c.has('battery-at-12') && c.has('v5-robot-battery-li-ion-1100mah'));
  T('rush-notebook-trophy', 'Somehow Won Design', 'Night-before notebook and a trophy pack', c => c.has('engineering-notebook-written-the-night-before') && sub(c, 'trophy') >= 1);

  // ===== N. pieces & packs =====
  def('packs-3', 'Bulk Order', '3+ multi-packs', c => c.tag('pack') >= 3);
  def('packs-6', 'Warehouse', 'Six multi-packs', c => c.tag('pack') >= 6);
  def('singles-6', 'Loose Parts', 'Six single parts, no packs or kits', c => c.n === 6 && c.real.every(i => !i.pack && !(i.tags || []).includes('kit')));
  def('pieces-200', 'Pile of Parts', '200+ pieces in total', c => c.pieces >= 200);
  def('pieces-500', 'Parts Avalanche', '500+ pieces in total', c => c.pieces >= 500);
  def('kits-3', 'Kit Bash', '3+ kits', c => c.tag('kit') >= 3);
  def('sku-276-6', 'Catalog Regular', 'Six items with 276- SKUs', c => c.real.filter(i => /^276-/.test(i.sku || '')).length >= 6);
  def('sku-275-3', 'Classic SKUs', '3 items with 275- SKUs', c => c.real.filter(i => /^275-/.test(i.sku || '')).length >= 3);
  def('negative-items', 'Down Bad', '3 items worth negative XP', c => c.real.filter(i => i.xp < 0).length >= 3, -20);
  def('xp-items-high', 'All Stars', 'Every real item worth 20+ XP on its own', c => c.n === 6 && c.real.every(i => i.xp >= 20));

  root.VEX_COMBOS = C;
  root.VEX_buildCtx = buildCtx;
  root.VEX_BY_ID = BY_ID;
})(typeof window !== 'undefined' ? window : globalThis);
