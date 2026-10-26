export const STORAGE_KEY = 'bujju-cookie-tycoon-v1';
export const DEFAULT_STATE = {
  screen: 'menu', panel: 'plan', day: 1, cash: 100, inventory: 0, reputation: 50,
  level: 1, shopXP: 0, oven: 0, counter: 0, shelves: 0, recipes: ['classic'],
  achievements: [], decor: 'cozy', outfit: 'classic', batch: 30, price: 3.5,
  adBudget: 8, runningDay: false, paused: false, completed: false, freePlay: false,
  sound: true, cameraLocked: false, dayStats: null, baking: null, report: null, hasSave: false,
  mission: { name: 'Cookie rush', goal: 24, reward: 45, progress: 0, claimed: false, ready: false },
};

const bounded = (v, min, max, fallback) => Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : fallback;
export function validateSave(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const state = structuredClone(DEFAULT_STATE);
  state.day = bounded(data.day, 1, 10000, 1);
  state.cash = bounded(data.cash, 0, 100000000, 100);
  state.inventory = bounded(data.inventory, 0, 100000, 0);
  state.reputation = bounded(data.reputation, 0, 100, 50);
  state.level = bounded(data.level, 1, 8, 1);
  state.shopXP = bounded(data.shopXP, 0, 100000, 0);
  for (const key of ['oven', 'counter', 'shelves']) state[key] = bounded(data[key], 0, 5, 0);
  state.recipes = Array.isArray(data.recipes) ? [...new Set(data.recipes.filter(x => ['classic', 'choco', 'berry', 'rainbow'].includes(x)))].slice(0, 4) : ['classic'];
  if (!state.recipes.length) state.recipes = ['classic'];
  state.achievements = Array.isArray(data.achievements) ? data.achievements.filter(x => typeof x === 'string').slice(-50) : [];
  state.decor = ['cozy', 'mint', 'pink', 'midnight'].includes(data.decor) ? data.decor : 'cozy';
  state.outfit = ['classic', 'mint', 'berry', 'star'].includes(data.outfit) ? data.outfit : 'classic';
  state.batch = bounded(data.batch, 5, 120, 30); state.price = bounded(data.price, 1, 12, 3.5); state.adBudget = bounded(data.adBudget, 0, 200, 8);
  state.completed = Boolean(data.completed); state.freePlay = Boolean(data.freePlay);
  state.sound = data.sound !== false; state.cameraLocked = Boolean(data.cameraLocked);
  state.mission = data.mission && typeof data.mission === 'object' ? {
    name: typeof data.mission.name === 'string' ? data.mission.name : 'Cookie rush',
    goal: bounded(data.mission.goal, 1, 1000, 24), reward: bounded(data.mission.reward, 0, 5000, 45),
    progress: bounded(data.mission.progress, 0, 1000, 0), claimed: Boolean(data.mission.claimed), ready: Boolean(data.mission.ready),
  } : structuredClone(DEFAULT_STATE.mission);
  state.screen = data.completed && !data.freePlay ? 'results' : 'game';
  state.panel = ['plan', 'missions', 'upgrades', 'recipes', 'decor', 'customize', 'settings', 'report', 'service'].includes(data.panel) ? data.panel : 'plan';
  state.report = data.report && typeof data.report === 'object' ? data.report : null;
  state.dayStats = null; state.baking = null; state.runningDay = false; state.paused = false;
  return state;
}
export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const saved = validateSave(JSON.parse(raw)) || structuredClone(DEFAULT_STATE);
    saved.hasSave = true;
    return saved;
  } catch { return structuredClone(DEFAULT_STATE); }
}
export function saveGame(state) {
  try {
    state.hasSave = true;
    const persistent = { ...state, screen: state.completed && !state.freePlay ? 'results' : 'game', runningDay: false, paused: false, dayStats: null, baking: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistent));
  } catch { /* Private browsing or storage limits: the current session still works. */ }
}
export function startFresh() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* continue in memory */ }
  return structuredClone(DEFAULT_STATE);
}
