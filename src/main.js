import './style.css';
import { BakeryWorld } from './world.js';
import { DEFAULT_STATE, loadGame, saveGame, startFresh } from './state.js';
import { renderApp, toast } from './ui.js';

const worldRoot = document.querySelector('#world');
const overlay = document.querySelector('#overlay');
let state = loadGame();
let world;
let simulationTimer = 0;
let lastSimulationTime = 0;
let lastProgressRender = 0;
let visitedCustomers = new Set();
let audioContext;
const recipeCosts = { choco: 120, berry: 210, rainbow: 340 };
const decorCosts = { mint: 160, pink: 240, midnight: 390 };
const outfitCosts = { mint: 95, berry: 160, star: 280 };

function persist() { saveGame(state); }
function update() { persist(); render(); }
function render() {
  renderApp(overlay, state, {
    act(action, payload) { handleAction(action, payload); },
    toast,
    customerMetrics: world?.getCustomerMetrics(),
  });
  world?.setPaused(state.paused);
  world?.setShopStyle(state.decor, state.outfit, state.level);
}

function playChime() {
  if (!state.sound) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ||= new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume();
    const gain = audioContext.createGain(); gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.22); gain.connect(audioContext.destination);
    const oscillator = audioContext.createOscillator(); oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(659, audioContext.currentTime); oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.09);
    oscillator.connect(gain); oscillator.start(); oscillator.stop(audioContext.currentTime + 0.23);
  } catch { /* audio is optional; the bakery still runs without it */ }
}

function handleAction(action, payload) {
  if (action === 'new-game') {
    state = startFresh();
    state.screen = 'game'; state.panel = 'plan';
    update();
    toast('Your little bakery is ready!');
  } else if (action === 'continue') {
    state.screen = 'game'; state.panel = 'plan'; update();
  } else if (action === 'panel') {
    state.panel = payload; update();
  } else if (action === 'set') {
    state[payload.key] = payload.value; update();
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
    state.paused = !state.paused; update();
  } else if (action === 'settings') {
    if (state.paused) {
      state.paused = false; state.panel = 'settings';
    } else {
      state.panel = state.panel === 'settings' ? 'plan' : 'settings';
    }
    update();
  } else if (action === 'sound') {
    state.sound = !state.sound; update(); toast(state.sound ? 'Sound on' : 'Sound off');
  } else if (action === 'camera') {
    state.cameraLocked = !state.cameraLocked; world?.setCameraLocked(state.cameraLocked); update();
    toast(state.cameraLocked ? 'Camera controls locked' : 'Camera controls ready');
  } else if (action === 'free-play') {
    state.completed = false; state.freePlay = true; state.screen = 'game'; state.day = 31; state.panel = 'plan'; update();
  } else if (action === 'menu') {
    state.screen = 'menu'; state.paused = false; update();
  } else if (action === 'theme') {
    state.decor = payload; update(); toast('Bakery colors updated!');
  } else if (action === 'zoom') {
    world?.zoom(payload);
  } else if (action === 'rotate') {
    world?.rotate(payload);
  }
}

function startDay() {
  if (state.paused || state.runningDay || simulationTimer) return;
  const batch = Number(state.batch);
  const price = Number(state.price);
  const ads = Number(state.adBudget);
  const unitCost = Math.max(0.25, 0.45 - state.oven * 0.04 + (state.recipes.length - 1) * 0.04);
  const productionCost = batch * unitCost;
  const operatingCost = 8 + Math.floor(state.level * 1.5);
  if (productionCost + ads + operatingCost > state.cash) {
    toast(`You need $${(productionCost + ads + operatingCost).toFixed(0)} for ingredients, ads, and today's shop costs.`);
    return;
  }
  state.cash -= productionCost + ads;
  state.runningDay = true;
  state.baking = { total: batch, elapsed: 0, duration: 2400 + batch * 11, progress: 0, ready: false };
  state.dayStats = { baked: batch, sold: 0, revenue: 0, ingredients: productionCost, ads, operating: operatingCost, customers: 0 };
  state.cash -= state.dayStats.operating;
  state.panel = 'service';
  const potential = Math.round((18 + state.reputation * 1.25 + ads * 1.4 + state.level * 3 + state.counter * 4 + state.shelves * 2) * (1 - Math.abs(price - 3.5) * 0.095));
  const demand = Math.min(Math.max(0, potential), state.inventory + batch);
  const visitorTarget = Math.min(60, Math.max(5, Math.ceil(demand / 1.8)));
  const arrivalInterval = Math.max(360, Math.min(1200, 1200 - ads * 3.8 - state.reputation * 4.5));
  state.dayStats.demandRemaining = Math.max(0, potential);
  state.dayStats.targetCustomers = visitorTarget;
  visitedCustomers = new Set();
  world?.startCustomers(visitorTarget, arrivalInterval, handleCustomerAtCounter, handleCustomerFlowComplete);
  lastSimulationTime = performance.now(); lastProgressRender = 0;
  simulationTimer = window.setInterval(simulateBusinessDay, 100);
  update(); playChime();
}

function simulateBusinessDay() {
  if (!state.runningDay) return;
  const now = performance.now();
  if (state.paused) { lastSimulationTime = now; return; }
  const elapsed = Math.min(250, Math.max(0, now - lastSimulationTime));
  lastSimulationTime = now;
  if (state.baking && !state.baking.ready) {
    state.baking.elapsed = Math.min(state.baking.duration, state.baking.elapsed + elapsed);
    state.baking.progress = state.baking.elapsed / state.baking.duration;
    if (state.baking.progress >= 1) {
      state.baking.ready = true;
      state.inventory += state.baking.total;
      world?.finishBaking(state.baking.total);
      world?.releaseWaitingCustomers();
      toast(`${state.baking.total} fresh cookies are ready!`);
      persist();
    }
    if (now - lastProgressRender >= 150) { lastProgressRender = now; render(); }
  }
  if (state.dayStats?.customersFinished && state.baking?.ready) finishDay();
}

function handleCustomerAtCounter(customerId) {
  if (!state.runningDay || !state.dayStats) return;
  if (!visitedCustomers.has(customerId)) {
    visitedCustomers.add(customerId);
    state.dayStats.customers += 1;
  }
  if (state.inventory <= 0) {
    if (state.baking && !state.baking.ready) world?.waitForStock(customerId);
    else world?.completeCustomer(customerId, 0);
    persist(); render(); return;
  }
  const price = Number(state.price);
  const priceEffect = Math.max(0, price - 3.5) * .07 - Math.max(0, 3.5 - price) * .015;
  const purchaseChance = Math.min(.98, Math.max(.35, .82 + (state.reputation - 50) * .002 - priceEffect));
  if (state.dayStats.demandRemaining <= 0 || Math.random() > purchaseChance) {
    world?.completeCustomer(customerId, 0);
    persist(); render(); return;
  }
  const desired = 1 + Math.floor(Math.random() * 3);
  const quantity = Math.min(state.inventory, state.dayStats.demandRemaining, desired);
  if (quantity <= 0) {
    world?.completeCustomer(customerId, 0);
    persist(); render(); return;
  }
  const revenue = quantity * price;
  state.inventory -= quantity;
  state.cash += revenue;
  state.dayStats.sold += quantity;
  state.dayStats.revenue += revenue;
  state.dayStats.demandRemaining -= quantity;
  world?.completeCustomer(customerId, quantity);
  playChime();
  toast(`${quantity} cookie${quantity === 1 ? '' : 's'} sold · +$${revenue.toFixed(0)}`);
  persist(); render();
}

function handleCustomerFlowComplete() {
  if (!state.runningDay || !state.dayStats) return;
  state.dayStats.customersFinished = true;
  if (state.baking?.ready) finishDay();
}

function finishDay() {
  if (!state.runningDay || !state.dayStats) return;
  clearInterval(simulationTimer); simulationTimer = 0;
  state.runningDay = false;
  state.baking = null;
  const stats = state.dayStats;
  stats.profit = stats.revenue - stats.ingredients - stats.ads - stats.operating;
  stats.unsold = state.inventory;
  state.reputation = Math.max(0, Math.min(100, state.reputation + (stats.sold >= 20 ? 3 : stats.sold >= 10 ? 1 : -2) + (Number(state.price) > 6 ? -2 : 0)));
  stats.satisfaction = Math.min(100, Math.max(35, Math.round(76 + (stats.sold > 15 ? 8 : 0) + state.reputation * 0.08 - Math.max(0, Number(state.price) - 4) * 8)));
  state.shopXP += Math.max(4, stats.sold + Math.floor(stats.profit / 10));
  const neededXP = state.level * 70;
  if (state.shopXP >= neededXP && state.level < 8) {
    state.shopXP -= neededXP; state.level += 1;
    toast(`Level up! Your bakery is now level ${state.level}.`);
  }
  state.mission.progress = Math.min(state.mission.goal, state.mission.progress + stats.sold);
  if (state.mission.progress >= state.mission.goal && !state.mission.claimed) state.mission.ready = true;
  state.report = { ...stats, cash: state.cash, reputation: state.reputation };
  state.day += 1;
  state.panel = 'report';
  if (state.day > 30 && !state.freePlay) {
    state.completed = true; state.screen = 'results';
    state.achievements.push('30-day baker');
  }
  update();
}

function claimMission() {
  if (!state.mission.ready || state.mission.claimed) return;
  state.cash += state.mission.reward; state.mission.claimed = true; state.mission.ready = false;
  state.achievements.push(state.mission.name);
  toast(`Mission complete! +$${state.mission.reward}`);
  state.mission = nextMission(state.day);
  update();
}
function nextMission(day) {
  const pool = [
    { name: 'Cookie rush', goal: 24, reward: 45 },
    { name: 'Happy regulars', goal: 38, reward: 70 },
    { name: 'Neighborhood favorite', goal: 55, reward: 95 },
    { name: 'Cookie legend', goal: 75, reward: 130 },
  ];
  const mission = { ...pool[(day + state.achievements.length) % pool.length], progress: 0, claimed: false, ready: false };
  return mission;
}
function buyUpgrade(type) {
  const costs = { oven: 120 + state.oven * 95, counter: 100 + state.level * 55, shelves: 85 + state.level * 45 };
  if (state[type] >= 5) return toast(`${type} is already fully upgraded.`);
  if (state.cash < costs[type]) return toast(`You need $${costs[type]} for this upgrade.`);
  state.cash -= costs[type]; state[type] += 1;
  toast(`${type[0].toUpperCase() + type.slice(1)} upgraded!`); update();
}
function buyRecipe(id) {
  const cost = recipeCosts[id];
  if (!cost) return toast('That recipe is not available.');
  if (state.recipes.includes(id)) return;
  if (state.cash < cost) return toast(`You need $${cost} to unlock that recipe.`);
  state.cash -= cost; state.recipes.push(id); toast('New cookie recipe unlocked!'); update();
}
function buyDecor(id) {
  const cost = decorCosts[id];
  if (!cost) return toast('That decoration is not available.');
  if (state.decor === id) return toast('This decoration is already equipped.');
  if (state.cash < cost) return toast(`You need $${cost} for this decoration.`);
  state.cash -= cost; state.decor = id; toast('A new decoration was added to your shop.'); update();
}
function buyOutfit(id) {
  const cost = outfitCosts[id];
  if (!cost) return toast('That outfit is not available.');
  if (state.outfit === id) return toast('Kevin is already wearing this outfit.');
  if (state.cash < cost) return toast(`You need $${cost} for this outfit.`);
  state.cash -= cost; state.outfit = id; toast('Kevin has a fresh new look!'); update();
}

function bootWorld() {
  try {
    world = new BakeryWorld(worldRoot, (object) => {
      const panels = { oven: state.runningDay ? 'service' : 'plan', counter: state.runningDay ? 'service' : 'plan', board: 'missions', shelves: 'upgrades', kevin: 'customize', door: 'plan', table: 'decor' };
      state.panel = panels[object] || 'plan'; update();
      const messages = {
        oven: state.runningDay ? `${state.baking?.ready ? 'Fresh batch ready' : `Oven ${Math.round((state.baking?.progress || 0) * 100)}% baked`}` : 'Plan your batch, then open the shop to bake it.',
        counter: state.runningDay ? `${world?.getCustomerMetrics().queue || 0} customers in the counter queue.` : 'Set today’s cookie price and batch.',
        board: 'Your daily mission', shelves: 'Bakery upgrades', kevin: 'Kevin’s style', door: 'Ready when you are!', table: 'Make your shop feel like home',
      };
      toast(messages[object] || 'Bakery controls');
    });
    document.querySelector('#loading-screen')?.classList.add('hidden');
    render();
  } catch (error) {
    document.querySelector('#loading-screen')?.classList.add('hidden');
    worldRoot.innerHTML = `<div class="webgl-error"><span class="error-icon">✦</span><h2>3D is taking a cookie break</h2><p>This browser or device could not start WebGL. Try updating your browser or enabling hardware acceleration.</p><button class="button primary" id="retry-world">Try again</button></div>`;
    document.querySelector('#retry-world').addEventListener('click', () => { worldRoot.innerHTML = ''; bootWorld(); });
    console.error('Unable to initialize Three.js bakery:', error);
  }
}
window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && state.screen === 'game') handleAction('pause'); });
window.addEventListener('beforeunload', persist);
if (!state || !state.screen) state = { ...DEFAULT_STATE };
bootWorld();
