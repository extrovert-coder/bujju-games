import { createMission, RECIPES } from './content.js';

export const STORAGE_KEY = 'bujju-cookie-tycoon-v1';

export const DEFAULT_STATE = {
  screen: 'menu',
  panel: 'plan',
  day: 1,
  cash: 100,
  inventory: 0,
  reputation: 50,
  level: 1,
  shopXP: 0,
  oven: 0,
  counter: 0,
  shelves: 0,
  selectedRecipe: 'classic',
  recipes: ['classic'],
  achievements: [],
  claimedMissions: [],
  stats: {
    totalSold: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    daysProfitable: 0,
    upgradesPurchased: 0,
  },
  decor: 'cozy',
  outfit: 'classic',
  batch: 30,
  price: 3.5,
  adBudget: 8,
  runningDay: false,
  paused: false,
  completed: false,
  freePlay: false,
  sound: true,
  cameraLocked: false,
  dayStats: null,
  baking: null,
  report: null,
  hasSave: false,
  mission: createMission(1, []),
};

const bounded = (v, min, max, fallback) =>
  Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : fallback;

const ALL_VALID_RECIPES = RECIPES.map(r => r.id);

export function validateSave(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const state = structuredClone(DEFAULT_STATE);

  state.day = bounded(data.day, 1, 10000, 1);
  state.cash = bounded(data.cash, 0, 100000000, 100);
  state.inventory = bounded(data.inventory, 0, 100000, 0);
  state.reputation = bounded(data.reputation, 0, 100, 50);
  state.level = bounded(data.level, 1, 10, 1);
  state.shopXP = bounded(data.shopXP, 0, 100000, 0);

  for (const key of ['oven', 'counter', 'shelves']) {
    state[key] = bounded(data[key], 0, 5, 0);
  }

  // Preserve existing and newly supported recipes
  if (Array.isArray(data.recipes)) {
    const valid = data.recipes.filter(x => typeof x === 'string' && ALL_VALID_RECIPES.includes(x));
    state.recipes = valid.length ? [...new Set(valid)] : ['classic'];
  } else {
    state.recipes = ['classic'];
  }
  if (!state.recipes.includes('classic')) state.recipes.unshift('classic');

  state.selectedRecipe = typeof data.selectedRecipe === 'string' && state.recipes.includes(data.selectedRecipe)
    ? data.selectedRecipe
    : state.recipes[0];

  state.achievements = Array.isArray(data.achievements)
    ? [...new Set(data.achievements.filter(x => typeof x === 'string'))]
    : [];

  state.claimedMissions = Array.isArray(data.claimedMissions)
    ? [...new Set(data.claimedMissions.filter(x => typeof x === 'string'))]
    : [];

  // Lifetime statistics
  if (data.stats && typeof data.stats === 'object') {
    state.stats = {
      totalSold: bounded(data.stats.totalSold, 0, 1000000, 0),
      totalCustomers: bounded(data.stats.totalCustomers, 0, 1000000, 0),
      totalRevenue: bounded(data.stats.totalRevenue, 0, 100000000, 0),
      totalExpenses: bounded(data.stats.totalExpenses, 0, 100000000, 0),
      totalProfit: Number.isFinite(Number(data.stats.totalProfit)) ? Number(data.stats.totalProfit) : 0,
      daysProfitable: bounded(data.stats.daysProfitable, 0, 10000, 0),
      upgradesPurchased: bounded(data.stats.upgradesPurchased, 0, 1000, state.oven + state.counter + state.shelves),
    };
  } else {
    state.stats = {
      totalSold: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      totalProfit: 0,
      daysProfitable: 0,
      upgradesPurchased: state.oven + state.counter + state.shelves,
    };
  }

  state.decor = ['cozy', 'mint', 'pink', 'midnight'].includes(data.decor) ? data.decor : 'cozy';
  state.outfit = ['classic', 'mint', 'berry', 'star'].includes(data.outfit) ? data.outfit : 'classic';

  state.batch = bounded(data.batch, 5, 140, 30);
  state.price = bounded(data.price, 1, 20, 3.5);
  state.adBudget = bounded(data.adBudget, 0, 300, 8);

  state.completed = Boolean(data.completed);
  state.freePlay = Boolean(data.freePlay);
  state.sound = data.sound !== false;
  state.cameraLocked = Boolean(data.cameraLocked);

  if (data.mission && typeof data.mission === 'object') {
    state.mission = {
      id: typeof data.mission.id === 'string' ? data.mission.id : 'cookie-rush',
      type: typeof data.mission.type === 'string' ? data.mission.type : 'cookiesSold',
      name: typeof data.mission.name === 'string' ? data.mission.name : 'Cookie Rush',
      description: typeof data.mission.description === 'string' ? data.mission.description : 'Sell cookies to neighbors.',
      goal: bounded(data.mission.goal, 1, 1000, 20),
      reward: bounded(data.mission.reward, 0, 5000, 45),
      recipeReward: typeof data.mission.recipeReward === 'string' ? data.mission.recipeReward : undefined,
      progress: bounded(data.mission.progress, 0, 10000, 0),
      claimed: Boolean(data.mission.claimed),
      ready: Boolean(data.mission.ready),
    };
  } else {
    state.mission = createMission(state.day, state.claimedMissions);
  }

  state.screen = data.completed && !data.freePlay ? 'results' : 'game';
  state.panel = ['plan', 'missions', 'upgrades', 'recipes', 'achievements', 'decor', 'customize', 'settings', 'report', 'service'].includes(data.panel)
    ? data.panel
    : 'plan';
  state.report = data.report && typeof data.report === 'object' ? data.report : null;

  state.dayStats = null;
  state.baking = null;
  state.runningDay = false;
  state.paused = false;

  return state;
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const saved = validateSave(JSON.parse(raw)) || structuredClone(DEFAULT_STATE);
    saved.hasSave = true;
    return saved;
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveGame(state) {
  try {
    state.hasSave = true;
    const persistent = {
      ...state,
      screen: state.completed && !state.freePlay ? 'results' : 'game',
      runningDay: false,
      paused: false,
      dayStats: null,
      baking: null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistent));
  } catch {
    /* Private browsing or storage limits: current session still functions in-memory. */
  }
}

export function startFresh() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* continue in memory */
  }
  return structuredClone(DEFAULT_STATE);
}
