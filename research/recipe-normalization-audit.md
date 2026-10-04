# Recipe normalization and semantic vocabulary audit

Date: 2026-10-04

Repository: `/home/gwanz/Dev/cook-radar`

Scope: the six recipe sources currently supported by the importer, plus Schema.org, primary measurement, and food-data references. This is a research report only. It does not change the importer or the application data model.

## Source verification and citation notes

The six source pages and the linked first-party responses were checked on 2026-10-04. All six recipe URLs returned a reachable first-party page. The older BBC Good Food path [`/recipes/spaghetti-bolognese`](https://www.bbcgoodfood.com/recipes/spaghetti-bolognese) redirects to the current canonical path [`/recipes/best-spaghetti-bolognese-recipe`](https://www.bbcgoodfood.com/recipes/best-spaghetti-bolognese-recipe); the latter is the citation used below.

The page evidence is adequate to justify the recurring raw patterns in this report, but it is not one stable parser contract:

| Source | First-party machine-readable evidence checked | Normalization-relevant observation |
| --- | --- | --- |
| [RecipeTin Eats](https://www.recipetineats.com/one-pot-chicken-risoni-with-crispy-salami/) | Schema.org `Recipe` JSON-LD, WPRM card, and the [WordPress response](https://www.recipetineats.com/wp-json/wp/v2/posts?slug=one-pot-chicken-risoni-with-crispy-salami&_fields=id,link,slug,title,content) | The card exposes a `Cups`/`Metric` switch and structured WPRM amount, unit, name, and notes elements. |
| [Love & Lemons](https://www.loveandlemons.com/pasta-salad/) | Schema.org `Recipe` JSON-LD, WPRM card, and the [WordPress response](https://www.loveandlemons.com/wp-json/wp/v2/posts?slug=pasta-salad&_fields=id,link,slug,title,content) | JSON-LD and WPRM both contain ingredient text; WPRM separates amount, unit, name, and notes, including a qualifier such as `heaping cups`. |
| [Budget Bytes](https://www.budgetbytes.com/easy-sesame-chicken/) | Schema.org `Recipe` JSON-LD, WPRM card, and the [WordPress response](https://www.budgetbytes.com/wp-json/wp/v2/posts?slug=easy-sesame-chicken&_fields=id,link,slug,title,content) | The card uses U.S.-customary abbreviations, Unicode fractions, count qualifiers, and non-ingredient price notes. |
| [Minimalist Baker](https://minimalistbaker.com/how-to-make-hummus-from-scratch/) | Schema.org `Recipe` JSON-LD and WPRM card | The card exposes `US Customary`/`Metric` controls, plus a separate optional serving group with ingredients that have no amount. |
| [Cookie and Kate](https://cookieandkate.com/best-lentil-soup-recipe/) | Schema.org `Recipe` JSON-LD, Tasty Recipes card, and the [WordPress response](https://cookieandkate.com/wp-json/wp/v2/posts?slug=best-lentil-soup-recipe&_fields=id,link,slug,title,content) | The page contains ranges, package sizes, alternatives, preparation notes, and qualitative amounts. |
| [BBC Good Food: spaghetti bolognese](https://www.bbcgoodfood.com/recipes/best-spaghetti-bolognese-recipe) and [chicken tikka masala](https://www.bbcgoodfood.com/recipes/chicken-tikka-masala) | Schema.org `Recipe` JSON-LD in the page response | The page payload includes the instruction `Please use metric if possible`; the checked ingredient data is predominantly metric and uses `can`/`tin`, packs, and ranges. |

The authoritative [Schema.org `Recipe` definition](https://schema.org/Recipe) says that `recipeIngredient` may be represented as free text or structured values, and the [`recipeIngredient` property](https://schema.org/recipeIngredient) accepts ingredient text such as `1 cup of sugar`. This supports retaining the untouched source line even when a page also exposes structured card markup. It also means that Schema.org alone does not guarantee separate amount, unit, food, and preparation fields. Site-specific card markup is a useful supplementary source, not a replacement for raw-text retention.

The canonical food IDs and English-to-Lithuanian labels later in this report are application vocabulary proposals derived from these examples. They are not claims that the publishers or Schema.org define those semantic equivalences. Any alias that could change the food or variety should remain reviewable.

## Recommendation

The importer needs three separate records for every ingredient line:

1. The untouched source line and source URL.
2. A parsed ingredient with a canonical food ID, amount, source unit, preparation notes, and confidence.
3. An inventory quantity with a compatible base unit and a semantic count or package kind.

Do not use `pcs` as the only representation for countable ingredients. `2 garlic cloves`, `2 onions`, `2 cans of tomatoes`, and `2 chicken fillets` may all currently become `2 pcs`, but they are different inventory items. Store `unit = pcs` only together with a `countKind`, such as `clove`, `whole`, `can`, or `fillet`.

Use SI units for inventory quantities by default:

- Mass: `g` and `kg`, with grams as the comparison base.
- Volume: `ml` and `l`, with millilitres as the comparison base.
- Count: `pcs`, with a required semantic count kind.
- Spoons: retain `tsp` and `tbsp` for recipe display, but also store their millilitre equivalent for inventory comparison.
- `cup`, `oz`, `lb`, `can`, `tin`, `jar`, `bunch`, `clove`, `pinch`, and `dash` are source or semantic units. They should not pass through as generic application units.

Prefer an explicit metric amount from the source over a calculated conversion. Preserve both values when the source gives metric and customary amounts together. When a conversion is necessary, record the source system and whether the result is exact, a recipe convention, or an estimate.

## Repository constraints found during the audit

The current application unit list is:

```text
g, kg, ml, l, pcs, tsp, tbsp
```

The same unit type is used for recipe ingredients, pantry items, and shopping items. Pantry matching compares mass only with mass, volume only with volume, spoons only with spoons, and count only with count. That means `1 tbsp olive oil` does not match `15 ml olive oil`, even though both describe volume. It also means the current `pcs` value cannot say whether it represents a clove, a whole onion, a can, or a fillet.

The starter inventory contains `Garlic` as `4 pcs` and `Yellow onion` as `3 pcs`. Those records do not say whether the garlic count means cloves or bulbs. A migration should therefore mark the count kind as `unknown` unless the user confirms it. It should not silently convert every existing garlic count to cloves.

The current importer also has four normalization risks that the source evidence confirms:

- It can reduce a range such as `1 to 2 tablespoons` to one number.
- It can reduce a package expression such as `2 x 400g cans` to a generic count and lose the per-package amount.
- It can treat `cup` as one universal volume even though source systems differ and some pages provide a metric alternative.
- It can treat preparation text such as `drained`, `rinsed`, `minced`, or `uncooked / dry` as part of the product name or discard it. Preparation and food identity need separate fields.

## Evidence from the six supported sources

The examples below come from the linked first-party recipe page or its first-party WordPress response. They are representative observations checked on 2026-10-04, not an exhaustive snapshot: recipe publishers can revise a card without changing its URL.

### RecipeTin Eats

Sources:

- [RecipeTin Eats recipe page: One pot chicken risoni with crispy salami](https://www.recipetineats.com/one-pot-chicken-risoni-with-crispy-salami/)
- [RecipeTin Eats WordPress post response](https://www.recipetineats.com/wp-json/wp/v2/posts?slug=one-pot-chicken-risoni-with-crispy-salami&_fields=id,link,slug,title,content)
- [RecipeTin Eats recipe-use policy](https://www.recipetineats.com/policy-use-of-recipes-images/)

The page exposes JSON-LD and a WPRM recipe card. The source page labels the measurement switch `Cups Metric`. The WordPress response contains the WPRM card inside `content.rendered`.

Representative current source ingredient strings include:

```text
1/2 tbsp olive oil
100g/ 3 oz salami stick, cut into 3mm / 1/8" thick rounds then chopped into small batons
2 x 250g / 8 oz chicken breasts (large), each cut in half horizontally to form 4 thin steaks
2 garlic cloves, finely minced
1/2 onion, finely chopped
1/4 cup chardonnay or other dry white wine, optional
1 1/4 cups risoni/orzo, uncooked
400g / 14 oz canned chickpeas, drained
3 cups chicken stock, low sodium (or veg stock)
3/4 cup thickened / heavy cream (low-fat ok)
150g/ 5 oz baby spinach (or 4 cups kale pieces)
2 tbsp roughly chopped basil (optional)
```

The current card also contains grouped lines for cooking or kosher salt, black pepper, garlic powder, paprika, sage powder, tomato paste, parmesan, and sun-dried tomato. The shorter block above is intentionally limited to the patterns used by the normalization decisions below.

The same page also uses preparation and cooking ranges in its notes, such as `2 - 3 minutes`, `500g/1 lb`, and `3mm / 1/8"`. The parser must distinguish an ingredient's quantity from dimensions in a preparation note and from a cooking-time range.

Normalization decisions:

- Prefer `100 g` over `3 oz` when both occur. Store `3 oz` in `sourceAlternatives`.
- Parse `2 x 250 g chicken breasts` as two pieces with a per-piece mass of 250 g. Do not replace it with only `500 g` because the count is useful for inventory and cooking.
- Parse `2 garlic cloves` as product `garlic`, `countKind = clove`, quantity `2`. Do not name the product `garlic cloves` and do not leave `cloves` as a generic piece unit.
- Parse `400 g canned chickpeas` as mass plus `form = canned`. Since no can count occurs in this line, do not invent one.
- Parse `1 1/4 cups` as a rational amount, not the decimal text `1` or the string `1 1/4`.
- Treat `risoni/orzo` as one product with an alias, not as two ingredients.
- Keep alternatives such as `thickened / heavy cream` and `or veg stock` as source alternatives or product variants. Do not merge them into one vague product name.

The linked policy says the site's content is copyrighted and that the author does not give permission to share content where ingredients or recipe directions are provided except in limited circumstances. The importer should therefore retain the source URL and keep imported content private to the user unless the intended use is cleared with the publisher.

### Love & Lemons

Sources:

- [Love & Lemons recipe page: Easy Pasta Salad](https://www.loveandlemons.com/pasta-salad/)
- [Love & Lemons WordPress post response](https://www.loveandlemons.com/wp-json/wp/v2/posts?slug=pasta-salad&_fields=id,link,slug,title,content)

The page and the WordPress response expose a WPRM recipe card. The response separates amount, unit, ingredient name, and notes in markup, while the page's Schema.org `Recipe` JSON-LD and rendered card also provide a plain ingredient string.

Representative current source ingredient strings include:

```text
3 cups uncooked fusilli pasta
2 heaping cups halved cherry tomatoes
1½ cups cooked chickpeas (drained and rinsed)
2 cups arugula
1 cup Persian cucumbers, sliced into thin half moons
1 cup crumbled feta cheese
1 cup fresh basil leaves, torn
½ cup minced fresh parsley
½ cup chopped fresh mint leaves
¼ cup toasted pine nuts
¼ cup extra-virgin olive oil, plus more for drizzling
3 tablespoons fresh lemon juice
1 teaspoon Dijon mustard
3 garlic cloves, minced
1 teaspoon herbes de Provence or dried Italian seasoning
¼ teaspoon red pepper flakes
¾ teaspoon sea salt
```

Normalization decisions:

- Support Unicode fractions such as `½`, `¼`, and `¾` as well as ASCII fractions.
- Preserve `heaping` as a quantity qualifier. It is not a second unit and should not be silently changed to an exact volume.
- Parse `cooked`, `uncooked`, `drained`, `rinsed`, `halved`, `sliced`, `minced`, and `torn` as preparation or state fields.
- Keep `Persian cucumbers` as a variety of cucumber. Do not collapse it into a generic cucumber if the user has a variety-aware inventory.
- Keep `herbes de Provence or dried Italian seasoning` as alternatives. They are not one canonical spice.
- `garlic cloves` again demonstrates that the product is garlic and the semantic count is a clove.

### Budget Bytes

Sources:

- [Budget Bytes recipe page: Easy Sesame Chicken](https://www.budgetbytes.com/easy-sesame-chicken/)
- [Budget Bytes WordPress post response](https://www.budgetbytes.com/wp-json/wp/v2/posts?slug=easy-sesame-chicken&_fields=id,link,slug,title,content)

The page's Schema.org `Recipe` JSON-LD and the WordPress response both expose a WPRM recipe card. It uses U.S.-customary shorthand, Unicode/HTML fractions, count qualifiers, preparation notes, and price annotations that are not ingredient quantities.

Exact source ingredient strings include:

```text
¼ cup soy sauce
2 Tbsp water
1 Tbsp toasted sesame oil
3 Tbsp brown sugar
1 Tbsp rice vinegar
1 tsp grated fresh ginger
2 cloves garlic, minced
½ Tbsp cornstarch
1 Tbsp sesame seeds
2 Tbsp cooking oil
1 lb boneless skinless chicken thighs
1 large egg
2 Tbsp cornstarch
1 pinch each salt and pepper
4 cups cooked jasmine rice
2 whole green onions
```

The instructions also say to cut the chicken into `small 1 inch pieces` and refer to `one pound` and `three chicken thighs`. These are not interchangeable quantities. The ingredient line gives a mass, while the note gives an approximate count.

Normalization decisions:

- Normalize `Tbsp`, `tbsp`, and `tablespoons` to the same source unit token before converting.
- Preserve `1 pinch each salt and pepper` as two ingredients with a qualitative amount, or as one grouped source line that requires review. Do not turn `pinch` into `1 pcs`.
- Parse `1 large egg` as one egg with `size = large`, not as an unspecified piece.
- Parse `2 whole green onions` as the separate product `spring_onion` or `green_onion`, with `countKind = whole`. It should not match a yellow onion.
- Preserve `boneless`, `skinless`, `fresh`, `grated`, `toasted`, and `cooked` as modifiers.
- `1 lb` is a mass unit and should become grams for the inventory base. The original pound expression must remain in the source record.

### Minimalist Baker

Sources:

- [Minimalist Baker recipe page: How to Make Hummus From Scratch](https://minimalistbaker.com/how-to-make-hummus-from-scratch/)

The official page contains both JSON-LD `recipeIngredient` values and a WPRM recipe card with a `US Customary` and `Metric` system switch. Its optional `FOR SERVING` group also contains amountless entries such as `Pita chips`, `Cucumber`, and `Red bell pepper`; these must remain amount-unknown rather than becoming `1 pcs`.

Exact source ingredient strings include:

```text
1 cup chickpeas* (uncooked / dry)
1 strip kombu (seaweed for improved digestion // optional)
1/4 tsp baking soda (for creamier texture // optional)
3 cloves garlic (crushed + skins removed)
1/3 cup tahini
2 Tbsp lemon juice
3/4 tsp sea salt
1 Tbsp olive oil (if avoiding oil, sub water or more lemon juice)
1 Dash garlic powder (optional)
1/4 cup fresh herbs (such as cilantro, parsley, or basil // optional)
```

Normalization decisions:

- A `strip` is a semantic count for kombu, not a generic piece of an arbitrary food. Keep it as `countKind = strip` or leave it as a source-only unit if the inventory cannot track it.
- `Dash` is a qualitative spoon-like amount. Keep `unit = dash` in the parsed record and leave the inventory amount unresolved unless the user chooses a conversion.
- `garlic powder` must be a different product from fresh garlic. The word `garlic` alone is not enough to select the product.
- `uncooked / dry` is a state. It matters for chickpeas because the page's note says one cup of dry chickpeas yields about two cups cooked.
- Do not convert `1 cup chickpeas` to grams using a generic cup rule. A food-specific density or an explicit USDA estimate is required, and the recipe state must match.

### Cookie and Kate

Sources:

- [Cookie and Kate recipe page: Best Lentil Soup](https://cookieandkate.com/best-lentil-soup-recipe/)
- [Cookie and Kate WordPress post response](https://cookieandkate.com/wp-json/wp/v2/posts?slug=best-lentil-soup-recipe&_fields=id,link,slug,title,content)

The page exposes a Schema.org `Recipe` JSON-LD object, and the WordPress response contains the Tasty Recipes card. This source has especially useful examples of ranges, can sizes, ingredient alternatives, and qualitative quantities.

Exact source ingredient strings include:

```text
¼ cup extra virgin olive oil
1 medium yellow or white onion, chopped
2 carrots, peeled and chopped
4 garlic cloves, pressed or minced
2 teaspoons ground cumin
1 teaspoon curry powder
½ teaspoon dried thyme
1 large can (28 ounces) diced tomatoes, lightly drained
1 cup brown or green lentils, picked over and rinsed
4 cups vegetable broth
2 cups water
1 teaspoon salt, more to taste
Pinch of red pepper flakes
Freshly ground black pepper, to taste
1 cup chopped fresh collard greens or kale, tough ribs removed
1 to 2 tablespoons lemon juice (½ to 1 medium lemon), to taste
```

Normalization decisions:

- Parse `1 large can (28 ounces)` as a package count of one, package kind `can`, package size 28 oz, and product `diced tomatoes`. The mass equivalent is about 794 g, but the source package information must remain.
- Parse `1 to 2 tablespoons` as `min = 1`, `max = 2`, with a spoon display and a millilitre equivalent. Do not use only the lower bound.
- Parse `yellow or white onion` as one onion concept with two allowed varieties, not as two onions.
- `brown or green lentils` is an ingredient alternative. Store the alternative set and do not double the amount.
- `Pinch` and `to taste` are not numeric units. The line still belongs in the recipe and should be available for manual completion.
- `pressed or minced`, `peeled and chopped`, `picked over and rinsed`, `lightly drained`, and `tough ribs removed` are preparation notes. They do not belong in the canonical food name.

### BBC Good Food

Sources:

- [BBC Good Food recipe page: The best spaghetti bolognese recipe](https://www.bbcgoodfood.com/recipes/best-spaghetti-bolognese-recipe)
- [BBC Good Food recipe page: Chicken tikka masala](https://www.bbcgoodfood.com/recipes/chicken-tikka-masala)

The recipe pages expose Schema.org JSON-LD `Recipe` objects. The editor text on the BBC page says, `Please use metric if possible`, and the checked ingredients are already mostly metric.

Representative current source ingredient strings from the spaghetti bolognese page include:

```text
1 tbsp olive oil
4 rashers smoked streaky bacon finely chopped
2 medium onions finely chopped
2 carrots trimmed and finely chopped
2 celery sticks finely chopped
2 garlic cloves finely chopped
2-3 sprigs rosemary leaves picked and finely chopped
500g beef mince
2 x 400g tins plum tomatoes
1 tsp dried oregano
2 fresh bay leaves
2 tbsp tomato purée
1 beef stock
1 red chilli deseeded and finely chopped (optional)
125ml red wine
6 cherry tomatoes sliced in half
75g parmesan grated, plus extra to serve
400g spaghetti
crusty bread to serve (optional)
```

The chicken tikka masala page adds these current examples:

```text
4 tbsp vegetable oil
25g butter
4 onions roughly chopped
6 tbsp chicken tikka masala paste (use shop-bought or make your own – see recipe, below)
2 red peppers deseeded and cut into chunks
8 boneless, skinless chicken breasts cut into 2.5cm cubes
2 x 400g cans chopped tomatoes
4 tbsp tomato purée
2-3 tbsp mango chutney
150ml double cream
150ml natural yogurt
chopped coriander leaves, to serve
```

Normalization decisions:

- `tin` and `can` are aliases for the semantic package kind `can`. Keep the source spelling for display and preserve the package mass.
- `2 x 400g tins` means two packages, each with a 400 g net amount. It is not a single 800 g loose ingredient.
- `2-3 tbsp` is a range. Store both endpoints.
- `1 beef stock` has no useful amount or package kind in the JSON-LD. Preserve it as an amount-unknown ingredient and ask for review rather than assuming one piece.
- `small pack basil leaves` and `chopped coriander leaves, to serve` from other BBC recipes show why package and role fields are needed even when the numeric amount is absent.
- `2.5cm cubes` is a preparation dimension, not an ingredient amount.

## Cross-source pattern findings

| Raw pattern | Evidence | Canonical handling |
| --- | --- | --- |
| `1/2`, `1 1/4`, `1½`, `¼` | RecipeTin Eats, Love & Lemons, Budget Bytes, Minimalist Baker, Cookie and Kate | Parse as an exact rational number. Store a decimal for calculation and the original fraction for display. |
| `1 to 2`, `2-3`, `2 - 3` | Cookie and Kate, BBC Good Food, RecipeTin Eats notes | Store `min` and `max`. Use one amount only when the source gives a single value. |
| `2 x 400g cans` | BBC Good Food | Store package count, per-package amount, package kind, and derived total. |
| `2 x 250g / 8 oz chicken breasts` | RecipeTin Eats | Store count and per-piece mass. Keep the customary alternative. |
| `100g / 3 oz` | RecipeTin Eats | Prefer the explicit metric quantity and keep the alternate quantity. Do not add both to the recipe total. |
| `cup`, `cups` | All US-style sources and RecipeTin Eats | Treat as source-specific volume. Prefer a source-provided metric rendering. Never convert a cup of a dry ingredient to grams without a food-specific density. |
| `tbsp`, `Tbsp`, `tablespoons` | All six sources | Normalize spelling first, but do not infer a universal spoon size from the token. Store the source system and a millilitre equivalent with its conversion method. |
| `tsp`, `teaspoon`, `teaspoons` | All six sources | Normalize spelling first, but do not infer a universal spoon size from the token. Store the source system and a millilitre equivalent with its conversion method. |
| `oz`, `ounce`, `lb`, `pound` | RecipeTin Eats, Budget Bytes, Cookie and Kate | Treat unqualified `oz` and `lb` as mass only when the source context supports it. `fl oz` is volume and needs a separate rule. |
| `clove(s) garlic` | RecipeTin Eats, Love & Lemons, Budget Bytes, Minimalist Baker, Cookie and Kate, BBC Good Food | Product is `garlic`; `countKind = clove`; preparation is a separate field. |
| `onion`, `yellow or white onion`, `red onion`, `green onion` | RecipeTin Eats, Love & Lemons, Budget Bytes, Cookie and Kate, BBC Good Food | Use onion concepts and variety attributes. `green onion` or `scallion` maps to a different product concept from bulb onion. |
| `can`, `tin`, `canned` | RecipeTin Eats, Cookie and Kate, BBC Good Food | `can` and `tin` map to `packageKind = can`. `canned` maps to product state. Do not discard package size. |
| `pinch`, `dash`, `to taste`, `as needed` | Budget Bytes, Minimalist Baker, Cookie and Kate, BBC Good Food | Keep a qualitative amount. Never default to `1 pcs` or zero. |
| `minced`, `pressed`, `crushed`, `chopped`, `sliced`, `diced`, `halved`, `torn`, `drained`, `rinsed`, `peeled`, `deseeded` | All six sources | Store preparation flags and keep their source order in the raw line. |
| `optional`, `if using`, `for serving`, `plus more` | All six sources | Store optionality or recipe role. Do not put these words into the canonical food name. |
| `or` and `/` between foods | RecipeTin Eats, Love & Lemons, Minimalist Baker, Cookie and Kate | Store alternatives. Do not treat alternatives as an additive list. |

## Authoritative measurement and food references

### SI units and customary conversions

- [NIST SI Units](https://www.nist.gov/pml/owm/metric-si/si-units) identifies the kilogram as the SI base unit for mass, describes volume through cubic metres, and explains the use of SI prefixes such as milli-.
- [NIST Guide to the SI, SP 811, Appendix B](https://doi.org/10.6028/NIST.SP.811e2008) gives these conversion factors in the table of units by kind of quantity: one U.S. cup is `236.5882 mL`, one U.S. fluid ounce is `29.57353 mL`, one avoirdupois ounce is `28.34952 g`, one avoirdupois pound is `453.5924 g`, one U.S. tablespoon is `14.78676 mL`, and one U.S. teaspoon is `4.928922 mL`.
- [BIPM SI Brochure](https://www.bipm.org/en/publications/si-brochure) is the international source for the SI system and unit symbols.

NIST's cup, spoon, and customary-unit values are U.S.-specific conversion references; they are not proof that every recipe writer uses the same kitchen convention. Recipe authors commonly round cups and spoon values, and a source's `tbsp` token does not identify its jurisdiction. The conversion record should therefore include the method:

```text
explicit_metric       The source supplied the metric value.
nist_exact             The source unit was converted with a documented factor.
recipe_convention     A rounded kitchen conversion was selected.
estimated              A food-specific estimate was used, such as a typical clove mass.
unknown                No safe conversion was available.
```

Recommended app policy:

- If the source supplies both systems, use the metric value as the inventory amount and retain the other system in `sourceAlternatives`.
- If an unqualified US cup must be converted, use the documented NIST value internally and round only for display, or use a clearly labelled 240 mL recipe convention. Do not mix the two without recording the choice.
- Do not use one universal cup-to-gram multiplier. Flour, oil, dry pasta, cooked rice, and chopped vegetables have different densities.
- Convert `oz` to grams and `lb` to grams only when they are mass units. Treat `fl oz` separately.
- Use `ml` as the comparison base for spoon measures. If the source system is known to be U.S. customary, retain NIST's exact `4.928922 ml` per teaspoon and `14.78676 ml` per tablespoon for provenance-preserving conversion. If the product chooses the kitchen-friendly display convention `1 tsp = 5 ml` and `1 tbsp = 15 ml`, mark it as `recipe_convention` rather than as an exact universal conversion. A source-provided metric amount takes priority, and a source/site adapter should be able to supply a different spoon convention when its jurisdiction is known.
- RecipeTin Eats has an explicit Cups/Metric switch. Its metric rendering should take priority over a generic cup or spoon conversion.

### Garlic and onion terminology

- [USDA FoodData Central API guide](https://fdc.nal.usda.gov/api-guide/) documents the structured food data service.
- [USDA FoodData Central record for raw garlic, FDC ID 169230](https://api.nal.usda.gov/fdc/v1/food/169230?api_key=DEMO_KEY) lists portions for `clove`, `cloves`, `tsp`, and `cup`. The returned portions include one garlic clove at 3 g and three cloves at 9 g.
- [USDA FoodData Central record for raw onions, FDC ID 170000](https://api.nal.usda.gov/fdc/v1/food/170000?api_key=DEMO_KEY) distinguishes a medium onion, large onion, and small onion. Its returned gram weights are 110 g, 150 g, and 70 g respectively, and it also distinguishes chopped cups and slices.

These values are useful estimates, not universal conversion rules. The FoodData Central API guide says that requests use an API key and that the public `DEMO_KEY` is rate-limited; if these portions are used, the application should fetch and record the primary response with its own key and retrieval date rather than hard-code a permanent food conversion. Garlic clove size varies. Onion size qualifiers must remain part of the ingredient. A recipe that says `4 garlic cloves` should remain four cloves even if the inventory also stores an estimated mass.

## Proposed canonical vocabulary

### Unit vocabulary

The following table separates the persisted inventory unit from the raw source token.

| Canonical concept | Source aliases | Dimension | Inventory representation | Lithuanian display |
| --- | --- | --- | --- | --- |
| gram | `g`, `gram`, `grams` | mass | `g` | `g` |
| kilogram | `kg`, `kilogram` | mass | `kg` or converted `g` | `kg` |
| millilitre | `ml`, `millilitre`, `milliliter` | volume | `ml` | `ml` |
| litre | `l`, `litre`, `liter` | volume | `l` or converted `ml` | `l` |
| teaspoon | `tsp`, `teaspoon` | spoon volume | `tsp` plus `baseAmountMl` | `a. š.` |
| tablespoon | `tbsp`, `Tbsp`, `tbs`, `tablespoon` | spoon volume | `tbsp` plus `baseAmountMl` | `v. š.` |
| source cup | `cup`, `cups` | source volume | convert to `ml` only with a known source system or a recorded convention | `puodelis` in source-aware display |
| source mass | `oz`, `ounce`, `lb`, `pound` | source mass | convert to `g` with source system and provenance | `g` after conversion |
| package/count descriptor | `can`, `tin`, `jar`, `pack`, `bunch`, `clove`, `sprig`, `strip` | count or package | `pcs` plus `countKind`/`packageKind`, never a bare generic unit | product-specific wording |
| whole piece | `piece`, `pieces`, `whole`, an unqualified count | count | `pcs`, `countKind = whole` | `vnt.` or product-specific wording |
| qualitative amount | `pinch`, `dash`, `to taste`, `as needed` | unknown | no numeric base amount | `žiupsnelis`, `šlakelis`, `pagal skonį` |

Semantic count kinds should include at least:

```text
clove, whole, half, can, tin, jar, pack, bunch, sprig, stalk,
leaf, slice, strip, fillet, breast, thigh, egg, stick, piece
```

Some of these are recipe-only descriptors rather than reliable pantry units. The parser can store them, but inventory matching should only use them when the user has an item with the same kind or an explicit package size.

### Food concepts and aliases

This is the initial seed list justified by the six source audits. The IDs are stable keys for matching. English aliases are inputs, not the value shown to a Lithuanian user.

| Canonical ID | Accepted source aliases | Important attributes | Lithuanian label |
| --- | --- | --- | --- |
| `garlic` | garlic, garlic cloves, cloves of garlic | fresh; count kind `clove` or `bulb`; preparation separate | česnakas |
| `garlic_powder` | garlic powder | dried powder; never merge with fresh garlic | česnako milteliai |
| `onion` | onion, yellow onion, white onion, yellow or white onion | variety and size attributes; count kind `whole` | svogūnas |
| `red_onion` | red onion | variety `red` | raudonasis svogūnas |
| `spring_onion` | green onion, spring onion, scallion | separate product; usually `whole` or `stalk` | svogūnų laiškai |
| `tomato` | tomato, cherry tomatoes | fresh variety and state | pomidoras |
| `canned_tomato` | canned tomatoes, diced tomatoes, plum tomatoes, chopped tomatoes | canned state, can/tin package, net mass, drained state | konservuoti pomidorai / smulkinti pomidorai |
| `tomato_paste` | tomato paste | concentrated product; not tomato purée | pomidorų pasta |
| `tomato_puree` | tomato purée | separate product from paste | pomidorų tyrė |
| `chickpea` | chickpeas, chickpeas / garbanzo beans | dry, cooked, or canned state | avinžirniai |
| `lentil` | lentils, brown lentils, green lentils, red lentils | variety and dry/cooked state | lęšiai |
| `pasta` | pasta, fusilli | shape attribute | makaronai |
| `risoni` | risoni, orzo | aliases for the same pasta shape | risoniai / orzo |
| `rice` | jasmine rice, cooked rice | variety and cooked state | ryžiai |
| `chicken_breast` | chicken breast, chicken breasts | boneless, skinless, per-piece mass | vištienos krūtinėlė |
| `chicken_thigh` | chicken thigh, chicken thighs | boneless, skinless, per-piece mass | vištienos šlaunelė |
| `beef_mince` | beef mince, ground beef | cut and fat percentage if present | malta jautiena |
| `bacon` | bacon, smoked streaky bacon | smoked and cut attributes | šoninė |
| `salami` | salami stick, salami | stick or sliced form | saliamis |
| `egg` | egg, large egg | size attribute | kiaušinis |
| `cream` | cream, heavy cream, thickened cream, double cream | product variant; do not erase the source variant | grietinėlė |
| `yogurt` | yogurt, yoghurt, natural yogurt | spelling and style aliases | jogurtas |
| `parmesan` | parmesan, Parmesan | cheese type | parmezanas |
| `feta` | feta cheese | cheese type | feta |
| `olive_oil` | olive oil, extra-virgin olive oil | oil type | alyvuogių aliejus |
| `vegetable_oil` | vegetable oil, cooking oil | oil type | augalinis aliejus |
| `stock` | chicken stock, vegetable stock, vegetable broth, beef stock | stock type and form | sultinys |
| `soy_sauce` | soy sauce | sauce | sojų padažas |
| `wine` | chardonnay, dry white wine, red wine | colour and variety | vynas |
| `lemon` | lemon, lemon juice | whole fruit versus juice | citrina / citrinų sultys |
| `ginger` | fresh ginger | fresh/dried state | šviežias imbieras |
| `carrot` | carrot, carrots | size and preparation | morka |
| `celery` | celery, celery sticks | stalk count kind | salieras |
| `cucumber` | cucumber, Persian cucumbers | variety | agurkas |
| `bell_pepper` | bell pepper, red bell pepper | colour and seed state | paprika |
| `chilli_pepper` | chilli, red chilli | hot pepper; never infer from bare `red pepper` | čili pipiras |
| `spinach` | baby spinach | leaf and fresh state | špinatai |
| `kale` | kale | greens type | lapinis kopūstas / lapiniai kopūstai |
| `collard_greens` | collard greens | separate greens type; do not silently alias with kale | translate or review separately |
| `basil` | basil, fresh basil leaves | fresh, leaf, chopped | bazilikas |
| `parsley` | parsley, fresh parsley | fresh, minced | petražolės |
| `mint` | mint, fresh mint leaves | fresh, leaf | mėta |
| `coriander` | coriander, coriander leaves, cilantro | source spelling alias; leaf | kalendra |
| `rosemary` | rosemary, rosemary sprigs | sprig count kind | rozmarinas |
| `thyme` | thyme, dried thyme, thyme sprigs | dried/fresh and sprig attributes | čiobreliai |
| `bay_leaf` | bay leaf, bay leaves | leaf count kind | lauro lapas |
| `salt` | salt, sea salt, cooking salt, kosher salt | salt type; source alias | druska |
| `black_pepper` | black pepper, freshly ground black pepper | ground state | juodieji pipirai |
| `paprika` | paprika, smoked paprika | smoked attribute | paprika |
| `cumin` | ground cumin | ground state | maltas kuminas |
| `curry_powder` | curry powder | spice blend | kario milteliai |
| `red_pepper_flakes` | red pepper flakes | dried flakes | aitriųjų paprikų dribsniai |
| `mustard` | Dijon mustard | variety | Dižono garstyčios |
| `tahini` | tahini | sesame paste | tahini |
| `sesame_seed` | sesame seeds | seed | sezamo sėklos |
| `pine_nut` | pine nuts | nut | kedro riešutai |
| `cornstarch` | cornstarch | starch | kukurūzų krakmolas |
| `brown_sugar` | brown sugar | sugar type | rudasis cukrus |
| `kombu` | kombu | seaweed; strip count kind | kombu |

These are canonical concepts, not automatic translations of every source word. For example, `red pepper` can mean a bell pepper on one page and a hot chilli on another. The parser needs the surrounding source text and should send ambiguous cases to review.

### Invalid or unsafe combinations

The vocabulary should include validation rules, not only aliases.

| Parsed combination | Action |
| --- | --- |
| `clove` + `garlic` | Accept as `garlic`, count kind `clove`. |
| `clove` + `onion` | Mark as a conflict and request review. Do not rewrite it to garlic or onion automatically. |
| `garlic powder` + `clove` | Mark as a conflict. Powder is measured by mass, tsp, tbsp, dash, or an unresolved qualitative amount. |
| `can` + `diced tomatoes` | Accept package kind and retain net amount if present. |
| `can` + `fresh basil` | Flag for review unless the source clearly means a packaged product. |
| `fillet` + `chicken breast` | Accept as a piece with a cut attribute. |
| `tin` + `plum tomatoes` | Accept as the same package kind as `can`. |
| `cup` + `olive oil` | Convert as volume. Do not use a mass conversion. |
| `cup` + `flour`, `rice`, or `pasta` | Convert to volume only, unless the source gives a food-specific mass alternative. |
| `oz` + `liquid` without `fl oz` | Keep source ambiguity and request review rather than assuming fluid ounces. |
| bare `red pepper` | Request review or use surrounding text; it may mean bell pepper or chilli. |
| `collard greens` + `kale` | Store as alternatives or separate concepts. Do not make one an automatic alias of the other. |

The specific case `2 cloves of onion` should never appear in the saved canonical name. If the raw line says `2 cloves of garlic`, the saved record should be product `garlic`, quantity `2`, count kind `clove`, and the Lithuanian display should be `2 česnako skiltelės`. If the raw line genuinely says `2 cloves of onion`, the importer should keep the raw line and show a correction request. It should not turn an onion into garlic.

## Suggested parsed record

The following fields are enough to support import, review, Lithuanian display, and inventory matching without losing the source wording:

```text
rawText
sourceUrl
sourceName
sourceGroup
canonicalFoodId
canonicalFoodVariant       // red onion, dry chickpeas, garlic powder
amountMin
amountMax
amountPerItem              // 250 g per chicken breast, when present
sourceUnitText              // "cups", "oz", "cloves", "can"
sourceMeasurementSystem     // metric, us-customary, imperial, unknown
baseAmount
baseUnit                    // g, ml, pcs, or unknown
displayUnit                 // tsp, tbsp, g, ml, pcs
countKind                   // clove, whole, can, fillet, sprig, unknown
packageKind                 // can, tin, jar, pack, unknown
packageCount
packageNetAmount
packageNetUnit
foodState                   // fresh, dry, cooked, canned, drained
sizeQualifier               // small, medium, large
preparationNotes            // chopped, minced, peeled, rinsed
role                        // main, sauce, garnish, for-serving
optional
alternatives
conversionMethod
confidence
reviewReason
```

`rawText`, `sourceUrl`, `sourceUnitText`, and `conversionMethod` should be retained even after normalization. They make it possible to explain an inventory match and to correct a bad alias later.

## Examples of the intended result

### Garlic

Source:

```text
4 garlic cloves, pressed or minced
```

Parsed result:

```text
canonicalFoodId: garlic
amountMin: 4
amountMax: 4
baseUnit: pcs
countKind: clove
preparationNotes: pressed | minced
display_lt: 4 česnako skiltelės, suspaustos arba susmulkintos
```

The inventory key is `garlic + clove`, not the raw string `garlic cloves`.

### Onion

Source:

```text
1 medium yellow or white onion, chopped
```

Parsed result:

```text
canonicalFoodId: onion
canonicalFoodVariant: yellow | white
amountMin: 1
baseUnit: pcs
countKind: whole
sizeQualifier: medium
preparationNotes: chopped
display_lt: 1 vidutinis geltonasis arba baltasis svogūnas, susmulkintas
```

The alternative is not two onions. A separate `red_onion` or `spring_onion` concept prevents a red or green onion from matching an ordinary bulb onion unless the user allows substitutions.

### Canned tomatoes

Source:

```text
2 x 400g cans chopped tomatoes
```

Parsed result:

```text
canonicalFoodId: canned_tomato
amountMin: 2
baseUnit: pcs
countKind: can
packageCount: 2
packageNetAmount: 400
packageNetUnit: g
derivedTotalAmount: 800
derivedTotalUnit: g
foodState: canned
display_lt: 2 skardinės smulkintų pomidorų po 400 g
```

The shopping list can show two cans. Inventory can also use the derived 800 g when the user has recorded the net contents, but it must retain that the original recipe asked for cans.

### Spoons and millilitres

Source:

```text
1 to 2 tablespoons lemon juice
```

Parsed result under an explicitly selected `5 ml` teaspoon / `15 ml` tablespoon kitchen convention:

```text
amountMin: 1
amountMax: 2
displayUnit: tbsp
baseAmountMin: 15
baseAmountMax: 30
baseUnit: ml
conversionMethod: recipe_convention
display_lt: 1–2 v. š. citrinų sulčių (15–30 ml)
```

The original `tablespoons` token remains in the record. If the source provides a metric amount or its locale demands a different spoon size, that source value takes precedence.

### Qualitative amounts

Source:

```text
Pinch of red pepper flakes
Freshly ground black pepper, to taste
```

Parsed result:

```text
canonicalFoodId: red_pepper_flakes
amountStatus: qualitative
qualifier: pinch

canonicalFoodId: black_pepper
amountStatus: qualitative
qualifier: to taste
preparationNotes: freshly ground
```

These ingredients should remain visible and editable. An unknown quantity is different from zero.

## Inventory matching rules

Use the canonical food ID as the primary key. Use the product variant, state, and count or package kind when they affect substitution.

1. Match `garlic` with `garlic` after alias resolution. Match `garlic clove` with a pantry record whose count kind is `clove`. Do not use an onion or a garlic bulb as an exact clove match without a user-approved conversion.
2. Match mass with mass and volume with volume. Do not infer the density of a food from its name alone.
3. Convert `tsp` and `tbsp` to millilitres for comparison, while retaining the spoon display. This lets `15 ml olive oil` cover `1 tbsp olive oil`.
4. Match package counts only when package kind and net size are compatible. Two 400 g cans can cover 800 g of the same canned product if the inventory has a recorded net amount. A loose 800 g amount should not automatically claim that two physical cans are present.
5. Keep preparation notes out of the basic pantry identity unless the state changes the product, such as dry versus cooked chickpeas, fresh versus dried herbs, or canned versus fresh tomatoes.
6. Treat alternatives as alternatives. `brown or green lentils` should not create two shopping items. A substitution decision belongs to the user or a future substitution table.
7. If a raw line has no amount, keep it as amount unknown. Do not default to `1 pcs`.
8. If the parser finds a unit and product conflict, keep the raw line and route it to the review step. A wrong confident match is worse than an unresolved ingredient because it corrupts pantry and shopping totals.

## Implementation order after this research

The report supports this sequence for a later code change:

1. Add a versioned unit and food alias table seeded from the vocabulary above.
2. Add `countKind`, package fields, ranges, alternatives, preparation notes, and conversion provenance to the import draft.
3. Normalize imported data before opening the existing recipe editor, while showing the raw line beside the parsed result for review.
4. Add a small set of parser fixtures using the exact lines quoted above, one fixture per recurring pattern.
5. Migrate existing pantry items with `countKind = unknown` rather than guessing.
6. Update inventory matching to use canonical food IDs and base units.
7. Add Lithuanian display rules for count units and quantities. Examples include `1 česnako skiltelė`, `2 česnako skiltelės`, `1 svogūnas`, `1/2 svogūno`, and `2 skardinės smulkintų pomidorų po 400 g`.

This gives the importer a consistent internal vocabulary without erasing the source recipe's wording or measurement system.
