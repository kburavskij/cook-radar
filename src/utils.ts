import type { Ingredient, PantryItem, Recipe, ShoppingItem, Unit } from './types';

export const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const family = (unit: Unit) => {
  if (unit === 'g' || unit === 'kg') return 'weight';
  if (unit === 'ml' || unit === 'l') return 'volume';
  if (unit === 'tsp' || unit === 'tbsp') return 'spoon';
  return unit;
};

const toBase = (amount: number, unit: Unit) => {
  if (unit === 'kg') return amount * 1000;
  if (unit === 'l') return amount * 1000;
  if (unit === 'tbsp') return amount * 3;
  return amount;
};

const fromBase = (amount: number, unit: Unit) => {
  if (unit === 'kg') return amount / 1000;
  if (unit === 'l') return amount / 1000;
  if (unit === 'tbsp') return amount / 3;
  return amount;
};

export const canCover = (available: PantryItem | undefined, required: Ingredient) => {
  if (!available || available.quantity <= 0 || family(available.unit) !== family(required.unit)) return false;
  return toBase(available.quantity, available.unit) >= toBase(required.amount, required.unit);
};

export const findPantryItem = (name: string, pantry: PantryItem[]) => pantry.find((item) => normalize(item.name) === normalize(name));

export const getMissingIngredients = (recipe: Recipe, pantry: PantryItem[]) =>
  recipe.ingredients.flatMap((ingredient) => {
    if (ingredient.optional) return [];
    const available = findPantryItem(ingredient.name, pantry);
    if (canCover(available, ingredient)) return [];
    if (available && family(available.unit) === family(ingredient.unit)) {
      const remaining = toBase(ingredient.amount, ingredient.unit) - toBase(available.quantity, available.unit);
      return [{ ...ingredient, amount: Math.max(fromBase(remaining, ingredient.unit), 0) }];
    }
    return [ingredient];
  });

export const getRecipeStatus = (recipe: Recipe, pantry: PantryItem[]) => {
  const required = recipe.ingredients.filter((ingredient) => !ingredient.optional);
  const missing = getMissingIngredients(recipe, pantry);
  return { missing, total: required.length, ready: missing.length === 0, percent: Math.round(((required.length - missing.length) / Math.max(required.length, 1)) * 100) };
};

export const addOrMergeShopping = (list: ShoppingItem[], ingredient: Ingredient, recipeId: string) => {
  const existing = list.find((item) => normalize(item.name) === normalize(ingredient.name) && item.unit === ingredient.unit);
  if (existing) {
    return list.map((item) =>
      item.id === existing.id
        ? { ...item, amount: Math.max(item.amount, ingredient.amount), sourceRecipeIds: [...new Set([...item.sourceRecipeIds, recipeId])] }
        : item,
    );
  }
  return [
    ...list,
    {
      id: makeId('shopping'),
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      category: ingredient.category,
      checked: false,
      sourceRecipeIds: [recipeId],
    },
  ];
};

export const formatAmount = (amount: number) => Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

export const formatDate = (iso?: string) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00`));
};
