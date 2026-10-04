import type { CountKind, PantryCategory, Unit } from './types';

export type IngredientCatalogEntry = {
  key: string;
  canonicalName: string;
  labelLt: string;
  aliases: readonly string[];
  category: PantryCategory;
  defaultUnit: Unit;
  defaultCountKind?: CountKind;
};

const entry = (
  key: string,
  canonicalName: string,
  labelLt: string,
  category: PantryCategory,
  defaultUnit: Unit,
  aliases: readonly string[] = [],
  defaultCountKind?: CountKind,
): IngredientCatalogEntry => ({ key, canonicalName, labelLt, category, defaultUnit, aliases, defaultCountKind });

/**
 * Canonical ingredient names are the shared vocabulary for recipes, pantry
 * items, and shopping items. Keep source spellings in `aliases`, not in the
 * stored recipe or inventory name.
 */
export const INGREDIENT_CATALOG: readonly IngredientCatalogEntry[] = [
  entry('spaghetti', 'Spaghetti', 'Spagečiai', 'Dry goods', 'g', ['spaghettis']),
  entry('pasta', 'Pasta', 'Makaronai', 'Dry goods', 'g', ['macaroni', 'noodles', 'egg noodles', 'fusilli pasta']),
  entry('risoni', 'Risoni', 'Risoni', 'Dry goods', 'g', ['orzo', 'risoni/orzo']),
  entry('courgette', 'Courgette', 'Cukinija', 'Produce', 'pcs', ['zucchini', 'zucchinis']),
  entry('garlic', 'Garlic', 'Česnakas', 'Produce', 'pcs', ['garlic clove', 'garlic cloves', 'clove of garlic', 'cloves of garlic', 'cloves garlic', 'garlic bulb'], 'clove'),
  entry('lemon', 'Lemon', 'Citrina', 'Produce', 'pcs', ['lemons'], 'whole'),
  entry('lemon-juice', 'Lemon juice', 'Citrinų sultys', 'Produce', 'ml', ['fresh lemon juice', 'juice of lemon']),
  entry('lemon-zest', 'Lemon zest', 'Citrinos žievelė', 'Produce', 'g', ['lemon rind', 'zest of lemon']),
  entry('lime', 'Lime', 'Laimas', 'Produce', 'pcs', ['limes'], 'whole'),
  entry('lime-juice', 'Lime juice', 'Laimų sultys', 'Produce', 'ml', ['fresh lime juice', 'juice of lime']),
  entry('yellow-onion', 'Yellow onion', 'Svogūnas', 'Produce', 'pcs', ['onion', 'onions', 'yellow onions', 'brown onion', 'brown onions', 'white onion', 'white onions', 'yellow or white onion'], 'whole'),
  entry('red-onion', 'Red onion', 'Raudonasis svogūnas', 'Produce', 'pcs', ['red onions']),
  entry('shallot', 'Shallot', 'Valgomasis svogūnėlis', 'Produce', 'pcs', ['shallots', 'eschalot']),
  entry('carrot', 'Carrot', 'Morka', 'Produce', 'pcs', ['carrots'], 'whole'),
  entry('celery', 'Celery', 'Salieras', 'Produce', 'pcs', ['celery stalk', 'celery stalks', 'celery stick', 'celery sticks']),
  entry('cucumber', 'Cucumber', 'Agurkas', 'Produce', 'pcs', ['cucumbers', 'persian cucumber', 'persian cucumbers']),
  entry('tomato', 'Tomato', 'Pomidoras', 'Produce', 'pcs', ['tomatoes', 'fresh tomatoes', 'cherry tomato', 'cherry tomatoes'], 'whole'),
  entry('chopped-tomatoes', 'Chopped tomatoes', 'Smulkinti pomidorai', 'Dry goods', 'g', ['canned tomatoes', 'tinned tomatoes', 'chopped tomato', 'diced tomatoes', 'crushed tomatoes']),
  entry('plum-tomatoes', 'Plum tomatoes', 'Slyviniai pomidorai', 'Dry goods', 'g', ['plum tomato', 'canned plum tomatoes', 'tinned plum tomatoes']),
  entry('tomato-paste', 'Tomato paste', 'Pomidorų pasta', 'Dry goods', 'g', ['tomato puree', 'tomato purée', 'tomato concentrate']),
  entry('potato', 'Potato', 'Bulvė', 'Produce', 'pcs', ['potatoes']),
  entry('baby-potatoes', 'Baby potatoes', 'Mažos bulvės', 'Produce', 'g', ['baby potato', 'new potatoes', 'new potato']),
  entry('broccoli', 'Broccoli', 'Brokolis', 'Produce', 'g', ['broccoli florets']),
  entry('cauliflower', 'Cauliflower', 'Žiedinis kopūstas', 'Produce', 'g', ['cauliflower florets']),
  entry('spinach', 'Spinach', 'Špinatai', 'Produce', 'g', ['baby spinach', 'fresh spinach']),
  entry('kale', 'Kale', 'Lapinis kopūstas', 'Produce', 'g', ['collard greens', 'collard green', 'kale pieces']),
  entry('mushroom', 'Mushrooms', 'Grybai', 'Produce', 'g', ['mushroom', 'button mushrooms', 'chestnut mushrooms']),
  entry('bell-pepper', 'Bell pepper', 'Paprika', 'Produce', 'pcs', ['bell peppers', 'capsicum', 'red bell pepper', 'green bell pepper', 'yellow bell pepper']),
  entry('green-beans', 'Green beans', 'Šparaginės pupelės', 'Produce', 'g', ['green bean', 'fine beans']),
  entry('peas', 'Peas', 'Žirneliai', 'Produce', 'g', ['pea', 'frozen peas']),
  entry('avocado', 'Avocado', 'Avokadas', 'Produce', 'pcs', ['avocados']),
  entry('apple', 'Apple', 'Obuolys', 'Produce', 'pcs', ['apples']),
  entry('banana', 'Bananas', 'Bananai', 'Produce', 'pcs', ['banana']),
  entry('parsley', 'Parsley', 'Petražolės', 'Produce', 'g', ['fresh parsley', 'parsley leaves']),
  entry('basil', 'Basil', 'Bazilikas', 'Produce', 'g', ['fresh basil', 'basil leaves']),
  entry('coriander', 'Coriander', 'Kalendra', 'Produce', 'g', ['cilantro', 'fresh coriander', 'coriander leaves']),
  entry('mint', 'Mint', 'Mėta', 'Produce', 'g', ['fresh mint', 'mint leaves']),
  entry('thyme', 'Thyme', 'Čiobreliai', 'Seasoning', 'g', ['fresh thyme', 'thyme leaves']),
  entry('rosemary', 'Rosemary', 'Rozmarinas', 'Seasoning', 'g', ['fresh rosemary', 'rosemary leaves']),
  entry('chickpeas', 'Chickpeas', 'Avinžirniai', 'Protein', 'g', ['chickpea', 'garbanzo beans', 'garbanzo bean']),
  entry('red-lentils', 'Red lentils', 'Raudonieji lęšiai', 'Dry goods', 'g', ['red lentil']),
  entry('lentils', 'Lentils', 'Lęšiai', 'Dry goods', 'g', ['lentil', 'green lentils', 'brown lentils', 'brown or green lentils']),
  entry('beans', 'Beans', 'Pupos', 'Protein', 'g', ['bean', 'cooked beans', 'mixed beans']),
  entry('kidney-beans', 'Kidney beans', 'Raudonosios pupelės', 'Protein', 'g', ['kidney bean']),
  entry('rice', 'Rice', 'Ryžiai', 'Dry goods', 'g', ['basmati rice', 'long grain rice', 'brown rice', 'jasmine rice']),
  entry('quinoa', 'Quinoa', 'Kynva', 'Dry goods', 'g', ['quinoa']),
  entry('couscous', 'Couscous', 'Kuskusas', 'Dry goods', 'g', ['cous cous']),
  entry('flour', 'Flour', 'Miltai', 'Dry goods', 'g', ['plain flour', 'all-purpose flour', 'self-raising flour']),
  entry('breadcrumbs', 'Breadcrumbs', 'Džiūvėsėliai', 'Dry goods', 'g', ['bread crumbs', 'panko breadcrumbs', 'panko']),
  entry('oats', 'Oats', 'Avižos', 'Dry goods', 'g', ['rolled oats', 'oat flakes']),
  entry('bread', 'Bread', 'Duona', 'Dry goods', 'g', ['sliced bread']),
  entry('flatbread', 'Flatbread', 'Paplotėliai', 'Dry goods', 'pcs', ['flatbreads', 'wrap', 'wraps', 'tortilla', 'tortillas', 'pita', 'pitas']),
  entry('water', 'Water', 'Vanduo', 'Other', 'ml', ['water']),
  entry('vegetable-stock', 'Vegetable stock', 'Daržovių sultinys', 'Other', 'ml', ['vegetable broth']),
  entry('chicken-stock', 'Chicken stock', 'Vištienos sultinys', 'Other', 'ml', ['chicken broth']),
  entry('beef-stock', 'Beef stock', 'Jautienos sultinys', 'Other', 'ml', ['beef broth']),
  entry('stock', 'Stock', 'Sultinys', 'Other', 'ml', ['broth']),
  entry('coconut-milk', 'Coconut milk', 'Kokosų pienas', 'Other', 'ml', ['coconut cream']),
  entry('cooking-cream', 'Cooking cream', 'Grietinėlė', 'Dairy', 'ml', ['cream', 'heavy cream', 'double cream', 'single cream', 'whipping cream', 'thickened cream', 'thickened / heavy cream']),
  entry('milk', 'Milk', 'Pienas', 'Dairy', 'ml', ['whole milk', 'semi-skimmed milk', 'skimmed milk']),
  entry('butter', 'Butter', 'Sviestas', 'Dairy', 'g', ['unsalted butter', 'salted butter']),
  entry('parmesan', 'Parmesan', 'Parmezanas', 'Dairy', 'g', ['parmesan cheese', 'parmigiano']),
  entry('mozzarella', 'Mozzarella', 'Mocarela', 'Dairy', 'g', ['mozzarella cheese']),
  entry('feta', 'Feta', 'Feta', 'Dairy', 'g', ['feta cheese']),
  entry('cheese', 'Cheese', 'Sūris', 'Dairy', 'g', ['cheddar', 'grated cheese', 'shredded cheese']),
  entry('greek-yoghurt', 'Greek yoghurt', 'Graikiškas jogurtas', 'Dairy', 'g', ['greek yogurt', 'greek yoghurt']),
  entry('yoghurt', 'Yoghurt', 'Jogurtas', 'Dairy', 'g', ['yogurt', 'natural yoghurt', 'natural yogurt', 'plain yoghurt', 'plain yogurt']),
  entry('sour-cream', 'Sour cream', 'Grietinė', 'Dairy', 'g', ['soured cream']),
  entry('egg', 'Eggs', 'Kiaušiniai', 'Protein', 'pcs', ['egg'], 'egg'),
  entry('chicken', 'Chicken', 'Vištiena', 'Protein', 'g', ['chicken pieces', 'chicken meat']),
  entry('chicken-breast', 'Chicken breast', 'Vištienos krūtinėlė', 'Protein', 'g', ['chicken breasts', 'skinless chicken breast']),
  entry('chicken-thigh', 'Chicken thighs', 'Vištienos šlaunelės', 'Protein', 'g', ['chicken thigh', 'boneless chicken thighs']),
  entry('beef', 'Beef', 'Jautiena', 'Protein', 'g', ['beef steak', 'steak']),
  entry('minced-beef', 'Minced beef', 'Malta jautiena', 'Protein', 'g', ['ground beef', 'beef mince']),
  entry('pork', 'Pork', 'Kiauliena', 'Protein', 'g', ['pork loin', 'pork chops']),
  entry('bacon', 'Bacon', 'Šoninė', 'Protein', 'g', ['streaky bacon', 'smoked streaky bacon', 'smoked bacon', 'back bacon']),
  entry('salami', 'Salami', 'Saliamis', 'Protein', 'g', ['salami stick']),
  entry('salmon-fillets', 'Salmon fillets', 'Lašišos filė', 'Protein', 'g', ['salmon', 'salmon fillet', 'salmon fillets']),
  entry('white-fish', 'White fish', 'Baltoji žuvis', 'Protein', 'g', ['white fish fillet', 'cod', 'haddock']),
  entry('shrimp', 'Shrimp', 'Krevetės', 'Protein', 'g', ['prawns', 'prawn', 'shrimp']),
  entry('tuna', 'Tuna', 'Tunas', 'Protein', 'g', ['tinned tuna', 'canned tuna']),
  entry('olive-oil', 'Olive oil', 'Alyvuogių aliejus', 'Seasoning', 'ml', ['extra virgin olive oil', 'extra-virgin olive oil']),
  entry('vegetable-oil', 'Vegetable oil', 'Augalinis aliejus', 'Seasoning', 'ml', ['neutral oil', 'sunflower oil', 'rapeseed oil', 'canola oil', 'cooking oil']),
  entry('sesame-oil', 'Sesame oil', 'Sezamų aliejus', 'Seasoning', 'ml', ['toasted sesame oil']),
  entry('vinegar', 'Vinegar', 'Actas', 'Seasoning', 'ml', ['white vinegar', 'wine vinegar']),
  entry('balsamic-vinegar', 'Balsamic vinegar', 'Balzaminis actas', 'Seasoning', 'ml', ['balsamic']),
  entry('soy-sauce', 'Soy sauce', 'Sojų padažas', 'Seasoning', 'ml', ['light soy sauce', 'dark soy sauce']),
  entry('dijon-mustard', 'Dijon mustard', 'Dižono garstyčios', 'Seasoning', 'g', ['dijon']),
  entry('rice-vinegar', 'Rice vinegar', 'Ryžių actas', 'Seasoning', 'ml', ['rice wine vinegar']),
  entry('white-wine', 'White wine', 'Baltasis vynas', 'Seasoning', 'ml', ['dry white wine', 'chardonnay', 'chardonnay or other dry white wine']),
  entry('red-wine', 'Red wine', 'Raudonasis vynas', 'Seasoning', 'ml', ['dry red wine']),
  entry('miso-paste', 'Miso paste', 'Miso pasta', 'Seasoning', 'g', ['miso']),
  entry('honey', 'Honey', 'Medus', 'Seasoning', 'g', ['runny honey']),
  entry('sugar', 'Sugar', 'Cukrus', 'Seasoning', 'g', ['caster sugar', 'granulated sugar', 'brown sugar', 'white sugar']),
  entry('salt', 'Salt', 'Druska', 'Seasoning', 'g', ['sea salt', 'table salt', 'kosher salt', 'cooking salt', 'cooking salt / kosher salt']),
  entry('black-pepper', 'Black pepper', 'Juodieji pipirai', 'Seasoning', 'g', ['pepper', 'ground black pepper', 'peppercorns', 'ground pepper']),
  entry('paprika', 'Paprika', 'Paprika', 'Seasoning', 'g', ['sweet paprika', 'paprika powder']),
  entry('smoked-paprika', 'Smoked paprika', 'Rūkyta paprika', 'Seasoning', 'g', ['smoked paprika powder']),
  entry('ground-cumin', 'Ground cumin', 'Maltas kuminas', 'Seasoning', 'g', ['cumin', 'cumin powder']),
  entry('ginger', 'Ginger', 'Imbieras', 'Produce', 'g', ['fresh ginger', 'ground ginger']),
  entry('oregano', 'Oregano', 'Raudonėlis', 'Seasoning', 'g', ['dried oregano']),
  entry('cinnamon', 'Cinnamon', 'Cinamonas', 'Seasoning', 'g', ['ground cinnamon']),
  entry('curry-powder', 'Curry powder', 'Kario prieskoniai', 'Seasoning', 'g', ['curry spice']),
  entry('chilli-flakes', 'Chilli flakes', 'Čili dribsniai', 'Seasoning', 'g', ['chili flakes', 'red pepper flakes']),
  entry('red-chilli', 'Red chilli', 'Čili pipiras', 'Produce', 'pcs', ['red chili', 'red chillies', 'red chilis', 'chilli', 'chili'], 'whole'),
  entry('sesame-seeds', 'Sesame seeds', 'Sezamo sėklos', 'Other', 'g', ['sesame seed']),
  entry('green-onion', 'Green onion', 'Žaliasis svogūnas', 'Produce', 'pcs', ['green onions', 'spring onion', 'spring onions', 'scallion', 'scallions'], 'whole'),
  entry('pine-nuts', 'Pine nuts', 'Kedro riešutai', 'Other', 'g', ['pine nut']),
  entry('cornstarch', 'Cornstarch', 'Kukurūzų krakmolas', 'Dry goods', 'g', ['corn starch', 'cornflour']),
  entry('tahini', 'Tahini', 'Tahini', 'Seasoning', 'g', ['tahini paste']),
  entry('kombu', 'Kombu', 'Kombu dumbliai', 'Other', 'pcs', [], 'strip'),
  entry('baking-soda', 'Baking soda', 'Kepimo soda', 'Dry goods', 'g', ['bicarbonate of soda', 'bicarbonate soda']),
  entry('garlic-powder', 'Garlic powder', 'Česnakų granulės', 'Seasoning', 'g', ['granulated garlic']),
  entry('bay-leaves', 'Bay leaves', 'Lauro lapai', 'Seasoning', 'pcs', ['bay leaf'], 'leaf'),
  entry('herbes-de-provence', 'Herbes de Provence', 'Provanso žolelės', 'Seasoning', 'g', ['herb de provence']),
  entry('italian-seasoning', 'Italian seasoning', 'Itališki prieskoniai', 'Seasoning', 'g', ['dried italian seasoning']),
  entry('mango-chutney', 'Mango chutney', 'Mangų pagardas', 'Seasoning', 'g', ['mango chutney']),
  entry('coffee-beans', 'Coffee beans', 'Kavos pupelės', 'Other', 'g', ['coffee bean', 'ground coffee']),
  entry('almonds', 'Almonds', 'Migdolai', 'Other', 'g', ['almond', 'flaked almonds']),
  entry('walnuts', 'Walnuts', 'Graikiniai riešutai', 'Other', 'g', ['walnut']),
] as const;

const fold = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const singularVariant = (value: string) => {
  if (value.endsWith('ies')) return `${value.slice(0, -3)}y`;
  if (value.endsWith('s') && !value.endsWith('ss')) return value.slice(0, -1);
  return value;
};

const aliasIndex = new Map<string, IngredientCatalogEntry>();
INGREDIENT_CATALOG.forEach((item) => {
  [item.key.replace(/-/g, ' '), item.canonicalName, item.labelLt, ...item.aliases].forEach((alias) => {
    const normalized = fold(alias);
    aliasIndex.set(normalized, item);
    aliasIndex.set(singularVariant(normalized), item);
  });
});

export const normalizeIngredientLookup = (value: string) => fold(value);

export const findIngredientCatalogEntry = (value: string) => {
  const normalized = fold(value);
  return aliasIndex.get(normalized) ?? aliasIndex.get(singularVariant(normalized));
};

export const canonicalIngredientKey = (value: string) => findIngredientCatalogEntry(value)?.key;

export const canonicalIngredientName = (value: string) => findIngredientCatalogEntry(value)?.canonicalName;

export const canonicalIngredientLabelLt = (value: string) => findIngredientCatalogEntry(value)?.labelLt;
