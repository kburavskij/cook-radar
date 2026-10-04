import type { Ingredient, PantryItem, Recipe, ShoppingItem, Unit } from './types';
import { normalizeFoodName } from './i18n';

export const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export const normalize = normalizeFoodName;

const ingredientIdentity = (item: { name: string; ingredientKey?: string }) => item.ingredientKey ?? normalize(item.name);

type UnitFamily = 'weight' | 'volume' | 'count';

const family = (unit: Unit): UnitFamily => {
  if (unit === 'g' || unit === 'kg') return 'weight';
  if (unit === 'ml' || unit === 'l' || unit === 'tsp' || unit === 'tbsp') return 'volume';
  return 'count';
};

const toBase = (amount: number, unit: Unit) => {
  if (unit === 'kg') return amount * 1000;
  if (unit === 'l') return amount * 1000;
  if (unit === 'tbsp') return amount * 15;
  if (unit === 'tsp') return amount * 5;
  return amount;
};

const fromBase = (amount: number, unit: Unit) => {
  if (unit === 'kg') return amount / 1000;
  if (unit === 'l') return amount / 1000;
  if (unit === 'tbsp') return amount / 15;
  if (unit === 'tsp') return amount / 5;
  return amount;
};

const countKindsMatch = (available?: PantryItem['countKind'], required?: Ingredient['countKind']) => {
  if (!available || !required || available === 'unknown' || required === 'unknown') return true;
  return available === required;
};

export const canCover = (available: PantryItem | undefined, required: Ingredient) => {
  if (!available || available.quantity <= 0) return false;
  if (!countKindsMatch(available.countKind, required.countKind)) return false;
  if (required.quantityKnown === false) return true;
  if (family(available.unit) !== family(required.unit)) return false;
  const requiredAmount = required.amountMax ?? required.amount;
  return toBase(available.quantity, available.unit) >= toBase(requiredAmount, required.unit);
};

export const findPantryItem = (name: string, pantry: PantryItem[], ingredientKey?: string, countKind?: Ingredient['countKind']) => pantry.find((item) => ingredientIdentity(item) === (ingredientKey ?? normalize(name)) && countKindsMatch(item.countKind, countKind));

export const getMissingIngredients = (recipe: Recipe, pantry: PantryItem[]) =>
  recipe.ingredients.flatMap((ingredient) => {
    if (ingredient.optional) return [];
    const available = findPantryItem(ingredient.name, pantry, ingredient.ingredientKey, ingredient.countKind);
    if (canCover(available, ingredient)) return [];
    if (available && countKindsMatch(available.countKind, ingredient.countKind) && family(available.unit) === family(ingredient.unit)) {
      const requiredAmount = ingredient.amountMax ?? ingredient.amount;
      const remaining = toBase(requiredAmount, ingredient.unit) - toBase(available.quantity, available.unit);
      return [{ ...ingredient, amount: Math.max(fromBase(remaining, ingredient.unit), 0), amountMax: undefined }];
    }
    return [ingredient];
  });

export const getRecipeStatus = (recipe: Recipe, pantry: PantryItem[]) => {
  const required = recipe.ingredients.filter((ingredient) => !ingredient.optional);
  const missing = getMissingIngredients(recipe, pantry);
  return { missing, total: required.length, ready: missing.length === 0, percent: Math.round(((required.length - missing.length) / Math.max(required.length, 1)) * 100) };
};

const shoppingUnit = (unit: Unit) => family(unit) === 'weight' ? 'g' : family(unit) === 'volume' ? 'ml' : unit;

const shoppingAmount = (amount: number, unit: Unit) => fromBase(toBase(amount, unit), shoppingUnit(unit));

export const addOrMergeShopping = (list: ShoppingItem[], ingredient: Ingredient, recipeId: string) => {
  const ingredientAmount = ingredient.amountMax ?? ingredient.amount;
  const existing = list.find((item) => ingredientIdentity(item) === ingredientIdentity(ingredient)
    && countKindsMatch(item.countKind, ingredient.countKind)
    && family(item.unit) === family(ingredient.unit));
  if (existing) {
    return list.map((item) =>
      item.id === existing.id
        ? {
          ...item,
          ingredientKey: ingredient.ingredientKey ?? item.ingredientKey,
          amount: item.quantityKnown === false || ingredient.quantityKnown === false
            ? item.amount
            : shoppingAmount(item.amount, item.unit) + shoppingAmount(ingredientAmount, ingredient.unit),
          unit: shoppingUnit(item.unit),
          sourceRecipeIds: [...new Set([...item.sourceRecipeIds, recipeId])],
          note: item.note ?? ingredient.note,
          quantityKnown: item.quantityKnown === false || ingredient.quantityKnown === false ? false : item.quantityKnown ?? ingredient.quantityKnown,
          amountMax: undefined,
        }
        : item,
    );
  }
  const unit = shoppingUnit(ingredient.unit);
  return [
    ...list,
    {
      id: makeId('shopping'),
      ingredientKey: ingredient.ingredientKey,
      name: ingredient.name,
      amount: shoppingAmount(ingredientAmount, ingredient.unit),
      unit,
      category: ingredient.category,
      countKind: ingredient.countKind,
      checked: false,
      sourceRecipeIds: [recipeId],
      note: ingredient.note,
      quantityKnown: ingredient.quantityKnown,
      amountMax: undefined,
    },
  ];
};

export const formatAmount = (amount: number) => Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

export const formatDate = (iso?: string) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00`));
};
