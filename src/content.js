export const RECIPES = [
  { id: 'classic', name: 'Classic Cookie', detail: 'Warm, golden, everybody’s favorite', emoji: '●', ingredientCost: 0.45, price: 3.5, demand: 1, unlock: { type: 'starter' } },
  { id: 'chip', name: 'Chocolate Chip', detail: 'A familiar favorite with extra cocoa', emoji: '◉', ingredientCost: 0.49, price: 3.8, demand: 1.12, unlock: { type: 'mission', name: 'Cookie rush' } },
  { id: 'choco', name: 'Double Chocolate', detail: 'Rich cocoa for chocolate lovers', emoji: '⬟', ingredientCost: 0.58, price: 4.2, demand: 1.04, unlock: { type: 'cash', cost: 120 } },
  { id: 'berry', name: 'Strawberry Swirl', detail: 'Sweet berry ribbons and a rosy finish', emoji: '✿', ingredientCost: 0.54, price: 5, demand: 1.08, unlock: { type: 'level', level: 2 } },
  { id: 'rainbow', name: 'Rainbow Cookie', detail: 'Colorful chips that catch every eye', emoji: '✦', ingredientCost: 0.64, price: 6, demand: 1.16, unlock: { type: 'level', level: 4 } },
  { id: 'golden', name: 'Golden Cookie', detail: 'A rare, buttery treat for special days', emoji: '✧', ingredientCost: 0.82, price: 7.5, demand: 0.88, unlock: { type: 'mission', name: 'Daily sales' } },
];

export const MISSION_DEFINITIONS = [
  { id: 'cookie-rush', type: 'cookiesSold', name: 'Cookie rush', description: 'Sell 20 cookies during a business day.', goal: 20, reward: 45, recipeReward: 'chip' },
  { id: 'happy-regulars', type: 'customersServed', name: 'Happy regulars', description: 'Serve 10 customers at the counter.', goal: 10, reward: 60 },
  { id: 'daily-sales', type: 'revenue', name: 'A busy little till', description: 'Earn $100 in cookie sales during a business day.', goal: 100, reward: 80, recipeReward: 'golden' },
  { id: 'profitable-day', type: 'positiveProfit', name: 'In the black', description: 'Finish a business day with a positive profit.', goal: 1, reward: 65 },
  { id: 'neighborhood-favorite', type: 'reputation', name: 'Neighborhood favorite', description: 'Reach 70 neighborhood reputation.', goal: 70, reward: 100, recipeReward: 'berry' },
];

export function createMission(day = 1, achievements = []) {
  const index = ((Math.max(1, Math.floor(day)) - 1) + achievements.length) % MISSION_DEFINITIONS.length;
  return { ...MISSION_DEFINITIONS[index], progress: 0, claimed: false, ready: false };
}

export function getRecipe(id) {
  return RECIPES.find(recipe => recipe.id === id) || RECIPES[0];
}
