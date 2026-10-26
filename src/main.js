import './style.css';
import { BakeryWorld } from './world.js';
import { DEFAULT_STATE, loadGame, saveGame, startFresh } from './state.js';
import { renderApp, toast } from './ui.js';
import { RECIPES, UPGRADE_DEFINITIONS, ACHIEVEMENTS, getRecipe, createMission } from './content.js';

const worldRoot = document.querySelector('#world');
const overlay = document.querySelector('#overlay');

let state = loadGame();
let world;
let simulationTimer = 0;
let lastSimulationTime = 0;
let lastProgressRender = 0;
let visitedCustomers = new Set();
let audioContext;

const decorCosts = { cozy: 0, mint: 160, pink: 240, midnight: 390 };
const outfitCosts = { classic: 0, mint: 95, berry: 160, star: 280 };

function persist() {
  saveGame(state);
}

function update() {
  persist();
  render();
}

function render() {
  renderApp(overlay, state, {
    act(action, payload) {
      handleAction(action, payload);
    },
    toast,
    customerMetrics: world?.getCustomerMetrics(),
  });
  world?.setPaused(state.paused);
  world?.setShopStyle(state.decor, state.outfit, state.level);
  world?.refreshCounterDisplays(state.recipes);
}

function playChime(pitch = 659, secondPitch = 880) {
  if (!state.sound) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ||= new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume();
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.24);
    gain.connect(audioContext.destination);

    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(pitch, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(secondPitch, audioContext.currentTime + 0.09);
    oscillator.connect(gain);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.25);
  } catch {
    /* Audio is optional */
  }
}

function unlockAchievement(achievementId) {
  state.achievements ||= [];
  if (state.achievements.includes(achievementId)) return;

  state.achievements.push(achievementId);
  const def = ACHIEVEMENTS.find(a => a.id === achievementId);
  const reward = def?.reward || 25;
  const name = def?.name || achievementId;

  state.cash += reward;
  toast(`★ Achievement Unlocked: ${name}! +$${reward}`);
  playChime(523, 1046);
  update();
}

function checkAchievements() {
  const stats = state.stats || {};
  if (stats.totalSold >= 1) unlockAchievement('first-sale');
  if (stats.totalSold >= 100) unlockAchievement('100-cookies');
  if (stats.totalCustomers >= 100) unlockAchievement('100-customers');
  if (state.oven >= 1) unlockAchievement('first-oven-upgrade');
  if (stats.daysProfitable >= 1) unlockAchievement('first-profitable-day');
  if (state.day > 30) unlockAchievement('campaign-complete');

  const specialtyCount = state.recipes.filter(r => r !== 'classic').length;
  if (specialtyCount >= 5) unlockAchievement('recipe-master');
}

function handleAction(action, payload) {
  if (action === 'new-game') {
    state = startFresh();
    state.screen = 'game';
    state.panel = 'plan';
    update();
    toast('Welcome to your cozy bakery!');
  } else if (action === 'continue') {
    state.screen = 'game';
    state.panel = 'plan';
    update();
  } else if (action === 'panel') {
    state.panel = payload;
    update();
  } else if (action === 'set') {
    state[payload.key] = payload.value;
    update();
  } else if (action === 'select-recipe') {
    if (state.recipes.includes(payload)) {
      state.selectedRecipe = payload;
      const rec = getRecipe(payload);
      toast(`Active recipe: ${rec.name}`);
      update();
    }
  } else if (action === 'start-day') {
    startDay();
  } else if (action === 'claim-mission') {
    claimMission();
  } else if (action === 'upgrade') {
    buyUpgrade(payload);
  } else if (action === 'recipe') {
    buyRecipe(payload);
  } else if (action === 'decor') {
    buyDecor(payload);
  } else if (action === 'outfit') {
    buyOutfit(payload);
  } else if (action === 'pause') {
    state.paused = !state.paused;
    update();
  } else if (action === 'settings') {
    if (state.paused) {
      state.paused = false;
      state.panel = 'settings';
    } else {
      state.panel = state.panel === 'settings' ? 'plan' : 'settings';
    }
    update();
  } else if (action === 'sound') {
    state.sound = !state.sound;
    update();
    toast(state.sound ? 'Chimes enabled' : 'Chimes muted');
  } else if (action === 'camera') {
    state.cameraLocked = !state.cameraLocked;
    world?.setCameraLocked(state.cameraLocked);
    update();
    toast(state.cameraLocked ? 'Camera controls locked' : 'Camera controls active');
  } else if (action === 'free-play') {
    state.completed = false;
    state.freePlay = true;
    state.screen = 'game';
    state.day = Math.max(31, state.day);
    state.panel = 'plan';
    update();
    toast('Free Play Mode activated! Bake without limits.');
  } else if (action === 'menu') {
    state.screen = 'menu';
    state.paused = false;
    update();
  } else if (action === 'theme') {
    state.decor = payload;
    update();
    toast('Bakery diorama colors updated!');
  } else if (action === 'zoom') {
    world?.zoom(payload);
  } else if (action === 'rotate') {
    world?.rotate(payload);
  }
}

function startDay() {
  if (state.paused || state.runningDay || simulationTimer) return;

  const recipe = getRecipe(state.selectedRecipe);
  const ovenDefs = UPGRADE_DEFINITIONS.oven;
  const currentOven = ovenDefs[state.oven - 1];
  const speedBoost = currentOven?.speedBoost || 0;
  const savings = currentOven?.savings || 0;
  const maxBatch = [30, 50, 70, 90, 115, 140][state.oven] || 30;

  const batch = Math.min(maxBatch, Math.max(5, Number(state.batch)));
  state.batch = batch;
  const price = Number(state.price);
  const ads = Number(state.adBudget);

  // Ingredient cost with oven efficiency savings
  const unitCost = Math.max(0.18, recipe.ingredientCost * (1 - savings));
  const productionCost = batch * unitCost;
  const operatingCost = 8 + Math.floor(state.level * 1.5);
  const totalCost = productionCost + ads + operatingCost;

  if (totalCost > state.cash) {
    toast(`You need $${totalCost.toFixed(0)} for ingredients, ads, and shop upkeep today.`);
    return;
  }

  // Deduct upfront costs
  state.cash -= totalCost;
  state.stats.totalExpenses = (state.stats.totalExpenses || 0) + totalCost;

  state.runningDay = true;
  // Oven baking speed real effect: reduced duration with higher oven levels
  const baseDuration = 2400 + batch * 11;
  const bakeDuration = Math.max(1200, Math.round(baseDuration * (1 - speedBoost)));

  state.baking = {
    total: batch,
    elapsed: 0,
    duration: bakeDuration,
    progress: 0,
    ready: false,
    recipeId: recipe.id,
  };

  state.dayStats = {
    recipeId: recipe.id,
    baked: batch,
    sold: 0,
    revenue: 0,
    ingredients: productionCost,
    ads,
    operating: operatingCost,
    customers: 0,
    profit: 0,
  };

  state.panel = 'service';

  // Customer demand model
  const shelvesBoost = UPGRADE_DEFINITIONS.shelves[state.shelves - 1]?.demandBoost || 0;
  const priceDiff = price - recipe.recommendedPrice;
  const priceAppeal = priceDiff > 0 ? Math.max(0.4, 1 - priceDiff * 0.12) : 1 + Math.abs(priceDiff) * 0.05;

  const baseTraffic = 18 + state.reputation * 1.2 + ads * 1.5 + state.level * 3 + state.counter * 4;
  const potentialDemand = Math.round(baseTraffic * (1 + shelvesBoost) * recipe.demand * priceAppeal);

  const visitorTarget = Math.min(60, Math.max(6, Math.ceil(potentialDemand / 1.7)));
  const counterSpeedBoost = UPGRADE_DEFINITIONS.counter[state.counter - 1]?.speedBoost || 0;
  const arrivalInterval = Math.max(340, Math.min(1100, Math.round((1150 - ads * 4.0 - state.reputation * 4.2) * (1 - counterSpeedBoost * 0.25))));

  state.dayStats.demandRemaining = potentialDemand;
  state.dayStats.targetCustomers = visitorTarget;
  visitedCustomers = new Set();

  world?.setBakingState(state.baking);
  world?.startCustomers(visitorTarget, arrivalInterval, handleCustomerAtCounter, handleCustomerFlowComplete);

  lastSimulationTime = performance.now();
  lastProgressRender = 0;
  simulationTimer = window.setInterval(simulateBusinessDay, 80);

  update();
  playChime(440, 659);
}

function simulateBusinessDay() {
  if (!state.runningDay) return;
  const now = performance.now();
  if (state.paused) {
    lastSimulationTime = now;
    return;
  }
  const elapsed = Math.min(250, Math.max(0, now - lastSimulationTime));
  lastSimulationTime = now;

  if (state.baking && !state.baking.ready) {
    state.baking.elapsed = Math.min(state.baking.duration, state.baking.elapsed + elapsed);
    state.baking.progress = state.baking.elapsed / state.baking.duration;
    world?.setBakingState(state.baking);

    if (state.baking.progress >= 1) {
      state.baking.ready = true;
      state.inventory += state.baking.total;
      world?.setBakingState(state.baking);
      world?.finishBaking(state.baking.total);
      world?.releaseWaitingCustomers();
      toast(`♨ Oven ready: ${state.baking.total} fresh cookies delivered!`);
      playChime(659, 988);
      persist();
    }
    if (now - lastProgressRender >= 150) {
      lastProgressRender = now;
      render();
    }
  }

  if (state.dayStats?.customersFinished && state.baking?.ready) {
    finishDay();
  }
}

function handleCustomerAtCounter(customerId) {
  if (!state.runningDay || !state.dayStats) return;

  if (!visitedCustomers.has(customerId)) {
    visitedCustomers.add(customerId);
    state.dayStats.customers += 1;
    state.stats.totalCustomers = (state.stats.totalCustomers || 0) + 1;
  }

  // Stock check
  if (state.inventory <= 0) {
    if (state.baking && !state.baking.ready) {
      world?.waitForStock(customerId);
    } else {
      world?.completeCustomer(customerId, 0);
    }
    persist();
    render();
    return;
  }

  const recipe = getRecipe(state.selectedRecipe);
  const price = Number(state.price);
  const priceRatio = price / recipe.recommendedPrice;
  const purchaseChance = Math.min(0.98, Math.max(0.35, 0.84 + (state.reputation - 50) * 0.002 - Math.max(0, priceRatio - 1) * 0.35));

  if (state.dayStats.demandRemaining <= 0 || Math.random() > purchaseChance) {
    world?.completeCustomer(customerId, 0);
    persist();
    render();
    return;
  }

  const desired = 1 + Math.floor(Math.random() * 3);
  const quantity = Math.min(state.inventory, state.dayStats.demandRemaining, desired);

  if (quantity <= 0) {
    world?.completeCustomer(customerId, 0);
    persist();
    render();
    return;
  }

  const revenue = quantity * price;
  state.inventory -= quantity;
  state.cash += revenue;
  state.dayStats.sold += quantity;
  state.dayStats.revenue += revenue;
  state.dayStats.demandRemaining -= quantity;

  state.stats.totalSold = (state.stats.totalSold || 0) + quantity;
  state.stats.totalRevenue = (state.stats.totalRevenue || 0) + revenue;

  // Track real mission progress
  if (state.mission && !state.mission.claimed) {
    if (state.mission.type === 'cookiesSold') {
      state.mission.progress = (state.mission.progress || 0) + quantity;
    } else if (state.mission.type === 'revenue') {
      state.mission.progress = (state.mission.progress || 0) + revenue;
    } else if (state.mission.type === 'customersServed') {
      state.mission.progress = (state.mission.progress || 0) + 1;
    }
    if (state.mission.progress >= state.mission.goal && !state.mission.ready) {
      state.mission.ready = true;
      toast(`✦ Mission Complete: ${state.mission.name}! Claim your reward.`);
      playChime(784, 1046);
    }
  }

  world?.completeCustomer(customerId, quantity);
  playChime(659, 880);
  checkAchievements();
  persist();
  render();
}

function handleCustomerFlowComplete() {
  if (!state.runningDay || !state.dayStats) return;
  state.dayStats.customersFinished = true;
  if (state.baking?.ready) finishDay();
}

function finishDay() {
  if (!state.runningDay || !state.dayStats) return;
  clearInterval(simulationTimer);
  simulationTimer = 0;
  state.runningDay = false;
  state.baking = null;
  world?.setBakingState(null);

  const stats = state.dayStats;
  stats.profit = stats.revenue - stats.ingredients - stats.ads - stats.operating;
  stats.unsold = state.inventory;

  state.stats.totalProfit = (state.stats.totalProfit || 0) + stats.profit;
  if (stats.profit > 0) {
    state.stats.daysProfitable = (state.stats.daysProfitable || 0) + 1;
  }

  // Reputation updates
  const priceHigh = Number(state.price) > getRecipe(state.selectedRecipe).recommendedPrice * 1.35;
  const repDelta = (stats.sold >= 25 ? 3 : stats.sold >= 12 ? 1 : -2) + (priceHigh ? -2 : 1);
  state.reputation = Math.max(0, Math.min(100, state.reputation + repDelta));

  // Satisfaction
  stats.satisfaction = Math.min(
    100,
    Math.max(35, Math.round(75 + (stats.sold > 15 ? 8 : 0) + state.reputation * 0.1 - (priceHigh ? 12 : 0)))
  );

  // Shop XP
  state.shopXP += Math.max(6, stats.sold + Math.floor(Math.max(0, stats.profit) / 8));
  const neededXP = state.level * 70;
  if (state.shopXP >= neededXP && state.level < 10) {
    state.shopXP -= neededXP;
    state.level += 1;
    toast(`✦ Level Up! Your bakery is now Level ${state.level}!`);
    playChime(523, 1046);
  }

  // Mission check for end-of-day missions
  if (state.mission && !state.mission.claimed) {
    if (state.mission.type === 'positiveProfit' && stats.profit > 0) {
      state.mission.progress = 1;
      state.mission.ready = true;
      toast(`✦ Mission Complete: ${state.mission.name}! Claim reward.`);
    } else if (state.mission.type === 'reputation') {
      state.mission.progress = Math.round(state.reputation);
      if (state.mission.progress >= state.mission.goal) {
        state.mission.ready = true;
        toast(`✦ Mission Complete: ${state.mission.name}! Claim reward.`);
      }
    }
  }

  state.report = { ...stats, cash: state.cash, reputation: state.reputation };
  state.day += 1;
  state.panel = 'report';

  // Check achievements after day ends
  checkAchievements();

  // 30-Day Campaign completion
  if (state.day > 30 && !state.freePlay) {
    state.completed = true;
    state.screen = 'results';
    unlockAchievement('campaign-complete');
  }

  update();
}

function claimMission() {
  if (!state.mission.ready || state.mission.claimed) return;
  const m = state.mission;

  state.cash += m.reward;
  m.claimed = true;
  m.ready = false;

  state.claimedMissions ||= [];
  if (!state.claimedMissions.includes(m.id)) {
    state.claimedMissions.push(m.id);
  }

  let bonusMsg = '';
  if (m.recipeReward && !state.recipes.includes(m.recipeReward)) {
    state.recipes.push(m.recipeReward);
    const rec = getRecipe(m.recipeReward);
    bonusMsg = ` + Unlocked ${rec.name}!`;
    world?.refreshCounterDisplays(state.recipes);
  }

  toast(`Mission Complete! +$${m.reward}${bonusMsg}`);
  playChime(587, 880);

  // Set next mission
  state.mission = createMission(state.day, state.claimedMissions);
  checkAchievements();
  update();
}

function buyUpgrade(type) {
  const currentLvl = state[type] || 0;
  if (currentLvl >= 5) return toast(`${type} is already at maximum level.`);

  const defs = UPGRADE_DEFINITIONS[type];
  const next = defs[currentLvl];
  if (!next) return;

  if (state.cash < next.cost) {
    return toast(`You need $${next.cost} for this upgrade.`);
  }

  state.cash -= next.cost;
  state[type] += 1;
  state.stats.upgradesPurchased = (state.stats.upgradesPurchased || 0) + 1;

  toast(`✦ Upgraded to ${next.name}!`);
  playChime(523, 784);

  checkAchievements();
  update();
}

function buyRecipe(id) {
  const rec = getRecipe(id);
  if (!rec || !rec.unlock) return toast('Recipe not available.');
  if (state.recipes.includes(id)) return toast('You already know this recipe!');

  const cost = rec.unlock.cost || 120;
  if (state.cash < cost) return toast(`You need $${cost} to unlock ${rec.name}.`);

  state.cash -= cost;
  state.recipes.push(id);
  state.selectedRecipe = id;

  toast(`✿ Unlocked ${rec.name}! Kevin is eager to bake it.`);
  playChime(659, 1046);

  world?.refreshCounterDisplays(state.recipes);
  checkAchievements();
  update();
}

function buyDecor(id) {
  const cost = decorCosts[id] ?? 160;
  if (state.decor === id) return toast('This decor is already active.');
  if (cost > 0 && state.cash < cost) return toast(`You need $${cost} for this decor theme.`);

  if (cost > 0) state.cash -= cost;
  state.decor = id;
  toast('Bakery diorama style updated!');
  update();
}

function buyOutfit(id) {
  const cost = outfitCosts[id] ?? 95;
  if (state.outfit === id) return toast('Kevin is already wearing this outfit.');
  if (cost > 0 && state.cash < cost) return toast(`You need $${cost} for this outfit.`);

  if (cost > 0) state.cash -= cost;
  state.outfit = id;
  toast('Kevin has a fresh new look!');
  update();
}

function bootWorld() {
  try {
    world = new BakeryWorld(worldRoot, object => {
      const panels = {
        oven: state.runningDay ? 'service' : 'plan',
        counter: state.runningDay ? 'service' : 'plan',
        board: 'missions',
        shelves: 'upgrades',
        kevin: 'customize',
        door: 'plan',
        table: 'decor',
      };
      state.panel = panels[object] || 'plan';
      update();

      const messages = {
        oven: state.runningDay
          ? `${state.baking?.ready ? 'Fresh batch ready!' : `Oven baking: ${Math.round((state.baking?.progress || 0) * 100)}%`}`
          : 'Plan your cookies and open shop to bake.',
        counter: state.runningDay
          ? `${world?.getCustomerMetrics().queue || 0} customers waiting in line.`
          : 'Set today’s recipe, batch, and pricing.',
        board: 'Check your daily mission challenge!',
        shelves: 'Upgrade your bakery capacity and ovens.',
        kevin: 'Kevin’s bakery wardrobe.',
        door: 'Welcome to your cozy bakery diorama!',
        table: 'Cozy seating for sweet neighborhood friends.',
      };
      toast(messages[object] || 'Bakery controls');
    });

    world.refreshCounterDisplays(state.recipes);
    document.querySelector('#loading-screen')?.classList.add('hidden');
    render();
  } catch (error) {
    document.querySelector('#loading-screen')?.classList.add('hidden');
    worldRoot.innerHTML = `<div class="webgl-error">
      <span class="error-icon">✦</span>
      <h2>3D is taking a cookie break</h2>
      <p>This browser or device could not start WebGL. Try updating your browser or enabling hardware acceleration.</p>
      <button class="button primary" id="retry-world">Try again</button>
    </div>`;
    document.querySelector('#retry-world').addEventListener('click', () => {
      worldRoot.innerHTML = '';
      bootWorld();
    });
    console.error('Unable to initialize Three.js bakery:', error);
  }
}

window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.screen === 'game') handleAction('pause');
});

window.addEventListener('beforeunload', persist);

if (!state || !state.screen) state = { ...DEFAULT_STATE };
bootWorld();
