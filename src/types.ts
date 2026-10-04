export const UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'tsp', 'tbsp'] as const;

export type Unit = (typeof UNITS)[number];

export type PantryCategory = 'Produce' | 'Dairy' | 'Dry goods' | 'Protein' | 'Seasoning' | 'Other';

export type CountKind =
  | 'whole'
  | 'clove'
  | 'can'
  | 'jar'
  | 'bottle'
  | 'packet'
  | 'bag'
  | 'box'
  | 'bunch'
  | 'head'
  | 'stalk'
  | 'sprig'
  | 'slice'
  | 'fillet'
  | 'breast'
  | 'thigh'
  | 'leaf'
  | 'strip'
  | 'egg'
  | 'piece'
  | 'unknown';

export type Recipe = {
  id: string;
  title: string;
  description: string;
  minutes: number;
  servings: number;
  category: string;
  tags: string[];
  accent: 'sage' | 'apricot' | 'plum' | 'sky' | 'tomato';
  icon: string;
  favorite: boolean;
  ingredients: Ingredient[];
  steps: string[];
  sourceUrl?: string;
  sourceName?: string;
  createdAt: string;
};

export type Ingredient = {
  id: string;
  ingredientKey?: string;
  name: string;
  amount: number;
  amountMax?: number;
  unit: Unit;
  category: PantryCategory;
  countKind?: CountKind;
  optional?: boolean;
  note?: string;
  quantityKnown?: boolean;
};

export type PantryItem = {
  id: string;
  ingredientKey?: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: PantryCategory;
  countKind?: CountKind;
  expiresAt?: string;
  updatedAt: string;
};

export type ShoppingItem = {
  id: string;
  ingredientKey?: string;
  name: string;
  amount: number;
  amountMax?: number;
  unit: Unit;
  category: PantryCategory;
  countKind?: CountKind;
  checked: boolean;
  sourceRecipeIds: string[];
  note?: string;
  quantityKnown?: boolean;
};

export type Tab = 'home' | 'recipes' | 'pantry' | 'shopping';

export type RecipeDraft = Omit<Recipe, 'id' | 'createdAt'>;

export type PantryDraft = Omit<PantryItem, 'id' | 'updatedAt'>;

export type ShoppingDraft = Omit<ShoppingItem, 'id' | 'checked' | 'sourceRecipeIds'>;
