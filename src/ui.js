const money = (n) => `$${Number(n || 0).toFixed(0)}`;
const recipes = [
  { id: 'choco', name: 'Double Choc', detail: 'Rich cocoa, happy crowds', cost: 120, emoji: '◉', price: 4.2 },
  { id: 'berry', name: 'Berry Swirl', detail: 'A little fruity, a lot fancy', cost: 210, emoji: '✿', price: 5 },
  { id: 'rainbow', name: 'Rainbow Chip', detail: 'The neighborhood favorite', cost: 340, emoji: '✦', price: 6 },
];
const decors = [
  { id: 'mint', name: 'Minty fresh', emoji: '◈', cost: 160 }, { id: 'pink', name: 'Strawberry cream', emoji: '✿', cost: 240 }, { id: 'midnight', name: 'Starlight bakery', emoji: '✦', cost: 390 },
];
const outfits = [
  { id: 'mint', name: 'Mint apron', emoji: '◈', cost: 95 }, { id: 'berry', name: 'Berry baker', emoji: '♥', cost: 160 }, { id: 'star', name: 'Star chef', emoji: '✦', cost: 280 },
];
function button(action, label, cls = '', payload = '', extra = '') {
  return `<button class="button ${cls}" data-action="${action}" ${payload ? `data-payload="${payload}"` : ''} ${extra}>${label}</button>`;
}
function iconButton(action, title, symbol, payload = '') {
  return `<button class="icon-button" data-action="${action}" ${payload ? `data-payload="${payload}"` : ''} title="${title}" aria-label="${title}">${symbol}</button>`;
}
function panelTabs(current) {
  const tabs = [['plan', 'Today'], ['missions', 'Missions'], ['upgrades', 'Shop'], ['recipes', 'Recipes'], ['decor', 'Decor'], ['customize', 'Kevin']];
  return `<nav class="panel-tabs">${tabs.map(([id, name]) => `<button data-action="panel" data-payload="${id}" class="tab ${current === id || (id === 'plan' && ['service', 'report'].includes(current)) ? 'active' : ''}">${name}</button>`).join('')}</nav>`;
}
function planPanel(s) {
  const unitCost = Math.max(0.25, 0.45 - s.oven * 0.04 + (s.recipes.length - 1) * .04);
  return `<div class="panel-heading"><div><div class="eyebrow">DAY ${s.day > 30 ? `${s.day} · FREE PLAY` : String(s.day).padStart(2, '0')} / ${s.day > 30 ? '∞' : '30'}</div><h2>Plan your day</h2></div><span class="open-tag"><i></i> Shop is closed</span></div>
    <p class="panel-note">A good batch, a fair price, and a little buzz around town.</p>
    <label class="field-label" for="batch">Cookies to bake <strong>${s.batch}</strong></label>
    <input id="batch" type="range" min="5" max="120" step="5" value="${s.batch}" data-key="batch" aria-label="Cookies to bake" />
    <div class="range-caption"><span>5 cookies</span><span>Ingredient cost <b>${money(Number(s.batch) * unitCost)}</b></span><span>120 cookies</span></div>
    <label class="field-label" for="price">Price per cookie <strong>$${Number(s.price).toFixed(2)}</strong></label>
    <input id="price" type="range" min="1" max="12" step="0.25" value="${s.price}" data-key="price" aria-label="Price per cookie" />
    <div class="range-caption"><span>Budget friendly</span><span>Best around $3–4</span><span>Premium</span></div>
    <label class="field-label" for="ads">Advertising budget <strong>${money(s.adBudget)}</strong></label>
    <input id="ads" type="range" min="0" max="${Math.min(200, Math.floor(s.cash))}" step="2" value="${s.adBudget}" data-key="adBudget" aria-label="Advertising budget" />
    <div class="range-caption"><span>No ads</span><span>More ads bring more customers</span><span>$200</span></div>
    <div class="cost-preview"><span>Ingredients <b>${money(Number(s.batch) * unitCost)}</b></span><span>Advertising <b>${money(s.adBudget)}</b></span><span>Daily running cost <b>${money(8 + Math.floor(s.level * 1.5))}</b></span></div>
    ${button('start-day', `Open for business <span>→</span>`, 'primary wide', '', s.runningDay || s.paused ? 'disabled' : '')}
    <div class="hint-line">${s.cash < 12 ? 'Cash is tight — try a smaller batch and no ads.' : 'Your ingredients and ads are paid before opening.'}</div>`;
}
function servicePanel(s, customerMetrics = {}) {
  const d = s.dayStats || { baked: 0, sold: 0, revenue: 0, customers: 0 };
  const bake = s.baking;
  const bakedPercent = bake ? Math.round(bake.progress * 100) : 100;
  const bakeLabel = bake?.ready ? 'BATCH READY' : bake ? 'BAKING COOKIES' : 'OVEN IDLE';
  return `<div class="panel-heading"><div><div class="eyebrow">THE DOOR IS OPEN</div><h2>Cookie o’clock!</h2></div><span class="open-tag open"><i></i> Serving</span></div>
    <p class="panel-note">Your neighbors are popping in for something sweet.</p>
    <div class="production-status"><div class="production-heading"><span>♨ &nbsp; OVEN</span><b class="${bake?.ready ? 'ready' : ''}">${bakeLabel}</b></div><div class="progress-track"><i style="width:${bakedPercent}%"></i></div><div class="production-caption"><span>${bake?.ready ? `${bake.total} cookies added to inventory` : bake ? `Baking ${bake.total} cookies…` : 'Today’s batch is complete'}</span><b>${bakedPercent}%</b></div></div>
    <div class="service-stage"><div class="service-icon">☼</div><div class="service-copy"><strong>${d.sold} <small>cookies sold</small></strong><span>${customerMetrics.served || 0} customers served</span></div><div class="progress-track"><i style="width:${Math.min(100, d.baked ? d.sold / d.baked * 100 : 0)}%"></i></div><div class="service-foot"><span>Revenue <b>${money(d.revenue)}</b></span><span>In stock <b>${s.inventory}</b></span></div></div>
    <div class="customer-status-grid"><div><span>Customers</span><b>${d.customers} / ${d.targetCustomers || customerMetrics.total || 0}</b></div><div><span>In queue</span><b>${customerMetrics.queue || 0}</b></div><div><span>In shop</span><b>${customerMetrics.active || 0}</b></div></div>
    <div class="baking-tip">✦ <span><b>Oven and counter</b><br>Cookies are baked automatically. Neighbors join the queue and buy from your current stock.</span></div>
    ${s.paused ? button('pause', '▶ &nbsp; Resume the day', 'primary wide') : button('pause', 'Ⅱ &nbsp; Pause the day', 'soft wide')}`;
}
function reportPanel(s) {
  const r = s.report; if (!r) return planPanel(s);
  return `<div class="panel-heading"><div><div class="eyebrow">DAY ${Math.max(1, s.day - 1)} COMPLETE</div><h2>Your daily bake</h2></div><span class="report-stamp">✦</span></div>
    <div class="report-total"><div><span>Day profit</span><strong class="${r.profit >= 0 ? 'positive' : 'negative'}">${r.profit >= 0 ? '+' : ''}${money(r.profit)}</strong></div><span class="report-sub">${r.sold} cookie${r.sold === 1 ? '' : 's'} found a happy home</span></div>
    <div class="report-grid"><div><span>Cookies baked</span><b>${r.baked}</b></div><div><span>Cookies sold</span><b>${r.sold}</b></div><div><span>Left on shelf</span><b>${r.unsold}</b></div><div><span>Revenue</span><b>${money(r.revenue)}</b></div><div><span>Ingredients</span><b>−${money(r.ingredients)}</b></div><div><span>Advertising</span><b>−${money(r.ads)}</b></div><div><span>Shop running costs</span><b>−${money(r.operating)}</b></div><div><span>Customers</span><b>${r.customers}</b></div></div>
    <div class="satisfaction"><div><span>Customer smiles</span><b>${r.satisfaction}%</b></div><div class="progress-track"><i style="width:${r.satisfaction}%"></i></div><div class="smile-ends"><span>Needs love</span><span>Sweet smiles</span></div></div>
    <div class="cash-strip"><span>Cash in till</span><b>${money(r.cash)}</b></div>
    ${button('panel', `Plan day ${s.day} <span>→</span>`, 'primary wide', 'plan')}`;
}
function missionPanel(s) {
  const m = s.mission; const progress = Math.min(100, Math.round(m.progress / m.goal * 100));
  return `<div class="panel-heading"><div><div class="eyebrow">A LITTLE EXTRA GOES A LONG WAY</div><h2>Daily mission</h2></div><div class="mission-icon">✦</div></div>
    <div class="mission-card"><div class="mission-type">TODAY'S SWEET CHALLENGE</div><h3>${m.name}</h3><p>Sell ${m.goal} cookies to local customers. Every cookie counts toward your neighborhood fame.</p><div class="progress-track"><i style="width:${progress}%"></i></div><div class="mission-foot"><span>${Math.min(m.goal, m.progress)} of ${m.goal} cookies</span><b>+${money(m.reward)}</b></div></div>
    ${m.ready ? button('claim-mission', `Collect ${money(m.reward)} reward ✦`, 'primary wide') : `<div class="mission-status">${m.claimed ? '✓ Mission reward collected — nice baking!' : s.runningDay ? 'Keep serving those warm cookies!' : 'Complete the challenge during a business day.'}</div>`}
    <div class="achievement-list"><h3>Little wins</h3>${s.achievements.length ? s.achievements.slice(-5).map(a => `<div class="achievement-row"><span>✦</span><span>${a}</span><b>Earned</b></div>`).join('') : '<div class="empty-achievements">Your first achievement is waiting just around the corner.</div>'}</div>`;
}
function upgradesPanel(s) {
  const items = [['oven', 'Oven power', 'Bakes more cookies each day', 120 + s.oven * 95, s.oven], ['counter', 'Pretty counter', 'More room to serve guests', 100 + s.level * 55, s.counter], ['shelves', 'Cookie shelves', 'Keeps the display stocked', 85 + s.level * 45, s.shelves]];
  return `<div class="panel-heading"><div><div class="eyebrow">MAKE THE SHOP YOURS</div><h2>Shop upgrades</h2></div><div class="coin-stack">◉</div></div><div class="upgrade-level"><div><span>SHOP LEVEL</span><b>Level ${s.level}</b></div><div class="progress-track"><i style="width:${Math.min(100, s.shopXP / (s.level * 70) * 100)}%"></i></div><small>${s.shopXP} / ${s.level * 70} baker points</small></div>
    <div class="upgrade-list">${items.map(([id, name, desc, cost, level]) => `<div class="upgrade-row"><div class="upgrade-art">${id === 'oven' ? '♨' : id === 'counter' ? '▰' : '▤'}</div><div class="upgrade-text"><b>${name}</b><span>${desc}</span><div class="upgrade-dots">${Array.from({ length: 5 }, (_, i) => `<i class="${i < level ? 'filled' : ''}"></i>`).join('')}</div></div>${button('upgrade', level >= 5 ? 'MAX' : money(cost), level >= 5 ? 'tiny disabled' : 'tiny', id, level >= 5 ? 'disabled' : '')}</div>`).join('')}</div>
    <div class="unlock-note">✦ Reach higher shop levels to become the sweetest shop on the block.</div>`;
}
function recipesPanel(s) {
  return `<div class="panel-heading"><div><div class="eyebrow">FRESH FROM KEVIN'S RECIPE BOOK</div><h2>Secret recipes</h2></div><div class="recipe-icon">✿</div></div><div class="recipe-list"><div class="recipe-row owned"><span class="recipe-badge">●</span><div><b>Classic cookie</b><small>Warm, golden, everybody's favorite</small></div><span class="owned-tag">YOURS</span></div>${recipes.map(r => `<div class="recipe-row ${s.recipes.includes(r.id) ? 'owned' : ''}"><span class="recipe-badge">${r.emoji}</span><div><b>${r.name}</b><small>${r.detail} · ${money(r.price)} each</small></div>${s.recipes.includes(r.id) ? '<span class="owned-tag">YOURS</span>' : button('recipe', money(r.cost), 'tiny', r.id)}</div>`).join('')}</div><div class="unlock-note">New recipes cost more to make but customers will pay a little extra.</div>`;
}
function decorPanel(s) {
  return `<div class="panel-heading"><div><div class="eyebrow">MAKE YOUR SHOP FEEL LIKE HOME</div><h2>Bakery decor</h2></div><div class="mission-icon">✿</div></div><div class="decor-preview"><span>YOUR BAKERY, YOUR COLORS</span><div class="decor-swatches">${[['cozy', '#dce9e7'], ['mint', '#d4e8df'], ['pink', '#f1d5dc'], ['midnight', '#cfd5e3']].map(([id, color]) => `<button data-action="theme" data-payload="${id}" aria-label="${id} bakery theme" class="swatch ${s.decor === id ? 'selected' : ''}" style="--swatch:${color}"></button>`).join('')}</div></div><div class="upgrade-list">${decors.map(d => `<div class="upgrade-row"><div class="upgrade-art decor-art">${d.emoji}</div><div class="upgrade-text"><b>${d.name}</b><span>Give the bakery a fresh new look</span></div>${s.decor === d.id ? '<span class="owned-tag">ON</span>' : button('decor', money(d.cost), 'tiny', d.id)}</div>`).join('')}</div><div class="unlock-note">Choose a color above to preview it. Decorations are a one-time purchase.</div>`;
}
function customizePanel(s) {
  return `<div class="panel-heading"><div><div class="eyebrow">HEAD BAKER, BIG STYLE</div><h2>Kevin's look</h2></div><div class="kevin-icon">☺</div></div><div class="customize-preview"><span class="kevin-silhouette">☺</span><div><b>Hi, I'm Kevin!</b><span>Your friendly neighborhood baker.</span></div></div><div class="upgrade-list">${outfits.map(o => `<div class="upgrade-row"><div class="upgrade-art outfit-art">${o.emoji}</div><div class="upgrade-text"><b>${o.name}</b><span>A fresh apron for a fresh bake</span></div>${s.outfit === o.id ? '<span class="owned-tag">ON</span>' : button('outfit', money(o.cost), 'tiny', o.id)}</div>`).join('')}</div><div class="unlock-note">Kevin's apron changes in the 3D bakery as soon as you choose.</div>`;
}
function settingsPanel(s) {
  return `<div class="panel-heading"><div><div class="eyebrow">MAKE YOURSELF AT HOME</div><h2>Settings</h2></div><div class="mission-icon">⚙</div></div><div class="setting-row"><div><b>Game sound</b><span>Gentle chimes as cookies sell</span></div>${button('sound', s.sound ? 'On' : 'Off', `toggle ${s.sound ? 'selected' : ''}`)}</div><div class="setting-row"><div><b>Camera controls</b><span>Drag to orbit and scroll to zoom</span></div>${button('camera', s.cameraLocked ? 'Locked' : 'On', `toggle ${s.cameraLocked ? '' : 'selected'}`)}</div><div class="setting-row"><div><b>Save progress</b><span>Autosaves on this device</span></div><span class="saved-pill">✓ Saved</span></div><div class="settings-actions">${button('menu', 'Back to main menu', 'soft wide')}${button('pause', s.paused ? 'Resume the shop' : 'Pause the game', 'primary wide')}</div>`;
}
function pauseModal(s) {
  if (!s.paused) return '';
  return `<div class="modal-scrim"><section class="pause-card"><button class="modal-close" data-action="pause" aria-label="Resume game">×</button><div class="pause-mark">Ⅱ</div><div class="eyebrow">COOKIE TYCOON 3D</div><h2>Shop is on a break</h2><p>Your progress saves automatically, so your cookies will be right where you left them.</p>${button('pause', '▶ &nbsp; Back to the bakery', 'primary wide')}${button('settings', '⚙ &nbsp; Game settings', 'soft wide')}${button('menu', '⌂ &nbsp; Main menu', 'text-button wide')}</section></div>`;
}
function header(s) {
  const shopStatus = s.paused ? 'PAUSED' : s.runningDay ? 'OPEN' : 'CLOSED';
  return `<header class="topbar"><button class="brand-lockup" data-action="menu" aria-label="Return to main menu"><span class="brand-cookie">●</span><span><b>BUJJU <i>GAMES</i></b><small>COOKIE TYCOON 3D</small></span></button><div class="top-stat day-stat"><span class="stat-icon">☀</span><span><small>DAY</small><b>${s.day > 30 ? `∞ ${s.day}` : `${String(s.day).padStart(2, '0')} <i>/ 30</i>`}</b></span></div><div class="top-stat inventory-stat" aria-label="${s.inventory} cookies in inventory"><span class="stat-icon">▤</span><span><small>INVENTORY</small><b>${s.inventory}</b></span></div><div class="top-stat cash-stat"><span class="stat-icon">$</span><span><small>IN THE TILL</small><b>${money(s.cash)}</b></span></div><div class="top-stat rep-stat"><span class="stat-icon">♥</span><span><small>NEIGHBORHOOD LOVE</small><b>${Math.round(s.reputation)}<i>/100</i></b></span></div><div class="top-stat shop-status-stat ${s.runningDay && !s.paused ? 'status-open' : ''}" aria-label="Shop ${shopStatus.toLowerCase()}"><span class="shop-status-dot"></span><span class="status-copy"><small>SHOP</small><b>${shopStatus}</b></span></div><div class="top-actions">${iconButton('rotate', 'Rotate the bakery left', '↶', '-1')}${iconButton('rotate', 'Rotate the bakery right', '↷', '1')}${iconButton('zoom', 'Zoom in', '+', '-1')}${iconButton('zoom', 'Zoom out', '−', '1')}${iconButton('settings', 'Settings', '⚙')}${iconButton('pause', 'Pause game', 'Ⅱ')}</div></header>`;
}
function bottomNav(current) {
  const items = [['plan', '⌂', 'Plan'], ['missions', '✦', 'Mission'], ['upgrades', '▤', 'Shop'], ['customize', '☺', 'Kevin']];
  return `<nav class="bottom-nav">${items.map(([id, icon, label]) => `<button data-action="panel" data-payload="${id}" class="${current === id ? 'active' : ''}"><span>${icon}</span>${label}</button>`).join('')}</nav>`;
}
function gameScreen(s, customerMetrics) {
  let content = s.panel === 'missions' ? missionPanel(s) : s.panel === 'upgrades' ? upgradesPanel(s) : s.panel === 'recipes' ? recipesPanel(s) : s.panel === 'decor' ? decorPanel(s) : s.panel === 'customize' ? customizePanel(s) : s.panel === 'settings' ? settingsPanel(s) : s.panel === 'service' ? servicePanel(s, customerMetrics) : s.panel === 'report' ? reportPanel(s) : planPanel(s);
  return `${header(s)}<div class="world-hint"><span>✥</span> YOUR LITTLE CORNER OF THE WORLD <small>DRAG TO LOOK AROUND · CLICK TO EXPLORE</small></div><div class="object-hints"><span><i>♨</i> Ovens</span><span><i>▰</i> Counter</span><span><i>✦</i> Mission board</span></div><aside class="game-panel">${panelTabs(s.panel)}<div class="panel-scroll">${content}</div></aside>${bottomNav(s.panel)}${pauseModal(s)}`;
}
function menuScreen(s) {
  return `<div class="menu-scene">${header(s)}<div class="menu-copy"><div class="brand-kicker"><span>✦</span> A BUJJU GAMES ORIGINAL</div><h1>Cookie<br><span>Tycoon 3D</span></h1><p>One little bakery. Thirty sweet days.<br>Can you become the neighborhood's favorite?</p><div class="menu-buttons">${button('new-game', 'Start a new shop <span>→</span>', 'primary wide')}${s.hasSave ? button('continue', 'Continue your bakery', 'soft wide') : ''}</div><div class="menu-note">✦ &nbsp;Your progress saves automatically on this device</div></div><div class="menu-footer"><span>BAKE SOMETHING WONDERFUL</span><span>✦ &nbsp; BUILT FOR BAKERS WITH BIG DREAMS</span></div></div>${pauseModal(s)}`;
}
function resultsScreen(s) {
  const r = s.report || { profit: 0, sold: 0, cash: s.cash };
  return `<div class="results-scene"><div class="results-brand">BUJJU <span>GAMES</span> <i>✦</i></div><div class="results-card"><div class="results-cookie">✦</div><div class="eyebrow">COOKIE TYCOON 3D · THAT'S A WRAP!</div><h1>What a sweet<br><span>30 days.</span></h1><p>From your first batch to the town's favorite bakery — look what you baked!</p><div class="final-stats"><div><span>FINAL CASH</span><b>${money(s.cash)}</b></div><div><span>LAST DAY PROFIT</span><b class="${r.profit >= 0 ? 'positive' : 'negative'}">${r.profit >= 0 ? '+' : ''}${money(r.profit)}</b></div><div><span>BAKERY LEVEL</span><b>Level ${s.level}</b></div><div><span>NEIGHBORHOOD LOVE</span><b>${Math.round(s.reputation)} / 100</b></div></div><div class="result-achievement">✦ &nbsp; Achievement unlocked: <b>30-day baker</b></div>${button('free-play', 'Keep baking · Free play <span>→</span>', 'primary wide')}${button('menu', 'Return to main menu', 'text-button wide')}</div><div class="results-footer">THANKS FOR MAKING OUR NEIGHBORHOOD A LITTLE SWEETER</div></div>`;
}
export function renderApp(root, state, { act, customerMetrics }) {
  root.innerHTML = state.screen === 'menu' ? menuScreen(state) : state.screen === 'results' ? resultsScreen(state) : gameScreen(state, customerMetrics);
  root.onclick = (event) => {
    const control = event.target.closest('[data-action]'); if (!control || control.disabled) return;
    event.stopPropagation();
    const action = control.dataset.action; let payload = control.dataset.payload;
    if (action === 'set') return;
    if (action === 'rotate' || action === 'zoom') payload = Number(payload);
    act(action, payload);
  };
  root.oninput = (event) => {
    const el = event.target.closest('[data-key]'); if (!el) return;
    const key = el.dataset.key; const value = Number(el.value);
    const valueLabel = el.closest('.panel-scroll')?.querySelector(`label[for="${el.id}"] strong`);
    if (valueLabel) valueLabel.textContent = key === 'price' ? `$${value.toFixed(2)}` : key === 'adBudget' ? money(value) : `${value}`;
    if (key === 'batch') { const cost = el.closest('.panel-scroll')?.querySelector('.cost-preview span b'); if (cost) cost.textContent = money(value * (.45 + state.recipes.length * .04)); }
    state[key] = value;
    try { localStorage.setItem('bujju-cookie-tycoon-v1', JSON.stringify({ ...state, screen: 'game', runningDay: false, paused: false, dayStats: null })); } catch { /* memory only */ }
  };
  root.onchange = (event) => {
    const el = event.target.closest('[data-key]'); if (!el) return;
    const key = el.dataset.key; state[key] = Number(el.value);
    // Keep the handle/input state and recalculate dependent affordability hints.
    const labels = root.querySelectorAll('.field-label');
    labels.forEach(label => { const strong = label.querySelector('strong'); if (strong?.textContent) return; });
  };
}

let toastTimer;
export function toast(message) {
  const el = document.querySelector('#toast'); if (!el) return;
  el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2900);
}
