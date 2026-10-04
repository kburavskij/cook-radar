import type { PantryItem, Recipe, ShoppingItem } from './types';
import { starterPantry, starterRecipes, starterShopping } from './data';

const keys = {
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

export const loadRecipes = (): Recipe[] => read(keys.recipes, starterRecipes);
export const loadPantry = (): PantryItem[] => read(keys.pantry, starterPantry);
export const loadShopping = (): ShoppingItem[] => read(keys.shopping, starterShopping);

export const saveRecipes = (recipes: Recipe[]) => window.localStorage.setItem(keys.recipes, JSON.stringify(recipes));
export const savePantry = (pantry: PantryItem[]) => window.localStorage.setItem(keys.pantry, JSON.stringify(pantry));
export const saveShopping = (shopping: ShoppingItem[]) => window.localStorage.setItem(keys.shopping, JSON.stringify(shopping));
