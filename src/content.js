export const RECIPES = [
  {
    id: 'classic',
    name: 'Classic Cookie',
    detail: 'Golden, buttery, and beloved by everyone in town.',
    emoji: '●',
    color: '#c9823d',
    chipColor: '#4e2922',
    ingredientCost: 0.45,
    recommendedPrice: 3.50,
    demand: 1.0,
    description: 'A cozy everyday favorite with balanced appeal and low ingredient cost.',
    unlock: { type: 'starter' },
  },
  {
    id: 'chip',
    name: 'Chocolate Chip Cookie',
    detail: 'Rich semi-sweet chocolate morsels folded into golden dough.',
    emoji: '◉',
    color: '#cfa066',
    chipColor: '#361d15',
    ingredientCost: 0.50,
    recommendedPrice: 3.80,
    demand: 1.15,
    description: 'Crowd pleaser with high steady demand and great customer satisfaction.',
    unlock: { type: 'mission', missionId: 'cookie-rush', cost: 85 },
  },
  {
    id: 'berry',
    name: 'Strawberry Cookie',
    detail: 'Pink berry dough topped with sweet strawberry glaze ribbons.',
    emoji: '✿',
    color: '#e894a4',
    chipColor: '#be4364',
    ingredientCost: 0.65,
    recommendedPrice: 4.80,
    demand: 1.12,
    description: 'Sweet berry flavor that draws kids and sweet-tooth neighbors from across town.',
    unlock: { type: 'level', level: 2, cost: 140 },
  },
  {
    id: 'choco',
    name: 'Double Chocolate Cookie',
    detail: 'Deep Dutch dark cocoa dough loaded with rich chocolate chunks.',
    emoji: '⬟',
    color: '#5c382b',
    chipColor: '#2b150d',
    ingredientCost: 0.80,
    recommendedPrice: 5.50,
    demand: 1.10,
    description: 'Decadent chocolate lover delight with solid profit margins per cookie.',
    unlock: { type: 'cash', cost: 180 },
  },
  {
    id: 'rainbow',
    name: 'Rainbow Cookie',
    detail: 'Swirled colorful dough coated with rainbow sprinkle confetti.',
    emoji: '✦',
    color: '#d6b38c',
    chipColor: '#489fd6',
    hasSprinkles: true,
    ingredientCost: 1.00,
    recommendedPrice: 6.50,
    demand: 1.22,
    description: 'Vibrant showstopper that boosts shop buzz and neighborhood reputation.',
    unlock: { type: 'level', level: 4, cost: 260 },
  },
  {
    id: 'golden',
    name: 'Golden Cookie',
    detail: 'Infused with edible gold luster dust and Madagascan vanilla butter.',
    emoji: '✧',
    color: '#e8ba4f',
    chipColor: '#ffd700',
    isGolden: true,
    ingredientCost: 1.50,
    recommendedPrice: 8.50,
    demand: 0.95,
    description: 'A luxurious premium specialty that earns massive profit per sale.',
    unlock: { type: 'mission', missionId: 'daily-sales', cost: 360 },
  },
];

export const UPGRADE_DEFINITIONS = {
  oven: [
    { level: 1, name: 'Turbo Heating Deck', cost: 120, maxBatch: 50, speedBoost: 0.18, savings: 0.05, desc: 'Bake up to 50 cookies 18% faster with 5% ingredient savings.' },
    { level: 2, name: 'Dual Fan Convection', cost: 215, maxBatch: 70, speedBoost: 0.32, savings: 0.10, desc: 'Bake up to 70 cookies 32% faster with 10% ingredient savings.' },
    { level: 3, name: 'Stone Baking Hearth', cost: 330, maxBatch: 90, speedBoost: 0.45, savings: 0.15, desc: 'Bake up to 90 cookies 45% faster with 15% ingredient savings.' },
    { level: 4, name: 'Digital Precision Deck', cost: 465, maxBatch: 115, speedBoost: 0.58, savings: 0.20, desc: 'Bake up to 115 cookies 58% faster with 20% ingredient savings.' },
    { level: 5, name: 'Royal Gold Rotisserie', cost: 620, maxBatch: 140, speedBoost: 0.70, savings: 0.25, desc: 'Master bakery power! 140 cookies, 70% faster, 25% ingredient savings.' },
  ],
  counter: [
    { level: 1, name: 'Marble Service Top', cost: 100, maxQueue: 6, speedBoost: 0.15, desc: 'Expands customer queue to 6 and speeds up checkout by 15%.' },
    { level: 2, name: 'Express Register', cost: 160, maxQueue: 7, speedBoost: 0.30, desc: 'Expands customer queue to 7 and speeds up checkout by 30%.' },
    { level: 3, name: 'Glass Pastry Guard', cost: 230, maxQueue: 8, speedBoost: 0.45, desc: 'Expands customer queue to 8 and delights waiting customers.' },
    { level: 4, name: 'Dual Checkout Station', cost: 310, maxQueue: 9, speedBoost: 0.60, desc: 'Expands customer queue to 9 and keeps checkout moving smoothly.' },
    { level: 5, name: 'Grand Patisserie Counter', cost: 420, maxQueue: 10, speedBoost: 0.75, desc: 'Luxury counter! Queue of 10 customers with lightning-fast service.' },
  ],
  shelves: [
    { level: 1, name: 'Tiered Glass Stands', cost: 85, demandBoost: 0.15, desc: 'Displays cookies beautifully, increasing visitor foot traffic by 15%.' },
    { level: 2, name: 'Illuminated Display', cost: 135, demandBoost: 0.30, desc: 'Warm warm lighting that attracts 30% more daily customers.' },
    { level: 3, name: 'Cozy Sampling Stand', cost: 195, demandBoost: 0.45, desc: 'Sweet complimentary samples attract 45% more neighborhood visitors.' },
    { level: 4, name: 'Gourmet Pastry Tower', cost: 270, demandBoost: 0.60, desc: 'Eye-catching centerpiece boosting customer interest by 60%.' },
    { level: 5, name: 'Royal Sweet Emporium', cost: 360, demandBoost: 0.80, desc: 'The talk of the town! Boosts customer traffic by a massive 80%.' },
  ],
};

export const MISSION_DEFINITIONS = [
  {
    id: 'cookie-rush',
    type: 'cookiesSold',
    name: 'Cookie Rush',
    description: 'Sell 20 cookies during a single business day.',
    goal: 20,
    reward: 45,
    recipeReward: 'chip',
  },
  {
    id: 'happy-regulars',
    type: 'customersServed',
    name: 'Happy Regulars',
    description: 'Serve 10 customers at the bakery counter.',
    goal: 10,
    reward: 60,
  },
  {
    id: 'daily-sales',
    type: 'revenue',
    name: 'Sweet Revenue',
    description: 'Earn $100 in cookie sales during a business day.',
    goal: 100,
    reward: 80,
    recipeReward: 'golden',
  },
  {
    id: 'profitable-day',
    type: 'positiveProfit',
    name: 'In the Black',
    description: 'Finish a business day with positive net profit.',
    goal: 1,
    reward: 65,
  },
  {
    id: 'neighborhood-favorite',
    type: 'reputation',
    name: 'Town Favorite',
    description: 'Reach 70 neighborhood reputation.',
    goal: 70,
    reward: 95,
    recipeReward: 'berry',
  },
  {
    id: 'baker-mastery',
    type: 'cookiesSold',
    name: 'Flour Power',
    description: 'Sell 35 cookies in a single busy business day.',
    goal: 35,
    reward: 110,
  },
  {
    id: 'big-turnover',
    type: 'revenue',
    name: 'Golden Till',
    description: 'Earn $180 in cookie revenue in a single day.',
    goal: 180,
    reward: 135,
  },
];

export const ACHIEVEMENTS = [
  {
    id: 'first-sale',
    name: 'First Sale',
    description: 'Sell your very first cookie to a happy neighbor.',
    icon: '✦',
    reward: 25,
  },
  {
    id: '100-cookies',
    name: '100 Cookies Sold',
    description: 'Bake and sell 100 total cookies across your bakery journey.',
    icon: '●',
    reward: 50,
  },
  {
    id: '100-customers',
    name: '100 Customers Served',
    description: 'Welcome and serve 100 sweet neighbors at your counter.',
    icon: '☺',
    reward: 50,
  },
  {
    id: 'first-oven-upgrade',
    name: 'First Oven Upgrade',
    description: 'Invest in your first commercial bakery oven upgrade.',
    icon: '♨',
    reward: 40,
  },
  {
    id: 'first-profitable-day',
    name: 'First Profitable Day',
    description: 'Complete a business day with positive net profit.',
    icon: '$',
    reward: 35,
  },
  {
    id: 'campaign-complete',
    name: 'Complete the 30-Day Campaign',
    description: 'Guide your cozy bakery through all 30 days of the campaign.',
    icon: '★',
    reward: 200,
  },
  {
    id: 'recipe-master',
    name: 'Master Baker Menu',
    description: 'Unlock all 5 specialty cookie recipes in Kevin’s book.',
    icon: '✿',
    reward: 100,
  },
];

export function getRecipe(id) {
  return RECIPES.find(recipe => recipe.id === id) || RECIPES[0];
}

export function createMission(day = 1, completedMissionIds = []) {
  const available = MISSION_DEFINITIONS.filter(m => !completedMissionIds.includes(m.id));
  if (!available.length) {
    const cycle = MISSION_DEFINITIONS[(day - 1) % MISSION_DEFINITIONS.length];
    return { ...cycle, progress: 0, claimed: false, ready: false };
  }
  const index = (Math.max(1, Math.floor(day)) - 1) % available.length;
  return { ...available[index], progress: 0, claimed: false, ready: false };
}
