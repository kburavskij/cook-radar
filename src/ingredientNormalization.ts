import type { CountKind, Ingredient, PantryCategory, Unit } from './types';
import { findIngredientCatalogEntry, normalizeIngredientLookup } from './ingredientCatalog';

export type RawIngredientParts = {
  amountText?: string;
  unitText?: string;
  nameText: string;
  optional?: boolean;
};

type MeasureDefinition = {
  unit: Unit;
  factor: number;
  aliases: readonly string[];
  quantityKnown?: boolean;
  countKind?: CountKind;
};

type ParsedMeasure = MeasureDefinition & { alias: string };

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

const measureDefinitions: readonly MeasureDefinition[] = [
  { unit: 'ml', factor: 1, aliases: ['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters'] },
  { unit: 'g', factor: 1, aliases: ['g', 'gram', 'grams', 'gramme', 'grammes'] },
  { unit: 'g', factor: 1000, aliases: ['kg', 'kgs', 'kilogram', 'kilograms'] },
  { unit: 'ml', factor: 1000, aliases: ['l', 'litre', 'litres', 'liter', 'liters'] },
  { unit: 'tbsp', factor: 1, aliases: ['tbsp', 'tbs', 'tablespoon', 'tablespoons'] },
  { unit: 'tsp', factor: 1, aliases: ['tsp', 'teaspoon', 'teaspoons'] },
  // A US cooking cup is commonly rounded to 240 ml in recipe cards. Pages
  // that publish an explicit metric value are parsed before this fallback.
  { unit: 'ml', factor: 240, aliases: ['cup', 'cups'] },
  { unit: 'ml', factor: 29.5735, aliases: ['fl oz', 'fluid oz', 'fluid ounce', 'fluid ounces'] },
  { unit: 'ml', factor: 473.176, aliases: ['pint', 'pints'] },
  { unit: 'ml', factor: 946.353, aliases: ['quart', 'quarts'] },
  { unit: 'ml', factor: 3785.41, aliases: ['gallon', 'gallons'] },
  { unit: 'g', factor: 28.3495, aliases: ['oz', 'ounce', 'ounces'] },
  { unit: 'g', factor: 453.592, aliases: ['lb', 'lbs', 'pound', 'pounds'] },
  { unit: 'pcs', factor: 1, countKind: 'clove', aliases: ['clove', 'cloves'] },
  { unit: 'pcs', factor: 1, countKind: 'piece', aliases: ['piece', 'pieces', 'pc', 'pcs', 'unit', 'units'] },
  { unit: 'pcs', factor: 1, countKind: 'can', aliases: ['can', 'cans', 'tin', 'tins'] },
  { unit: 'pcs', factor: 1, countKind: 'jar', aliases: ['jar', 'jars'] },
  { unit: 'pcs', factor: 1, countKind: 'bottle', aliases: ['bottle', 'bottles'] },
  { unit: 'pcs', factor: 1, countKind: 'packet', aliases: ['packet', 'packets'] },
  { unit: 'pcs', factor: 1, countKind: 'bag', aliases: ['bag', 'bags'] },
  { unit: 'pcs', factor: 1, countKind: 'box', aliases: ['box', 'boxes'] },
  { unit: 'pcs', factor: 1, countKind: 'bunch', aliases: ['bunch', 'bunches'] },
  { unit: 'pcs', factor: 1, countKind: 'head', aliases: ['head', 'heads'] },
  { unit: 'pcs', factor: 1, countKind: 'stalk', aliases: ['stalk', 'stalks'] },
  { unit: 'pcs', factor: 1, countKind: 'sprig', aliases: ['sprig', 'sprigs'] },
  { unit: 'pcs', factor: 1, countKind: 'slice', aliases: ['slice', 'slices', 'rasher', 'rashers'] },
  { unit: 'pcs', factor: 1, countKind: 'fillet', aliases: ['fillet', 'fillets'] },
  { unit: 'pcs', factor: 1, countKind: 'breast', aliases: ['breast', 'breasts'] },
  { unit: 'pcs', factor: 1, countKind: 'thigh', aliases: ['thigh', 'thighs'] },
  { unit: 'pcs', factor: 1, countKind: 'leaf', aliases: ['leaf', 'leaves'] },
  { unit: 'pcs', factor: 1, countKind: 'strip', aliases: ['strip', 'strips'] },
  { unit: 'pcs', factor: 1, quantityKnown: false, countKind: 'unknown', aliases: ['pinch', 'pinches', 'dash', 'handful', 'handfuls'] },
];

const measureAliases = [...new Set(measureDefinitions.flatMap((definition) => definition.aliases))]
  .sort((left, right) => right.length - left.length);

const quantityAtom = '(?:\\d+\\s+\\d+\\s*\\/\\s*\\d+|\\d+\\s*\\/\\s*\\d+|\\d+(?:[.,]\\d+)?|[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])';
const quantityPattern = `(?:${quantityAtom}(?:\\s*(?:[-–]|to)\\s*${quantityAtom})?)`;
const measurePattern = measureAliases.map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

const roundQuantity = (value: number) => Math.round(value * 100) / 100;

const normalizeFractionText = (value: string) => {
  let normalized = value.replace(/\u00a0/g, ' ');
  Object.entries(fractionCharacters).forEach(([character, replacement]) => { normalized = normalized.replaceAll(character, replacement); });
  return normalized.replace(/\s+/g, ' ').trim();
};

export const parseNumber = (value: string) => {
  let normalized = normalizeFractionText(value);
  normalized = normalized.replace(/,/g, '.');

  const mixed = normalized.match(/(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = normalized.match(/(\d+)\s*\/\s*(\d+)/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const decimal = normalized.match(/(?:\d+(?:\.\d+)?|\.\d+)/);
  return decimal ? Number(decimal[0]) : undefined;
};

const parseQuantityRange = (value: string) => {
  const normalized = normalizeFractionText(value).replace(/,/g, '.');
  const match = normalized.match(new RegExp(`^(${quantityAtom})\\s*(?:[-–]|to)\\s*(${quantityAtom})$`, 'iu'));
  if (!match) {
    const amount = parseNumber(normalized);
    return amount === undefined ? undefined : { amount, amountMax: undefined };
  }
  const amount = parseNumber(match[1]);
  const amountMax = parseNumber(match[2]);
  if (amount === undefined || amountMax === undefined) return undefined;
  return { amount: Math.min(amount, amountMax), amountMax: Math.max(amount, amountMax) };
};

const findMeasure = (value: string): ParsedMeasure | undefined => {
  const normalized = value.toLowerCase().replace(/\u00a0/g, ' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  let matchResult: { measure: ParsedMeasure; index: number } | undefined;

  for (const definition of measureDefinitions) {
    for (const alias of definition.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = new RegExp(`(?:^|\\s|\\d)${escaped}(?=\\s|$|[/.,)])`, 'i').exec(normalized);
      if (match) {
        const index = match.index + (match[0].length - alias.length);
        if (!matchResult || index < matchResult.index) matchResult = { measure: { ...definition, alias }, index };
      }
    }
  }
  return matchResult?.measure;
};

const findCountMeasure = (value: string): ParsedMeasure | undefined => {
  const normalized = value.toLowerCase().replace(/\u00a0/g, ' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  let matchResult: { measure: ParsedMeasure; index: number } | undefined;
  for (const definition of measureDefinitions.filter((item) => item.countKind)) {
    for (const alias of definition.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = new RegExp(`(?:^|\\s|\\d)${escaped}(?=\\s|$|[/.,)])`, 'i').exec(normalized);
      if (match) {
        const index = match.index + (match[0].length - alias.length);
        if (!matchResult || index < matchResult.index) matchResult = { measure: { ...definition, alias }, index };
      }
    }
  }
  return matchResult?.measure;
};

const hasContainer = (value: string) => /\b(can|cans|tin|tins|jar|jars|bottle|bottles|packet|packets|bag|bags|box|boxes)\b/i.test(value);

const embeddedMeasure = (value: string) => {
  const expression = value.replace(/\u00a0/g, ' ');
  if (!/\bx\b|\b(can|cans|tin|tins|jar|jars|bottle|bottles|packet|packets|bag|bags|box|boxes)\b/i.test(expression)) return undefined;
  const match = new RegExp(`${quantityPattern}\\s*(?:-|\\s)?(${measurePattern})(?=\\s|$|[/.,)])`, 'iu').exec(expression);
  if (!match) return undefined;
  const measure = findMeasure(match[1]);
  const amount = parseNumber(match[0].replace(match[1], ''));
  if (!measure || amount === undefined) return undefined;
  return { amount: roundQuantity(amount * measure.factor), unit: measure.unit, alias: measure.alias, countKind: measure.countKind };
};

const cleanIngredientText = (value: string) => value
  .replace(/^[-•*]\s*/, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*,\s*$/, '')
  .trim();

const stripLeadingMeasure = (value: string) => {
  let result = cleanIngredientText(value)
    .replace(new RegExp(`^\\s*${quantityPattern}\\s*x\\s*${quantityPattern}\\s*(?:-|\\s)?(?:${measurePattern})\\s*(?:cans?|tins?|jars?|bottles?|packets?|bags?|boxes?)\\s*`, 'iu'), '')
    .replace(new RegExp(`^\\s*x\\s*${quantityPattern}\\s*(?:-|\\s)?(?:${measurePattern})\\s*(?:cans?|tins?|jars?|bottles?|packets?|bags?|boxes?)\\s*`, 'iu'), '')
    .replace(new RegExp(`^\\s*${quantityPattern}\\s*(?:-|\\s)?(?:${measurePattern})\\s*`, 'iu'), '')
    .replace(new RegExp(`^\\s*(?:${measurePattern})(?=\\s|$|[/.,)])\\s*`, 'iu'), '')
    .replace(/^\s*x\s+/i, '')
    .replace(new RegExp(`^\\s*${quantityPattern}\\s*(?:-|\\s)?(?:${measurePattern})\\s*(?:cans?|tins?|jars?|bottles?|packets?|bags?|boxes?)\\s*`, 'iu'), '')
    .replace(new RegExp(`^\\s*${quantityPattern}\\s*(?:-|\\s)?(?:${measurePattern})\\s*`, 'iu'), '')
    .replace(/^\s*(?:(?:large|small|medium|extra-large|extra large)\s+)?(?:cans?|tins?|jars?|bottles?|packets?|bags?|boxes?)(?:\s*\([^)]*\))?\s+/i, '')
    .replace(/^\s*(?:of|and)\s+/i, '');

  const alternateMeasure = new RegExp(`^\\s*(?:/|or)\\s*${quantityPattern}\\s*(?:-|\\s)?(?:${measurePattern})\\s*`, 'iu');
  result = result.replace(alternateMeasure, '');
  return result.trim();
};

const descriptorPattern = /^(?:(?:freshly ground|extra-virgin|free-range|fresh|large|small|medium|extra-large|extra large|ripe|whole|boneless|skinless|seedless|frozen|dried|raw|cooked|uncooked|dry|canned|tinned|toasted|heaping|natural|smoked|streaky)\s*,?\s*)+/i;
const leadingPreparationPattern = /^(?:(?:finely|roughly|thinly|thickly)\s+)?(?:peeled|chopped|diced|sliced|quartered|minced|crushed|grated|shredded|pressed|torn|picked over|trimmed|halved|deseeded)\s+/i;
const trailingPreparationPattern = /\s+(?:(?:(?:(?:finely|roughly|thinly|thickly)\s+)?(?:peeled|chopped|diced|sliced|quartered|minced|crushed|grated|shredded|pressed|torn|picked(?:\s+over)?|trimmed|halved|deseeded|divided|melted|softened|juiced|zested))(?:\s+(?:and|or|then)\s+(?:(?:finely|roughly|thinly|thickly)\s+)?(?:peeled|chopped|diced|sliced|quartered|minced|crushed|grated|shredded|pressed|torn|picked(?:\s+over)?|trimmed|halved|deseeded|divided|melted|softened|juiced|zested))*|(?:each\s+)?cut\s+(?:into|in)\s+.+)\s*$/i;
const trailingQualifierPattern = /\s+(?:to taste|as needed|if using|for garnish|for serving|as required|optional|plus more(?: for [^,]+)?)\s*$/i;

const splitIngredientName = (rawName: string) => {
  let base = stripLeadingMeasure(rawName);
  const notes: string[] = [];

  base = base.replace(/\s*\(([^)]+)\)/g, (_match, note: string) => {
    if (note.trim()) notes.push(note.trim());
    return ' ';
  }).trim();

  const leadingDescriptor = base.match(descriptorPattern);
  if (leadingDescriptor) {
    notes.unshift(leadingDescriptor[0].replace(/[,\s]+$/g, '').trim());
    base = base.slice(leadingDescriptor[0].length).trim();
  }

  const commaParts = base.split(/\s*,\s*/).map((part) => part.trim()).filter(Boolean);
  base = commaParts.shift() ?? '';
  notes.push(...commaParts);

  const trailingQualifier = base.match(trailingQualifierPattern);
  if (trailingQualifier) {
    notes.push(trailingQualifier[0].trim());
    base = base.slice(0, trailingQualifier.index).trim();
  }

  const trailingPreparation = base.match(trailingPreparationPattern);
  if (trailingPreparation) {
    notes.push(trailingPreparation[0].trim());
    base = base.slice(0, trailingPreparation.index).trim();
  }

  const leadingPreparation = base.match(leadingPreparationPattern);
  if (leadingPreparation && !findIngredientCatalogEntry(base)) {
    notes.unshift(leadingPreparation[0].trim());
    base = base.slice(leadingPreparation[0].length).trim();
  }

  return { base: cleanIngredientText(base), note: notes.join(', ') || undefined };
};

const guessCategory = (name: string): PantryCategory => {
  const normalized = normalizeIngredientLookup(name);
  if (/milk|cream|cheese|parmesan|mozzarella|yogurt|yoghurt|butter|sour cream|feta|ricotta/.test(normalized)) return 'Dairy';
  if (/chicken|turkey|beef|pork|lamb|steak|salmon|tuna|fish|shrimp|prawn|meat|egg/.test(normalized)) return 'Protein';
  if (/flour|rice|pasta|spaghetti|noodle|bread|oat|lentil|bean|chickpea|couscous|quinoa|tortilla|wrap|stock|broth|tomato paste|canned/.test(normalized)) return 'Dry goods';
  if (/salt|pepper|paprika|cumin|cinnamon|oregano|basil|thyme|rosemary|spice|oil|vinegar|soy sauce|sauce|honey|sugar/.test(normalized)) return 'Seasoning';
  if (/apple|avocado|banana|berry|broccoli|carrot|celery|cucumber|garlic|ginger|herb|kale|lemon|lime|mushroom|onion|parsley|potato|spinach|tomato|vegetable|zucchini|courgette|pepper/.test(normalized)) return 'Produce';
  return 'Other';
};

const lineAmountPattern = new RegExp(`^(${quantityPattern})(?:\\s+|(?=[a-z])|$)(.*)$`, 'iu');
const prefixUnitPattern = new RegExp(`^(${measureAliases.map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?:\\s+|$)(.*)$`, 'iu');

export const normalizeIngredientParts = ({ amountText = '', unitText = '', nameText, optional = false }: RawIngredientParts): Ingredient => {
  const inlineText = normalizeFractionText(nameText);
  if (!amountText.trim() && !unitText.trim() && lineAmountPattern.test(inlineText)) return normalizeIngredientLine(inlineText);

  const nameParts = splitIngredientName(nameText);
  const catalogEntry = findIngredientCatalogEntry(nameParts.base);
  const fullMeasureText = `${unitText} ${nameText}`.trim();
  const directMeasure = findMeasure(unitText) ?? findMeasure(fullMeasureText);
  const countMeasure = findCountMeasure(`${unitText} ${nameParts.base}`);
  const packageMeasure = findCountMeasure(fullMeasureText);
  const embedded = embeddedMeasure(fullMeasureText);
  const parsedQuantity = parseQuantityRange(amountText);
  const baseAmount = parsedQuantity?.amount ?? 1;
  const baseAmountMax = parsedQuantity?.amountMax;
  const useEmbedded = Boolean(embedded && (hasContainer(fullMeasureText) || /\bx\b/i.test(fullMeasureText)));
  const unit = useEmbedded ? embedded!.unit : directMeasure?.unit ?? catalogEntry?.defaultUnit ?? 'pcs';
  const amount = useEmbedded
    ? baseAmount * embedded!.amount
    : directMeasure
      ? baseAmount * directMeasure.factor
      : baseAmount;
  const amountMax = baseAmountMax === undefined ? undefined : roundQuantity(useEmbedded
    ? baseAmountMax * embedded!.amount
    : directMeasure
      ? baseAmountMax * directMeasure.factor
      : baseAmountMax);
  const expression = `${unitText} ${nameText}`;
  const quantityKnown = Boolean(amountText.trim())
    && !/\b(to taste|as needed|if using|for garnish|for serving|as required)\b/i.test(expression)
    && directMeasure?.quantityKnown !== false
    && Boolean(directMeasure || embedded || catalogEntry?.defaultUnit === 'pcs');
  const unitNote = unitText.trim() && !directMeasure?.countKind && !directMeasure?.unit && unitText.trim() !== unit
    ? unitText.trim()
    : embedded && unitText.trim() && /\b(can|tin|jar|bottle|packet|bag|box)\b/i.test(unitText)
      ? unitText.trim()
      : undefined;
  const packageNote = packageMeasure?.countKind && (hasContainer(fullMeasureText) || /\bx\b/i.test(fullMeasureText))
    ? `${baseAmount} ${packageMeasure.alias}`
    : undefined;
  const qualitativeNote = directMeasure?.quantityKnown === false ? directMeasure.alias : undefined;
  const note = [unitNote, qualitativeNote, packageNote, nameParts.note].filter(Boolean).join(', ') || undefined;

  return {
    id: crypto.randomUUID(),
    ingredientKey: catalogEntry?.key,
    name: catalogEntry?.canonicalName ?? (nameParts.base || 'Ingredient'),
    amount: roundQuantity(amount > 0 ? amount : 1),
    amountMax,
    unit,
    category: catalogEntry?.category ?? guessCategory(nameParts.base),
    countKind: directMeasure?.countKind ?? countMeasure?.countKind ?? embedded?.countKind ?? packageMeasure?.countKind ?? catalogEntry?.defaultCountKind,
    optional,
    note,
    quantityKnown,
  };
};

export const normalizeIngredientLine = (line: string): Ingredient => {
  const clean = normalizeFractionText(cleanIngredientText(line));
  const amountMatch = clean.match(lineAmountPattern);
  if (!amountMatch) {
    return normalizeIngredientParts({ nameText: clean, optional: /\b(to taste|as needed|if using|optional)\b/i.test(clean) });
  }

  const amountText = amountMatch[1];
  let rest = amountMatch[2].trim();
  let unitText = '';
  const unitMatch = rest.match(prefixUnitPattern);
  if (unitMatch) {
    unitText = unitMatch[1];
    rest = unitMatch[2];
  }
  const optional = /\b(optional|if using|to taste|as needed)\b/i.test(rest) || /\b(optional|if using|to taste|as needed)\b/i.test(clean);
  return normalizeIngredientParts({ amountText, unitText, nameText: rest, optional });
};

export const normalizeIngredientLines = (line: string): Ingredient[] => {
  const clean = normalizeFractionText(cleanIngredientText(line));
  const grouped = clean.match(new RegExp(`^(${quantityPattern})\\s+(pinch(?:es)?|dash(?:es)?)\\s+each\\s+(.+?)\\s+and\\s+(.+)$`, 'iu'));
  if (!grouped) return [normalizeIngredientLine(clean)];
  const optional = /\b(optional|if using|to taste|as needed)\b/i.test(clean);
  return [grouped[3], grouped[4]].map((nameText) => normalizeIngredientParts({ amountText: grouped[1], unitText: grouped[2], nameText, optional }));
};

export const normalizeIngredientRecord = (ingredient: Ingredient): Ingredient => {
  const nameParts = splitIngredientName(ingredient.name);
  const catalogEntry = findIngredientCatalogEntry(nameParts.base);
  return {
    ...ingredient,
    ingredientKey: catalogEntry?.key ?? ingredient.ingredientKey,
    name: catalogEntry?.canonicalName ?? nameParts.base,
    category: catalogEntry?.category ?? ingredient.category,
    countKind: catalogEntry?.defaultCountKind ?? ingredient.countKind,
    note: ingredient.note ?? nameParts.note,
  };
};
