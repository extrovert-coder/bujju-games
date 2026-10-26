import { RECIPES, UPGRADE_DEFINITIONS, ACHIEVEMENTS, getRecipe } from './content.js';

const money = (n) => `$${Number(n || 0).toFixed(0)}`;

const decors = [
  { id: 'cozy', name: 'Cozy Honey', emoji: '✿', cost: 0 },
  { id: 'mint', name: 'Minty Fresh', emoji: '◈', cost: 160 },
  { id: 'pink', name: 'Strawberry Cream', emoji: '✿', cost: 240 },
  { id: 'midnight', name: 'Starlight Bakery', emoji: '✦', cost: 390 },
];

const outfits = [
  { id: 'classic', name: 'Classic Apron', emoji: '☺', cost: 0 },
  { id: 'mint', name: 'Mint Baker', emoji: '◈', cost: 95 },
  { id: 'berry', name: 'Berry Chef', emoji: '♥', cost: 160 },
  { id: 'star', name: 'Star Confectioner', emoji: '✦', cost: 280 },
];

function button(action, label, cls = '', payload = '', extra = '') {
  return `<button class="button ${cls}" data-action="${action}" ${payload ? `data-payload="${payload}"` : ''} ${extra}>${label}</button>`;
}

function iconButton(action, title, symbol, payload = '') {
  return `<button class="icon-button" data-action="${action}" ${payload ? `data-payload="${payload}"` : ''} title="${title}" aria-label="${title}">${symbol}</button>`;
}

function panelTabs(current) {
  const tabs = [
    ['plan', 'Today'],
    ['missions', 'Missions'],
    ['upgrades', 'Shop'],
    ['recipes', 'Recipes'],
    ['achievements', 'Wins'],
    ['decor', 'Decor'],
    ['customize', 'Kevin'],
  ];
  return `<nav class="panel-tabs">${tabs
    .map(
      ([id, name]) =>
        `<button data-action="panel" data-payload="${id}" class="tab ${
          current === id || (id === 'plan' && ['service', 'report'].includes(current)) ? 'active' : ''
        }">${name}</button>`
    )
    .join('')}</nav>`;
}

function getMaxBatchForOven(ovenLevel) {
  const levels = [30, 50, 70, 90, 115, 140];
  return levels[Math.min(5, Math.max(0, ovenLevel || 0))];
}

function planPanel(s) {
  const recipe = getRecipe(s.selectedRecipe);
  const maxBatch = getMaxBatchForOven(s.oven);
  const unitCost = Math.max(0.18, recipe.ingredientCost * (1 - s.oven * 0.05));
  const batch = Math.min(maxBatch, Math.max(5, Number(s.batch || 30)));
  const ingredientTotal = batch * unitCost;
  const operatingCost = 8 + Math.floor(s.level * 1.5);
  const totalUpfront = ingredientTotal + Number(s.adBudget || 0) + operatingCost;

  return `<div class="panel-heading">
    <div>
      <div class="eyebrow">DAY ${s.day > 30 ? `${s.day} · FREE PLAY` : String(s.day).padStart(2, '0')} / ${s.day > 30 ? '∞' : '30'}</div>
      <h2>Plan your day</h2>
    </div>
    <span class="open-tag"><i></i> Shop is closed</span>
  </div>
  <p class="panel-note">Choose your recipe, set your batch, and open the bakery!</p>

  <!-- Recipe Featured Card -->
  <div class="active-recipe-card">
    <div class="active-recipe-header">
      <span class="recipe-badge">${recipe.emoji}</span>
      <div>
        <div class="active-recipe-title">TODAY’S RECIPE: <b>${recipe.name}</b></div>
        <small>${recipe.detail}</small>
      </div>
      <button class="button tiny soft" data-action="panel" data-payload="recipes">Change</button>
    </div>
    <div class="recipe-perks">
      <span>Cost: <b>$${unitCost.toFixed(2)}</b>/ea</span>
      <span>Rec. Price: <b>$${recipe.recommendedPrice.toFixed(2)}</b></span>
      <span>Demand: <b>+${Math.round((recipe.demand - 1) * 100)}%</b></span>
    </div>
  </div>

  <label class="field-label" for="batch">Cookies to bake <strong>${batch} cookies</strong></label>
  <input id="batch" type="range" min="5" max="${maxBatch}" step="5" value="${batch}" data-key="batch" aria-label="Cookies to bake" />
  <div class="range-caption">
    <span>5 min</span>
    <span>Oven cap: <b>${maxBatch}</b> (Lvl ${s.oven})</span>
    <span>Ingredients: <b>${money(ingredientTotal)}</b></span>
  </div>

  <label class="field-label" for="price">Price per cookie <strong>$${Number(s.price).toFixed(2)}</strong></label>
  <input id="price" type="range" min="1" max="15" step="0.25" value="${s.price}" data-key="price" aria-label="Price per cookie" />
  <div class="range-caption">
    <span>Budget friendly</span>
    <span>Rec: <b>$${recipe.recommendedPrice.toFixed(2)}</b> (Margin $${(Number(s.price) - unitCost).toFixed(2)})</span>
    <span>Premium</span>
  </div>

  <label class="field-label" for="ads">Advertising budget <strong>${money(s.adBudget)}</strong></label>
  <input id="ads" type="range" min="0" max="${Math.min(250, Math.max(50, Math.floor(s.cash)))}" step="2" value="${s.adBudget}" data-key="adBudget" aria-label="Advertising budget" />
  <div class="range-caption">
    <span>Word of mouth</span>
    <span>Draws more sweet neighbors</span>
    <span>High buzz</span>
  </div>

  <div class="cost-preview">
    <span>Ingredients (${batch} × $${unitCost.toFixed(2)}) <b>${money(ingredientTotal)}</b></span>
    <span>Advertising budget <b>${money(s.adBudget)}</b></span>
    <span>Daily shop upkeep <b>${money(operatingCost)}</b></span>
    <span class="total-row">Total upfront cost <b>${money(totalUpfront)}</b></span>
  </div>

  ${button(
    'start-day',
    `Open for business <span>→</span>`,
    'primary wide',
    '',
    s.runningDay || s.paused || s.cash < totalUpfront ? 'disabled' : ''
  )}
  <div class="hint-line">
    ${s.cash < totalUpfront ? `Cash is short! You need ${money(totalUpfront)}. Try a smaller batch or fewer ads.` : 'Baking starts immediately when you open.'}
  </div>`;
}

function servicePanel(s, customerMetrics = {}) {
  const d = s.dayStats || { baked: 0, sold: 0, revenue: 0, customers: 0 };
  const bake = s.baking;
  const bakedPercent = bake ? Math.round(bake.progress * 100) : 100;
  const bakeLabel = bake?.ready ? 'BATCH READY' : bake ? 'BAKING FRESH COOKIES' : 'OVEN IDLE';
  const recipe = getRecipe(s.selectedRecipe);

  return `<div class="panel-heading">
    <div>
      <div class="eyebrow">THE DOORS ARE OPEN</div>
      <h2>Cookie o’clock!</h2>
    </div>
    <span class="open-tag open"><i></i> Serving</span>
  </div>
  <p class="panel-note">Baking ${recipe.name} — fresh aromas are filling the street!</p>

  <div class="production-status">
    <div class="production-heading">
      <span>♨ &nbsp; OVEN STATUS (LVL ${s.oven})</span>
      <b class="${bake?.ready ? 'ready' : ''}">${bakeLabel}</b>
    </div>
    <div class="progress-track"><i style="width:${bakedPercent}%"></i></div>
    <div class="production-caption">
      <span>${bake?.ready ? `✦ ${bake.total} fresh cookies delivered to shelves!` : bake ? `Baking batch of ${bake.total} cookies…` : 'Today’s batch complete'}</span>
      <b>${bakedPercent}%</b>
    </div>
  </div>

  <div class="service-stage">
    <div class="service-icon">☼</div>
    <div class="service-copy">
      <strong>${d.sold} <small>cookies sold</small></strong>
      <span>${customerMetrics.served || d.customers || 0} customers served today</span>
    </div>
    <div class="progress-track"><i style="width:${Math.min(100, d.baked ? (d.sold / d.baked) * 100 : 0)}%"></i></div>
    <div class="service-foot">
      <span>Revenue <b>${money(d.revenue)}</b></span>
      <span>In stock <b>${s.inventory}</b></span>
    </div>
  </div>

  <div class="customer-status-grid">
    <div>
      <span>Neighbors</span>
      <b>${d.customers} / ${d.targetCustomers || customerMetrics.total || 0}</b>
    </div>
    <div>
      <span>Queue room</span>
      <b>${customerMetrics.queue || 0} / ${5 + s.counter}</b>
    </div>
    <div>
      <span>In bakery</span>
      <b>${customerMetrics.active || 0}</b>
    </div>
  </div>

  <div class="baking-tip">
    ✦ <span><b>Customer Smiles</b><br>Happy customers jump and celebrate when served! Fresh cookies restock automatically.</span>
  </div>
  ${s.paused ? button('pause', '▶ &nbsp; Resume day', 'primary wide') : button('pause', 'Ⅱ &nbsp; Pause day', 'soft wide')}`;
}

function reportPanel(s) {
  const r = s.report;
  if (!r) return planPanel(s);
  return `<div class="panel-heading">
    <div>
      <div class="eyebrow">DAY ${Math.max(1, s.day - 1)} COMPLETED</div>
      <h2>Daily bake report</h2>
    </div>
    <span class="report-stamp">✦</span>
  </div>
  <div class="report-total">
    <div>
      <span>Net day profit</span>
      <strong class="${r.profit >= 0 ? 'positive' : 'negative'}">${r.profit >= 0 ? '+' : ''}${money(r.profit)}</strong>
    </div>
    <span class="report-sub">${r.sold} cookie${r.sold === 1 ? '' : 's'} sold to happy neighbors</span>
  </div>
  <div class="report-grid">
    <div><span>Cookies baked</span><b>${r.baked}</b></div>
    <div><span>Cookies sold</span><b>${r.sold}</b></div>
    <div><span>Leftover stock</span><b>${r.unsold}</b></div>
    <div><span>Gross revenue</span><b>${money(r.revenue)}</b></div>
    <div><span>Ingredient costs</span><b>−${money(r.ingredients)}</b></div>
    <div><span>Advertising</span><b>−${money(r.ads)}</b></div>
    <div><span>Shop operating</span><b>−${money(r.operating)}</b></div>
    <div><span>Customers served</span><b>${r.customers}</b></div>
  </div>
  <div class="satisfaction">
    <div>
      <span>Neighborhood smiles</span>
      <b>${r.satisfaction}%</b>
    </div>
    <div class="progress-track"><i style="width:${r.satisfaction}%"></i></div>
    <div class="smile-ends"><span>Needs love</span><span>Sweet joy</span></div>
  </div>
  <div class="cash-strip">
    <span>Cash in the till</span>
    <b>${money(r.cash)}</b>
  </div>
  ${button('panel', `Plan day ${s.day} <span>→</span>`, 'primary wide', 'plan')}`;
}

function missionPanel(s) {
  const m = s.mission;
  const progressPercent = Math.min(100, Math.round((m.progress / m.goal) * 100));
  const isClaimed = s.claimedMissions?.includes(m.id) || m.claimed;

  return `<div class="panel-heading">
    <div>
      <div class="eyebrow">NEIGHBORHOOD MISSIONS</div>
      <h2>Daily challenge</h2>
    </div>
    <div class="mission-icon">✦</div>
  </div>
  <div class="mission-card">
    <div class="mission-type">ACTIVE CHALLENGE</div>
    <h3>${m.name}</h3>
    <p>${m.description}</p>
    <div class="progress-track"><i style="width:${progressPercent}%"></i></div>
    <div class="mission-foot">
      <span>Progress: <b>${Math.min(m.goal, m.progress)} / ${m.goal}</b></span>
      <b>+${money(m.reward)}${m.recipeReward ? ' + Recipe Unlock' : ''}</b>
    </div>
  </div>
  ${
    m.ready && !isClaimed
      ? button('claim-mission', `Claim Reward: ${money(m.reward)} ✦`, 'primary wide')
      : `<div class="mission-status">${
          isClaimed
            ? '✓ Mission reward collected! Next sweet challenge ready.'
            : s.runningDay
            ? 'Keep serving warm cookies to complete!'
            : 'Progress updates automatically as you serve customers.'
        }</div>`
  }
  <div class="achievement-list">
    <h3>Completed milestones (${s.claimedMissions?.length || 0})</h3>
    ${
      s.claimedMissions?.length
        ? s.claimedMissions.map(id => `<div class="achievement-row"><span>✓</span><span>Milestone: ${id}</span><b>Claimed</b></div>`).join('')
        : '<div class="empty-achievements">Complete today’s mission to earn extra cash and unlock secret recipes!</div>'
    }
  </div>`;
}

function upgradesPanel(s) {
  const ovenDefs = UPGRADE_DEFINITIONS.oven;
  const counterDefs = UPGRADE_DEFINITIONS.counter;
  const shelvesDefs = UPGRADE_DEFINITIONS.shelves;

  const nextOven = ovenDefs[s.oven];
  const nextCounter = counterDefs[s.counter];
  const nextShelves = shelvesDefs[s.shelves];

  return `<div class="panel-heading">
    <div>
      <div class="eyebrow">EXPAND YOUR BAKERY</div>
      <h2>Shop upgrades</h2>
    </div>
    <div class="coin-stack">♨</div>
  </div>

  <div class="upgrade-level">
    <div>
      <span>BAKERY LEVEL</span>
      <b>Level ${s.level}</b>
    </div>
    <div class="progress-track"><i style="width:${Math.min(100, (s.shopXP / (s.level * 70)) * 100)}%"></i></div>
    <small>${s.shopXP} / ${s.level * 70} baker XP</small>
  </div>

  <div class="upgrade-list">
    <!-- Oven Upgrade -->
    <div class="upgrade-row">
      <div class="upgrade-art">♨</div>
      <div class="upgrade-text">
        <b>Oven Power (Lvl ${s.oven}/5)</b>
        <span>${nextOven ? nextOven.desc : 'Maxed! Fast baking, 140 batch capacity & 25% savings.'}</span>
        <div class="upgrade-dots">
          ${Array.from({ length: 5 }, (_, i) => `<i class="${i < s.oven ? 'filled' : ''}"></i>`).join('')}
        </div>
      </div>
      ${
        s.oven >= 5
          ? '<span class="owned-tag">MAX</span>'
          : button('upgrade', money(nextOven.cost), s.cash < nextOven.cost ? 'tiny disabled' : 'tiny primary', 'oven', s.cash < nextOven.cost ? 'disabled' : '')
      }
    </div>

    <!-- Counter Upgrade -->
    <div class="upgrade-row">
      <div class="upgrade-art">▰</div>
      <div class="upgrade-text">
        <b>Service Counter (Lvl ${s.counter}/5)</b>
        <span>${nextCounter ? nextCounter.desc : 'Maxed! Queue size of 10 with lightning service.'}</span>
        <div class="upgrade-dots">
          ${Array.from({ length: 5 }, (_, i) => `<i class="${i < s.counter ? 'filled' : ''}"></i>`).join('')}
        </div>
      </div>
      ${
        s.counter >= 5
          ? '<span class="owned-tag">MAX</span>'
          : button('upgrade', money(nextCounter.cost), s.cash < nextCounter.cost ? 'tiny disabled' : 'tiny primary', 'counter', s.cash < nextCounter.cost ? 'disabled' : '')
      }
    </div>

    <!-- Shelves Upgrade -->
    <div class="upgrade-row">
      <div class="upgrade-art">▤</div>
      <div class="upgrade-text">
        <b>Bakery Displays (Lvl ${s.shelves}/5)</b>
        <span>${nextShelves ? nextShelves.desc : 'Maxed! +80% customer foot traffic every day.'}</span>
        <div class="upgrade-dots">
          ${Array.from({ length: 5 }, (_, i) => `<i class="${i < s.shelves ? 'filled' : ''}"></i>`).join('')}
        </div>
      </div>
      ${
        s.shelves >= 5
          ? '<span class="owned-tag">MAX</span>'
          : button('upgrade', money(nextShelves.cost), s.cash < nextShelves.cost ? 'tiny disabled' : 'tiny primary', 'shelves', s.cash < nextShelves.cost ? 'disabled' : '')
      }
    </div>
  </div>
  <div class="unlock-note">✦ Upgrades permanently boost your daily baking capacity, checkout speed, and neighbor foot traffic.</div>`;
}

function recipesPanel(s) {
  return `<div class="panel-heading">
    <div>
      <div class="eyebrow">KEVIN’S SECRET RECIPE BOOK</div>
      <h2>Cookie recipes</h2>
    </div>
    <div class="recipe-icon">✿</div>
  </div>
  <p class="panel-note">Select which cookie recipe Kevin bakes today, or unlock new specialty treats!</p>

  <div class="recipe-list">
    ${RECIPES.map(r => {
      const isOwned = s.recipes.includes(r.id);
      const isSelected = s.selectedRecipe === r.id;
      return `<div class="recipe-row ${isOwned ? 'owned' : ''}">
        <span class="recipe-badge" style="background:${r.color}22; border-color:${r.color}66">${r.emoji}</span>
        <div>
          <b>${r.name} ${isSelected ? '<i class="active-pill">ACTIVE</i>' : ''}</b>
          <small>${r.detail}</small>
          <div class="recipe-stats-row">
            <span>Cost: $${r.ingredientCost.toFixed(2)}</span> ·
            <span>Price: $${r.recommendedPrice.toFixed(2)}</span> ·
            <span>Demand: +${Math.round((r.demand - 1) * 100)}%</span>
          </div>
        </div>
        ${
          isSelected
            ? '<span class="owned-tag">BAKING</span>'
            : isOwned
            ? button('select-recipe', 'Bake', 'tiny soft', r.id)
            : button('recipe', money(r.unlock.cost || 120), s.cash < (r.unlock.cost || 120) ? 'tiny disabled' : 'tiny primary', r.id, s.cash < (r.unlock.cost || 120) ? 'disabled' : '')
        }
      </div>`;
    }).join('')}
  </div>
  <div class="unlock-note">✦ Specialty cookies draw excited customers willing to pay higher prices, increasing your profit margins.</div>`;
}

function achievementsPanel(s) {
  const stats = s.stats || {};
  return `<div class="panel-heading">
    <div>
      <div class="eyebrow">HALL OF FAME</div>
      <h2>Achievements</h2>
    </div>
    <div class="coin-stack">★</div>
  </div>
  <p class="panel-note">Milestones earned along your 30-day bakery journey.</p>

  <div class="achievement-list">
    ${ACHIEVEMENTS.map(ach => {
      const isUnlocked = s.achievements.includes(ach.id) || s.achievements.includes(ach.name);
      return `<div class="achievement-card ${isUnlocked ? 'unlocked' : ''}">
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <b>${ach.name}</b>
          <span>${ach.description}</span>
          <div class="ach-reward">+${money(ach.reward)} reward</div>
        </div>
        <div class="ach-status">
          ${isUnlocked ? '<span class="ach-badge">✓ UNLOCKED</span>' : '<span class="ach-locked">LOCKED</span>'}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function decorPanel(s) {
  return `<div class="panel-heading">
    <div>
      <div class="eyebrow">CUSTOMIZE YOUR BAKERY</div>
      <h2>Bakery decor</h2>
    </div>
    <div class="mission-icon">✿</div>
  </div>
  <div class="decor-preview">
    <span>CHOOSE SHOP THEME</span>
    <div class="decor-swatches">
      ${[
        ['cozy', '#dce9e7'],
        ['mint', '#d4e8df'],
        ['pink', '#f1d5dc'],
        ['midnight', '#cfd5e3'],
      ]
        .map(
          ([id, color]) =>
            `<button data-action="theme" data-payload="${id}" aria-label="${id} theme" class="swatch ${
              s.decor === id ? 'selected' : ''
            }" style="--swatch:${color}"></button>`
        )
        .join('')}
    </div>
  </div>
  <div class="upgrade-list">
    ${decors
      .map(
        d => `<div class="upgrade-row">
        <div class="upgrade-art decor-art">${d.emoji}</div>
        <div class="upgrade-text">
          <b>${d.name}</b>
          <span>Give your 3D diorama bakery a cozy color makeover</span>
        </div>
        ${s.decor === d.id ? '<span class="owned-tag">ACTIVE</span>' : button('decor', d.cost ? money(d.cost) : 'Free', 'tiny', d.id)}
      </div>`
      )
      .join('')}
  </div>`;
}

function customizePanel(s) {
  return `<div class="panel-heading">
    <div>
      <div class="eyebrow">HEAD BAKER, BIG STYLE</div>
      <h2>Kevin’s wardrobe</h2>
    </div>
    <div class="kevin-icon">☺</div>
  </div>
  <div class="customize-preview">
    <span class="kevin-silhouette">☺</span>
    <div>
      <b>Kevin the Master Baker</b>
      <span>Always greeting customers with a smile!</span>
    </div>
  </div>
  <div class="upgrade-list">
    ${outfits
      .map(
        o => `<div class="upgrade-row">
        <div class="upgrade-art outfit-art">${o.emoji}</div>
        <div class="upgrade-text">
          <b>${o.name}</b>
          <span>Fresh apron style for baking sessions</span>
        </div>
        ${s.outfit === o.id ? '<span class="owned-tag">WEARING</span>' : button('outfit', o.cost ? money(o.cost) : 'Free', 'tiny', o.id)}
      </div>`
      )
      .join('')}
  </div>`;
}

function settingsPanel(s) {
  return `<div class="panel-heading">
    <div>
      <div class="eyebrow">SETTINGS & CONTROLS</div>
      <h2>Game settings</h2>
    </div>
    <div class="mission-icon">⚙</div>
  </div>
  <div class="setting-row">
    <div>
      <b>Bakery chimes</b>
      <span>Gentle cheerful sounds when cookies sell</span>
    </div>
    ${button('sound', s.sound ? 'On' : 'Off', `toggle ${s.sound ? 'selected' : ''}`)}
  </div>
  <div class="setting-row">
    <div>
      <b>Camera controls</b>
      <span>Click & drag to orbit, scroll to zoom</span>
    </div>
    ${button('camera', s.cameraLocked ? 'Locked' : 'Unlocked', `toggle ${s.cameraLocked ? '' : 'selected'}`)}
  </div>
  <div class="setting-row">
    <div>
      <b>Autosave status</b>
      <span>Preserved in your browser local storage</span>
    </div>
    <span class="saved-pill">✓ Saved</span>
  </div>
  <div class="settings-actions">
    ${button('menu', 'Back to Main Menu', 'soft wide')}
    ${button('pause', s.paused ? 'Resume Game' : 'Pause Game', 'primary wide')}
  </div>`;
}

function pauseModal(s) {
  if (!s.paused) return '';
  return `<div class="modal-scrim">
    <section class="pause-card">
      <button class="modal-close" data-action="pause" aria-label="Resume game">×</button>
      <div class="pause-mark">Ⅱ</div>
      <div class="eyebrow">COOKIE TYCOON 3D</div>
      <h2>Bakery is paused</h2>
      <p>Take a breath! Your progress is saved safely.</p>
      ${button('pause', '▶ &nbsp; Resume Baking', 'primary wide')}
      ${button('settings', '⚙ &nbsp; Game Settings', 'soft wide')}
      ${button('menu', '⌂ &nbsp; Main Menu', 'text-button wide')}
    </section>
  </div>`;
}

function header(s) {
  const shopStatus = s.paused ? 'PAUSED' : s.runningDay ? 'OPEN' : 'CLOSED';
  return `<header class="topbar">
    <button class="brand-lockup" data-action="menu" aria-label="Return to main menu">
      <span class="brand-cookie">●</span>
      <span>
        <b>BUJJU <i>GAMES</i></b>
        <small>COOKIE TYCOON 3D</small>
      </span>
    </button>

    <div class="top-stat day-stat">
      <span class="stat-icon">☀</span>
      <span>
        <small>DAY</small>
        <b>${s.day > 30 ? `∞ ${s.day}` : `${String(s.day).padStart(2, '0')} <i>/ 30</i>`}</b>
      </span>
    </div>

    <div class="top-stat inventory-stat" aria-label="${s.inventory} cookies in inventory">
      <span class="stat-icon">▤</span>
      <span>
        <small>INVENTORY</small>
        <b>${s.inventory}</b>
      </span>
    </div>

    <div class="top-stat cash-stat">
      <span class="stat-icon">$</span>
      <span>
        <small>CASH IN TILL</small>
        <b>${money(s.cash)}</b>
      </span>
    </div>

    <div class="top-stat rep-stat">
      <span class="stat-icon">♥</span>
      <span>
        <small>NEIGHBOR LOVE</small>
        <b>${Math.round(s.reputation)}<i>/100</i></b>
      </span>
    </div>

    <div class="top-stat shop-status-stat ${s.runningDay && !s.paused ? 'status-open' : ''}" aria-label="Shop ${shopStatus.toLowerCase()}">
      <span class="shop-status-dot"></span>
      <span class="status-copy">
        <small>STATUS</small>
        <b>${shopStatus}</b>
      </span>
    </div>

    <div class="top-actions">
      ${iconButton('rotate', 'Rotate left', '↶', '-1')}
      ${iconButton('rotate', 'Rotate right', '↷', '1')}
      ${iconButton('zoom', 'Zoom in', '+', '-1')}
      ${iconButton('zoom', 'Zoom out', '−', '1')}
      ${iconButton('settings', 'Settings', '⚙')}
      ${iconButton('pause', 'Pause', 'Ⅱ')}
    </div>
  </header>`;
}

function bottomNav(current) {
  const items = [
    ['plan', '⌂', 'Today'],
    ['missions', '✦', 'Missions'],
    ['upgrades', '♨', 'Shop'],
    ['recipes', '✿', 'Recipes'],
    ['achievements', '★', 'Wins'],
  ];
  return `<nav class="bottom-nav">${items
    .map(
      ([id, icon, label]) =>
        `<button data-action="panel" data-payload="${id}" class="${current === id ? 'active' : ''}">
        <span>${icon}</span>${label}
      </button>`
    )
    .join('')}</nav>`;
}

function gameScreen(s, customerMetrics) {
  let content;
  if (s.panel === 'missions') content = missionPanel(s);
  else if (s.panel === 'upgrades') content = upgradesPanel(s);
  else if (s.panel === 'recipes') content = recipesPanel(s);
  else if (s.panel === 'achievements') content = achievementsPanel(s);
  else if (s.panel === 'decor') content = decorPanel(s);
  else if (s.panel === 'customize') content = customizePanel(s);
  else if (s.panel === 'settings') content = settingsPanel(s);
  else if (s.panel === 'service') content = servicePanel(s, customerMetrics);
  else if (s.panel === 'report') content = reportPanel(s);
  else content = planPanel(s);

  return `${header(s)}
  <div class="world-hint">
    <span>✥</span> YOUR COZY BAKERY
    <small>DRAG TO ORBIT · SCROLL TO ZOOM · CLICK OBJECTS</small>
  </div>
  <div class="object-hints">
    <span><i>♨</i> Ovens</span>
    <span><i>▰</i> Counter</span>
    <span><i>✦</i> Missions</span>
    <span><i>★</i> Wins</span>
  </div>
  <aside class="game-panel">
    ${panelTabs(s.panel)}
    <div class="panel-scroll">${content}</div>
  </aside>
  ${bottomNav(s.panel)}
  ${pauseModal(s)}`;
}

function menuScreen(s) {
  return `<div class="menu-scene">
    ${header(s)}
    <div class="menu-copy">
      <div class="brand-kicker"><span>✦</span> A BUJJU GAMES ORIGINAL</div>
      <h1>Cookie<br><span>Tycoon 3D</span></h1>
      <p>One cozy neighborhood diorama. Thirty sweet days.<br>Can you build the city's most beloved bakery?</p>
      <div class="menu-buttons">
        ${button('new-game', 'Start a New Shop <span>→</span>', 'primary wide')}
        ${s.hasSave ? button('continue', 'Continue Your Bakery', 'soft wide') : ''}
      </div>
      <div class="menu-note">✦ Progress is automatically saved on this device</div>
    </div>
    <div class="menu-footer">
      <span>BAKE SOMETHING WONDERFUL</span>
      <span>✦ BUILT FOR BAKERS WITH BIG DREAMS</span>
    </div>
  </div>
  ${pauseModal(s)}`;
}

function getBusinessRank(profit, rep, level) {
  if (profit >= 1500 && rep >= 85) return { title: 'Grand Master Baker', stars: '✦✦✦✦✦', badge: 'S' };
  if (profit >= 1000 && rep >= 75) return { title: 'Master Confectioner', stars: '✦✦✦✦', badge: 'A' };
  if (profit >= 600 && rep >= 65) return { title: 'Neighborhood Icon', stars: '✦✦✦', badge: 'B' };
  if (profit >= 300) return { title: 'Town Favorite Baker', stars: '✦✦', badge: 'C' };
  return { title: 'Cozy Corner Baker', stars: '✦', badge: 'D' };
}

function resultsScreen(s) {
  const stats = s.stats || {};
  const totalRevenue = stats.totalRevenue || 0;
  const totalExpenses = stats.totalExpenses || 0;
  const totalProfit = stats.totalProfit || 0;
  const totalCookiesSold = stats.totalSold || 0;
  const totalCustomersServed = stats.totalCustomers || 0;
  const upgradesCount = s.oven + s.counter + s.shelves;
  const rank = getBusinessRank(totalProfit, s.reputation, s.level);

  return `<div class="results-scene">
    <div class="results-brand">BUJJU <span>GAMES</span> <i>✦</i></div>
    <div class="results-card">
      <div class="results-cookie">✦</div>
      <div class="eyebrow">30-DAY CAMPAIGN COMPLETE!</div>
      <h1>Congratulations,<br><span>Head Baker!</span></h1>
      <p>You steered your bakery through 30 glorious days of flour, vanilla, and sweet memories.</p>

      <div class="rank-badge-box">
        <div class="rank-letter">${rank.badge}</div>
        <div>
          <div class="rank-title">${rank.title}</div>
          <div class="rank-stars">${rank.stars}</div>
        </div>
      </div>

      <div class="final-stats">
        <div>
          <span>TOTAL REVENUE</span>
          <b>${money(totalRevenue)}</b>
        </div>
        <div>
          <span>TOTAL EXPENSES</span>
          <b>${money(totalExpenses)}</b>
        </div>
        <div>
          <span>NET PROFIT</span>
          <b class="${totalProfit >= 0 ? 'positive' : 'negative'}">${totalProfit >= 0 ? '+' : ''}${money(totalProfit)}</b>
        </div>
        <div>
          <span>FINAL CASH</span>
          <b>${money(s.cash)}</b>
        </div>
        <div>
          <span>COOKIES SOLD</span>
          <b>${totalCookiesSold}</b>
        </div>
        <div>
          <span>CUSTOMERS SERVED</span>
          <b>${totalCustomersServed}</b>
        </div>
        <div>
          <span>UPGRADES UNLOCKED</span>
          <b>${upgradesCount} / 15</b>
        </div>
        <div>
          <span>RECIPES KNOWN</span>
          <b>${s.recipes.length} / ${RECIPES.length}</b>
        </div>
      </div>

      <div class="result-achievement">✦ &nbsp; Achievement Unlocked: <b>Complete the 30-Day Campaign</b></div>

      <div class="results-actions">
        ${button('free-play', 'Keep Baking · Free Play Mode <span>→</span>', 'primary wide')}
        ${button('new-game', 'Start a New 30-Day Campaign', 'soft wide')}
        ${button('menu', 'Return to Main Menu', 'text-button wide')}
      </div>
    </div>
    <div class="results-footer">THANKS FOR MAKING OUR NEIGHBORHOOD SWEETER · BUJJU GAMES</div>
  </div>`;
}

export function renderApp(root, state, { act, customerMetrics }) {
  root.innerHTML =
    state.screen === 'menu'
      ? menuScreen(state)
      : state.screen === 'results'
      ? resultsScreen(state)
      : gameScreen(state, customerMetrics);

  root.onclick = event => {
    const control = event.target.closest('[data-action]');
    if (!control || control.disabled) return;
    event.stopPropagation();
    const action = control.dataset.action;
    let payload = control.dataset.payload;
    if (action === 'set') return;
    if (action === 'rotate' || action === 'zoom') payload = Number(payload);
    act(action, payload);
  };

  root.oninput = event => {
    const el = event.target.closest('[data-key]');
    if (!el) return;
    const key = el.dataset.key;
    const value = Number(el.value);
    const valueLabel = el.closest('.panel-scroll')?.querySelector(`label[for="${el.id}"] strong`);
    if (valueLabel) {
      valueLabel.textContent =
        key === 'price'
          ? `$${value.toFixed(2)}`
          : key === 'adBudget'
          ? money(value)
          : `${value} cookies`;
    }
    state[key] = value;
  };
}

let toastTimer;
export function toast(message) {
  const el = document.querySelector('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
