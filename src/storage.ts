import type { PantryItem, Recipe, ShoppingItem } from './types';
import { starterPantry, starterRecipes, starterShopping } from './data';

const keys = {
  recipes: 'cook-radar:recipes:v1',
  pantry: 'cook-radar:pantry:v1',
  shopping: 'cook-radar:shopping:v1',
};

const legacyKeys = {
  recipes: 'mise:recipes:v1',
  pantry: 'mise:pantry:v1',
  shopping: 'mise:shopping:v1',
};

const read = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

const readWithMigration = <T>(key: string, legacyKey: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const current = read<T>(key, fallback);
  if (window.localStorage.getItem(key)) return current;
  const legacy = read<T | null>(legacyKey, null);
  if (legacy !== null) {
    window.localStorage.setItem(key, JSON.stringify(legacy));
    return legacy;
  }
  return current;
};

export const loadRecipes = (): Recipe[] => readWithMigration(keys.recipes, legacyKeys.recipes, starterRecipes);
export const loadPantry = (): PantryItem[] => readWithMigration(keys.pantry, legacyKeys.pantry, starterPantry);
export const loadShopping = (): ShoppingItem[] => readWithMigration(keys.shopping, legacyKeys.shopping, starterShopping);

export const saveRecipes = (recipes: Recipe[]) => window.localStorage.setItem(keys.recipes, JSON.stringify(recipes));
export const savePantry = (pantry: PantryItem[]) => window.localStorage.setItem(keys.pantry, JSON.stringify(pantry));
export const saveShopping = (shopping: ShoppingItem[]) => window.localStorage.setItem(keys.shopping, JSON.stringify(shopping));
