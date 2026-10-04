import type { Ingredient, PantryCategory, RecipeDraft, Unit } from './types';

export type RecipeImportErrorCode = 'invalid-url' | 'unsupported-source' | 'not-found' | 'network' | 'parse' | 'restricted';

export class RecipeImportError extends Error {
  readonly code: RecipeImportErrorCode;

  constructor(code: RecipeImportErrorCode, message: string) {
    super(message);
    this.name = 'RecipeImportError';
    this.code = code;
  }
}

type ImportFormat = 'jsonld' | 'wprm' | 'tasty';

export type RecipeImportSource = {
  id: string;
  label: string;
  hostname: string;
  homeUrl: string;
  format: ImportFormat;
};

export const RECIPE_IMPORT_SOURCES: RecipeImportSource[] = [
  { id: 'recipe-tin-eats', label: 'RecipeTin Eats', hostname: 'recipetineats.com', homeUrl: 'https://www.recipetineats.com/', format: 'wprm' },
  { id: 'love-and-lemons', label: 'Love and Lemons', hostname: 'loveandlemons.com', homeUrl: 'https://www.loveandlemons.com/', format: 'wprm' },
  { id: 'budget-bytes', label: 'Budget Bytes', hostname: 'budgetbytes.com', homeUrl: 'https://www.budgetbytes.com/', format: 'wprm' },
  { id: 'minimalist-baker', label: 'Minimalist Baker', hostname: 'minimalistbaker.com', homeUrl: 'https://minimalistbaker.com/', format: 'wprm' },
  { id: 'cookie-and-kate', label: 'Cookie and Kate', hostname: 'cookieandkate.com', homeUrl: 'https://cookieandkate.com/', format: 'tasty' },
  { id: 'bbc-good-food', label: 'BBC Good Food', hostname: 'bbcgoodfood.com', homeUrl: 'https://www.bbcgoodfood.com/', format: 'jsonld' },
];

type WordPressEntry = {
  id?: number;
  link?: string;
  slug?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
};

type ParsedRecipe = {
  title: string;
  description: string;
  minutes: number;
  servings: number;
  category: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
};

const IMPORT_REQUEST_TIMEOUT_MS = 15_000;

const fractionCharacters: Record<string, string> = {
  '¼': ' 1/4',
  '½': ' 1/2',
  '¾': ' 3/4',
  '⅐': ' 1/7',
  '⅑': ' 1/9',
  '⅒': ' 1/10',
  '⅓': ' 1/3',
  '⅔': ' 2/3',
  '⅕': ' 1/5',
  '⅖': ' 2/5',
  '⅗': ' 3/5',
  '⅘': ' 4/5',
  '⅙': ' 1/6',
  '⅚': ' 5/6',
  '⅛': ' 1/8',
  '⅜': ' 3/8',
  '⅝': ' 5/8',
  '⅞': ' 7/8',
};

const unitAliases: Array<{ unit: Unit; aliases: string[]; multiplier?: number }> = [
  { unit: 'kg', aliases: ['kg', 'kgs', 'kilogram', 'kilograms'] },
  { unit: 'g', aliases: ['g', 'gram', 'grams', 'gramme', 'grammes'] },
  { unit: 'ml', aliases: ['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters'] },
  { unit: 'l', aliases: ['l', 'litre', 'litres', 'liter', 'liters'] },
  { unit: 'tbsp', aliases: ['tbsp', 'tbs', 'tablespoon', 'tablespoons'], multiplier: 1 },
  { unit: 'tsp', aliases: ['tsp', 'teaspoon', 'teaspoons'], multiplier: 1 },
  { unit: 'ml', aliases: ['cup', 'cups'], multiplier: 240 },
  { unit: 'g', aliases: ['oz', 'ounce', 'ounces'], multiplier: 28.35 },
  { unit: 'kg', aliases: ['lb', 'lbs', 'pound', 'pounds'], multiplier: 0.453592 },
];

const sourceForHostname = (hostname: string) => {
  const normalized = hostname.toLowerCase().replace(/^www\./, '');
  return RECIPE_IMPORT_SOURCES.find((source) => normalized === source.hostname || normalized.endsWith(`.${source.hostname}`));
};

export const getRecipeImportSource = (value: string) => {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? sourceForHostname(url.hostname) : undefined;
  } catch {
    return undefined;
  }
};

const recipeUrl = (value: string) => {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new RecipeImportError('invalid-url', 'The recipe link is not a valid URL.');
  }
  if (url.protocol !== 'https:') {
    throw new RecipeImportError('invalid-url', 'Recipe links must use HTTPS.');
  }
  if (!sourceForHostname(url.hostname)) {
    throw new RecipeImportError('unsupported-source', 'This recipe website is not supported yet.');
  }
  return url;
};

const textContent = (element: Element | null | undefined) => element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

const firstText = (root: ParentNode, selectors: string[]) => {
  for (const selector of selectors) {
    const value = textContent(root.querySelector(selector));
    if (value) return value;
  }
  return '';
};

const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const parseNumber = (value: string) => {
  let normalized = value.replace(/\u00a0/g, ' ').trim();
  Object.entries(fractionCharacters).forEach(([character, replacement]) => { normalized = normalized.replaceAll(character, replacement); });
  normalized = normalized.replace(/,/g, '.');

  const mixed = normalized.match(/(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = normalized.match(/(\d+)\s*\/\s*(\d+)/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const decimal = normalized.match(/(?:\d+(?:\.\d+)?|\.\d+)/);
  return decimal ? Number(decimal[0]) : undefined;
};

const roundQuantity = (value: number) => Math.round(value * 100) / 100;

const unitFromText = (value: string) => {
  const normalized = value.toLowerCase().replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim();
  let matchResult: { unit: Unit; multiplier: number; index: number } | undefined;
  for (const entry of unitAliases) {
    for (const alias of entry.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = new RegExp(`(?:^|\\s|\\d)${escaped}(?=\\s|$|[/.,])`, 'i').exec(normalized);
      if (match) {
        const index = match.index + (match[0].length - alias.length);
        if (!matchResult || index < matchResult.index) matchResult = { unit: entry.unit, multiplier: entry.multiplier ?? 1, index };
      }
    }
  }
  if (matchResult) return matchResult;
  if (/\b(cloves?|eggs?|pieces?|piece|cans?|jars?|bunch(?:es)?|heads?|stalks?|sprigs?|leaves?|slices?|fillets?|breasts?|thighs?)\b/i.test(normalized)) {
    return { unit: 'pcs' as Unit, multiplier: 1 };
  }
  return undefined;
};

const cleanIngredientName = (value: string) => value
  .replace(/^[-•*]\s*/, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*,\s*$/, '')
  .trim();

const guessCategory = (name: string): PantryCategory => {
  const normalized = name.toLowerCase();
  if (/milk|cream|cheese|parmesan|mozzarella|yogurt|yoghurt|butter|sour cream|feta|ricotta/.test(normalized)) return 'Dairy';
  if (/chicken|turkey|beef|pork|lamb|steak|salmon|tuna|fish|shrimp|prawn|meat|egg/.test(normalized)) return 'Protein';
  if (/flour|rice|pasta|spaghetti|noodle|bread|oat|lentil|bean|chickpea|couscous|quinoa|tortilla|wrap|stock|broth|tomato paste|canned/.test(normalized)) return 'Dry goods';
  if (/salt|pepper|paprika|cumin|cinnamon|oregano|basil|thyme|rosemary|spice|oil|vinegar|soy sauce|sauce|honey|sugar/.test(normalized)) return 'Seasoning';
  if (/apple|avocado|banana|berry|broccoli|carrot|celery|cucumber|garlic|ginger|herb|kale|lemon|lime|mushroom|onion|parsley|potato|spinach|tomato|vegetable|zucchini|courgette|pepper/.test(normalized)) return 'Produce';
  return 'Other';
};

const ingredientFromParts = (amountText: string, unitText: string, nameText: string, optional = false): Ingredient => {
  const rawAmount = amountText.trim();
  const parsedAmount = parseNumber(rawAmount) ?? 1;
  const detected = unitFromText(`${unitText} ${rawAmount}`);
  const amount = roundQuantity(parsedAmount * (detected?.multiplier ?? 1));
  const unit = detected?.unit ?? 'pcs';
  const name = cleanIngredientName(nameText) || cleanIngredientName(`${unitText} ${rawAmount}`) || 'Ingredient';
  return { id: crypto.randomUUID(), name, amount: amount > 0 ? amount : 1, unit, category: guessCategory(name), optional };
};

const ingredientFromLine = (line: string): Ingredient => {
  const clean = cleanIngredientName(line);
  const amountMatch = clean.match(/^((?:\d+(?:[.,]\d+)?|\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])(?:\s*[-–]\s*(?:\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+))?)(?:\s+|$)(.*)$/u);
  if (!amountMatch) return ingredientFromParts('1', '', clean, /\b(to taste|as needed|if using|optional)\b/i.test(clean));

  const amountText = amountMatch[1];
  let rest = amountMatch[2].trim();
  let unitText = '';
  const unitMatch = rest.match(/^((?:cups?|tbsp|tbs|tablespoons?|tsp|teaspoons?|kg|kgs?|kilograms?|g|grams?|grammes?|ml|millilit(?:re|er)s?|l|lit(?:re|er)s?|oz|ounces?|lbs?|pounds?|cloves?|eggs?|pieces?|cans?|jars?|bunch(?:es)?|heads?|stalks?|sprigs?|leaves?|slices?|fillets?|breasts?|thighs?))(?:\s+|$)(.*)$/i);
  if (unitMatch) {
    unitText = unitMatch[1];
    rest = unitMatch[2];
  }
  const optional = /\b(optional|if using|to taste|as needed)\b/i.test(rest) || /\b(optional|if using|to taste|as needed)\b/i.test(clean);
  return ingredientFromParts(amountText, unitText, rest, optional);
};

const durationToMinutes = (value: string) => {
  const iso = value.match(/^P(?:\d+D)?T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?/i);
  if (iso) return Math.round(Number(iso[1] ?? 0) * 60 + Number(iso[2] ?? 0));
  return parseNumber(value);
};

const servingsFromText = (value: string) => parseNumber(value);

const pickIcon = (title: string, category: string) => {
  const value = `${title} ${category}`.toLowerCase();
  if (/pasta|spaghetti|noodle/.test(value)) return '🍝';
  if (/salad/.test(value)) return '🥗';
  if (/soup|stew|chili|curry/.test(value)) return '🍲';
  if (/fish|salmon|tuna|seafood|shrimp|prawn/.test(value)) return '🐟';
  if (/chicken|turkey|beef|pork|meat/.test(value)) return '🍗';
  if (/cake|cookie|brownie|dessert|pie|muffin/.test(value)) return '🍰';
  if (/bread|pizza|tart/.test(value)) return '🥖';
  return '🍲';
};

const pickAccent = (title: string, category: string): RecipeDraft['accent'] => {
  const value = `${title} ${category}`.toLowerCase();
  if (/salad|vegetable|green|herb/.test(value)) return 'sage';
  if (/dessert|cake|cookie|sweet|breakfast/.test(value)) return 'apricot';
  if (/pasta|tomato|pizza|chili/.test(value)) return 'tomato';
  if (/fish|seafood|salmon/.test(value)) return 'sky';
  if (/curry|stew|soup|bean/.test(value)) return 'plum';
  return 'sage';
};

const toDraft = (parsed: ParsedRecipe): RecipeDraft => ({
  title: parsed.title,
  description: parsed.description,
  minutes: parsed.minutes || 30,
  servings: parsed.servings || 2,
  category: parsed.category || 'Dinner',
  tags: unique(parsed.tags).slice(0, 6),
  accent: pickAccent(parsed.title, parsed.category),
  icon: pickIcon(parsed.title, parsed.category),
  favorite: false,
  ingredients: parsed.ingredients,
  steps: parsed.steps,
});

const jsonLdRecipes = (document: Document) => {
  const values: unknown[] = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
    try {
      const parsed = JSON.parse(script.textContent ?? '');
      if (Array.isArray(parsed)) values.push(...parsed);
      else values.push(parsed);
    } catch {
      // Some sites include analytics JSON in a recipe page. Ignore invalid blocks.
    }
  });
  const recipes: Record<string, unknown>[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const object = value as Record<string, unknown>;
    const type = object['@type'];
    if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) recipes.push(object);
    if (Array.isArray(object['@graph'])) object['@graph'].forEach(visit);
  };
  values.forEach(visit);
  return recipes;
};

const jsonLdInstructions = (value: unknown): string[] => {
  if (typeof value === 'string') return value.split(/\n+/).map((step) => step.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  if (Array.isArray(value)) return value.flatMap((item) => {
    if (typeof item === 'string') return jsonLdInstructions(item);
    if (!item || typeof item !== 'object') return [];
    const object = item as Record<string, unknown>;
    if (Array.isArray(object.itemListElement)) return jsonLdInstructions(object.itemListElement);
    return typeof object.text === 'string' ? jsonLdInstructions(object.text) : [];
  });
  if (!value || typeof value !== 'object') return [];
  const object = value as Record<string, unknown>;
  if (Array.isArray(object.itemListElement)) return jsonLdInstructions(object.itemListElement);
  return typeof object.text === 'string' ? jsonLdInstructions(object.text) : [];
};

const parseJsonLd = (document: Document): ParsedRecipe | undefined => {
  const recipe = jsonLdRecipes(document)[0];
  if (!recipe || !Array.isArray(recipe.recipeIngredient)) return undefined;
  const freeAccess = recipe.isAccessibleForFree;
  if (freeAccess === false || (typeof freeAccess === 'string' && freeAccess.toLowerCase() === 'false') || document.querySelector('.zephr-locked-content')) {
    throw new RecipeImportError('restricted', 'This recipe is not available for free import.');
  }
  const ingredients = recipe.recipeIngredient.flatMap((value) => typeof value === 'string' ? [ingredientFromLine(value)] : []);
  const steps = jsonLdInstructions(recipe.recipeInstructions);
  if (!ingredients.length || !steps.length) return undefined;
  const title = typeof recipe.name === 'string' ? recipe.name.trim() : '';
  if (!title) return undefined;
  const prep = typeof recipe.prepTime === 'string' ? durationToMinutes(recipe.prepTime) ?? 0 : 0;
  const cook = typeof recipe.cookTime === 'string' ? durationToMinutes(recipe.cookTime) ?? 0 : 0;
  const total = typeof recipe.totalTime === 'string' ? durationToMinutes(recipe.totalTime) ?? 0 : 0;
  const keywords = typeof recipe.keywords === 'string' ? recipe.keywords.split(',') : Array.isArray(recipe.keywords) ? recipe.keywords.filter((value): value is string => typeof value === 'string') : [];
  const category = typeof recipe.recipeCategory === 'string' ? recipe.recipeCategory : 'Dinner';
  return {
    title,
    description: typeof recipe.description === 'string' ? recipe.description.replace(/\s+/g, ' ').trim() : '',
    minutes: total || prep + cook || 30,
    servings: Array.isArray(recipe.recipeYield) ? servingsFromText(String(recipe.recipeYield[0])) ?? 2 : servingsFromText(String(recipe.recipeYield ?? '')) ?? 2,
    category,
    tags: unique([...keywords, typeof recipe.recipeCuisine === 'string' ? recipe.recipeCuisine : '']),
    ingredients,
    steps,
  };
};

const parseWprm = (document: Document): ParsedRecipe | undefined => {
  const root = document.querySelector('.wprm-recipe');
  if (!root) return undefined;
  const ingredientNodes = [...root.querySelectorAll('.wprm-recipe-ingredient')];
  const ingredients = ingredientNodes.flatMap((node) => {
    const amount = firstText(node, ['.wprm-recipe-ingredient-amount']);
    const unit = firstText(node, ['.wprm-recipe-ingredient-unit']);
    const name = firstText(node, ['.wprm-recipe-ingredient-name']) || textContent(node);
    return name ? [ingredientFromParts(amount || '1', unit, name, node.classList.contains('wprm-recipe-ingredient-optional'))] : [];
  });
  const steps = [...root.querySelectorAll('.wprm-recipe-instruction')].map((node) => firstText(node, ['.wprm-recipe-instruction-text']) || textContent(node)).filter(Boolean);
  if (!ingredients.length || !steps.length) return undefined;
  const title = firstText(root, ['.wprm-recipe-name', '.wprm-recipe-header-name']);
  if (!title) return undefined;
  const prep = parseNumber(firstText(root, ['.wprm-recipe-prep_time-minutes', '.wprm-recipe-prep_time']));
  const cook = parseNumber(firstText(root, ['.wprm-recipe-cook_time-minutes', '.wprm-recipe-cook_time']));
  return {
    title,
    description: firstText(root, ['.wprm-recipe-summary', '.wprm-recipe-description']),
    minutes: (prep ?? 0) + (cook ?? 0) || parseNumber(firstText(root, ['.wprm-recipe-total_time-minutes', '.wprm-recipe-total_time'])) || 30,
    servings: servingsFromText(firstText(root, ['.wprm-recipe-servings', '.wprm-recipe-yield'])) ?? 2,
    category: firstText(root, ['.wprm-recipe-course']) || 'Dinner',
    tags: unique([
      ...[...root.querySelectorAll('.wprm-recipe-keyword')].map(textContent),
      firstText(root, ['.wprm-recipe-cuisine']),
    ]),
    ingredients,
    steps,
  };
};

const parseTasty = (document: Document): ParsedRecipe | undefined => {
  const root = document.querySelector('.tasty-recipes') ?? document.querySelector('.tasty-recipes-entry-content');
  if (!root) return undefined;
  const ingredients = [...root.querySelectorAll('.tasty-recipes-ingredients li')]
    .filter((node) => !node.classList.contains('tasty-recipes-ingredients-header'))
    .map((node) => textContent(node))
    .filter(Boolean)
    .map(ingredientFromLine);
  const steps = [...root.querySelectorAll('.tasty-recipe-instructions li, .tasty-recipes-instructions li')]
    .map((node) => textContent(node)).filter(Boolean);
  if (!ingredients.length || !steps.length) return undefined;
  const title = firstText(root, ['.tasty-recipes-title', 'h2', 'h3']);
  if (!title) return undefined;
  const prep = parseNumber(firstText(root, ['.tasty-recipes-prep-time']));
  const cook = parseNumber(firstText(root, ['.tasty-recipes-cook-time']));
  return {
    title,
    description: firstText(root, ['.tasty-recipes-description']),
    minutes: (prep ?? 0) + (cook ?? 0) || 30,
    servings: servingsFromText(firstText(root, ['.tasty-recipes-yield'])) ?? 2,
    category: 'Dinner',
    tags: [],
    ingredients,
    steps,
  };
};

const parseDocument = (html: string, format: ImportFormat) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const parsed = format === 'wprm' ? parseWprm(document) ?? parseJsonLd(document)
    : format === 'tasty' ? parseTasty(document) ?? parseJsonLd(document)
      : parseJsonLd(document);
  if (!parsed) throw new RecipeImportError('parse', 'The page did not contain a readable recipe.');
  return toDraft(parsed);
};

const fetchWithTimeout = async (url: string, init: RequestInit) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), IMPORT_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

const fetchText = async (url: string) => {
  let response: Response;
  try {
    response = await fetchWithTimeout(url, { headers: { Accept: 'text/html, application/json' } });
  } catch {
    throw new RecipeImportError('network', 'The recipe page could not be reached.');
  }
  if (!response.ok) throw new RecipeImportError(response.status === 404 ? 'not-found' : 'network', `Recipe page returned HTTP ${response.status}.`);
  return response.text();
};

const fetchJson = async (url: string): Promise<WordPressEntry[]> => {
  let response: Response;
  try {
    response = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
  } catch {
    throw new RecipeImportError('network', 'The recipe website could not be reached.');
  }
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new RecipeImportError('network', `The recipe website returned HTTP ${response.status}.`);
  }
  try {
    const value: unknown = await response.json();
    return Array.isArray(value) ? value as WordPressEntry[] : [];
  } catch {
    throw new RecipeImportError('parse', 'The recipe website returned unreadable data.');
  }
};

const pageSlug = (url: URL) => url.pathname.split('/').filter(Boolean).pop() ?? '';

const wordpressEntry = async (url: URL) => {
  const slug = pageSlug(url);
  if (!slug) throw new RecipeImportError('invalid-url', 'Add a link to a specific recipe page.');
  const api = new URL('/wp-json/wp/v2/posts', url.origin);
  api.searchParams.set('slug', slug);
  api.searchParams.set('_fields', 'id,link,slug,title,content');
  const posts = await fetchJson(api.toString());
  if (posts[0]?.content?.rendered) return posts[0];

  for (const postType of ['wprm_recipe', 'recipe']) {
    const recipeApi = new URL(`/wp-json/wp/v2/${postType}`, url.origin);
    recipeApi.searchParams.set('slug', slug);
    recipeApi.searchParams.set('_fields', 'id,link,slug,title,content');
    const entries = await fetchJson(recipeApi.toString());
    if (entries[0]?.content?.rendered) return entries[0];
  }

  const searchApi = new URL('/wp-json/wp/v2/wprm_recipe', url.origin);
  searchApi.searchParams.set('search', slug.replace(/-/g, ' '));
  searchApi.searchParams.set('per_page', '10');
  searchApi.searchParams.set('_fields', 'id,link,slug,title,content');
  const searched = await fetchJson(searchApi.toString());
  if (searched[0]?.content?.rendered) return searched[0];
  throw new RecipeImportError('not-found', 'That recipe could not be found through the website API.');
};

export const importRecipeFromUrl = async (value: string): Promise<RecipeDraft> => {
  const url = recipeUrl(value);
  const source = sourceForHostname(url.hostname);
  if (!source) throw new RecipeImportError('unsupported-source', 'This recipe website is not supported yet.');
  if (source.format === 'jsonld') return { ...parseDocument(await fetchText(url.toString()), source.format), sourceUrl: url.toString(), sourceName: source.label };
  try {
    const entry = await wordpressEntry(url);
    try {
      return { ...parseDocument(entry.content?.rendered ?? '', source.format), sourceUrl: url.toString(), sourceName: source.label };
    } catch (error) {
      if (!(error instanceof RecipeImportError) || error.code !== 'parse') throw error;
    }
  } catch (error) {
    if (!(error instanceof RecipeImportError)) throw error;
  }

  // Some WordPress sites expose a recipe post type without returning the
  // recipe card through the post API. Their page markup still carries JSON-LD
  // or the same WPRM card, so use it as a fallback.
  return { ...parseDocument(await fetchText(url.toString()), source.format), sourceUrl: url.toString(), sourceName: source.label };
};
