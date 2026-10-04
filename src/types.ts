export const UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'tsp', 'tbsp'] as const;

export type Unit = (typeof UNITS)[number];

export type PantryCategory = 'Produce' | 'Dairy' | 'Dry goods' | 'Protein' | 'Seasoning' | 'Other';

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
  name: string;
  amount: number;
  unit: Unit;
  category: PantryCategory;
  optional?: boolean;
};

export type PantryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: PantryCategory;
  expiresAt?: string;
  updatedAt: string;
};

export type ShoppingItem = {
  id: string;
  name: string;
  amount: number;
  unit: Unit;
  category: PantryCategory;
  checked: boolean;
  sourceRecipeIds: string[];
};

export type Tab = 'home' | 'recipes' | 'pantry' | 'shopping';

export type RecipeDraft = Omit<Recipe, 'id' | 'createdAt'>;

export type PantryDraft = Omit<PantryItem, 'id' | 'updatedAt'>;

export type ShoppingDraft = Omit<ShoppingItem, 'id' | 'checked' | 'sourceRecipeIds'>;
