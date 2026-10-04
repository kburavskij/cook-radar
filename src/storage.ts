import type { PantryItem, Recipe, ShoppingItem } from './types';
import { starterPantry, starterRecipes, starterShopping } from './data';
import { findIngredientCatalogEntry } from './ingredientCatalog';
import { normalizeIngredientRecord } from './ingredientNormalization';

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

const normalizeInventoryItem = <T extends PantryItem | ShoppingItem>(item: T): T => {
  const catalogEntry = findIngredientCatalogEntry(item.name);
  return {
    ...item,
    ingredientKey: catalogEntry?.key ?? item.ingredientKey,
    name: catalogEntry?.canonicalName ?? item.name.trim(),
    category: catalogEntry?.category ?? item.category,
    // Legacy inventory quantities used `pcs` without saying what one piece
    // means. Keep those records compatible with any count kind until the user
    // confirms the interpretation instead of guessing from the food name.
    countKind: item.countKind ?? 'unknown',
  };
};

export const loadRecipes = (): Recipe[] => readWithMigration(keys.recipes, legacyKeys.recipes, starterRecipes).map((recipe) => ({ ...recipe, ingredients: recipe.ingredients.map(normalizeIngredientRecord) }));
export const loadPantry = (): PantryItem[] => readWithMigration(keys.pantry, legacyKeys.pantry, starterPantry).map(normalizeInventoryItem);
export const loadShopping = (): ShoppingItem[] => readWithMigration(keys.shopping, legacyKeys.shopping, starterShopping).map(normalizeInventoryItem);

export const saveRecipes = (recipes: Recipe[]) => window.localStorage.setItem(keys.recipes, JSON.stringify(recipes));
export const savePantry = (pantry: PantryItem[]) => window.localStorage.setItem(keys.pantry, JSON.stringify(pantry));
export const saveShopping = (shopping: ShoppingItem[]) => window.localStorage.setItem(keys.shopping, JSON.stringify(shopping));
