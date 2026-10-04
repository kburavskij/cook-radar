# Lithuanian UI copy audit

Date: 2026-10-04

Scope: Lithuanian user-facing copy in `src/i18n.ts`, `index.html`, and literal UI strings in `src/App.tsx`. `README.md` was also checked for Lithuanian copy. This audit covers food, cooking, pantry, shopping, recipe, grammar, capitalization, and compact mobile labels.

The recommendations from this audit have been applied to the current working tree. Build and deployment verification follows.

## Summary

The most important fixes are the dynamic count phrases, the shopping-list labels, and the terminology policy for `ingredientas`. The current copy is understandable, but several strings are fragments whose grammar changes with the number shown. A few labels are also too vague for a mobile navigation item.

Several food terms are already supported by the official Terminų bankas, including `ingredientas`, `porcija`, `kuminas`, `parmezanas`, `brokolis`, `paplotėlis`, and `suktinukas`. `Ingredientas` is accepted, but VLKK says that `sudedamoji dalis` and, in a food context, `sudėtis` have priority. The app can keep `ingredientas` for compactness, but it should make that an explicit product decision.

`README.md` contains no Lithuanian user-facing copy. Its English product description does not need a Lithuanian-language change.

## Findings

### 1. Fix number-dependent phrases first

These are the clearest correctness problems because the current code only distinguishes one from "not one".

| Location | Current copy | Recommendation | Type and source |
| --- | --- | --- | --- |
| `src/App.tsx:459-461` | `1 receptas paruoštas`, otherwise `receptai paruošti` | Add proper number handling, or use an invariant UI phrase such as `Paruošta receptų: {n}`. The current branch produces forms such as `10 receptai paruošti`. | Language-backed. VLKK shows that cardinal-number phrases are inflected as a unit, for example `penki susitikimai` and `dvidešimt penki tūkstančiai žmonių`: [samplaikiniai kiekiniai skaitvardžiai](https://vlkk.lt/konsultacijos/2769-samplaikiniai-kiekiniai-skaitvardziai). See also [pagrindiniai skaitvardžiai](https://vlkk.lt/konsultacijos/2771-pagrindiniai-skaitvardziai). |
| `src/App.tsx:402` | `{recipe.steps.length} žingsniai` | Use a pluralization helper, or avoid the inflection with `Žingsnių: {n}`. The current phrase is wrong for `1 žingsniai` and for larger counts that need a genitive plural. | Language-backed. The same VLKK number guidance applies: [samplaikiniai kiekiniai skaitvardžiai](https://vlkk.lt/konsultacijos/2769-samplaikiniai-kiekiniai-skaitvardziai). The invariant form is an editorial UI solution. |
| `src/i18n.ts:47`, `src/i18n.ts:86`, `src/App.tsx:376` | `{n} trūksta`; `{n} liko pirkti`; `2 liko pirkti.` | Prefer complete, stable phrases: `Trūksta: {n}` or `Trūksta {n} produktų`; `Liko nupirkti: {n}`. The current word order is especially unnatural when rendered as `2 liko pirkti.` | Editorial UX recommendation, supported by the same number-agreement principle in [VLKK's cardinal-number guidance](https://vlkk.lt/konsultacijos/2769-samplaikiniai-kiekiniai-skaitvardziai). The exact short label is not a dictionary ruling. |
| `src/i18n.ts:63`, `src/App.tsx:176-180` | `{n} {word} pridėta į pirkinių sąrašą.` | Avoid trying to agree only `ingredientas` and `ingredientai`. Use `Į pirkinių sąrašą įtraukta: {n}` or implement all required forms, including `1`, `2-9`, and larger counts. | Language-backed terminology plus editorial phrasing. VLKK describes `ingredientas` as valid but secondary and gives the preferred alternatives [here](https://vlkk.lt/konsultacijos/1163-sudedamosios-dalys-sudetis-ingredientai). The Terminų bankas entry is [ingredientas](https://terminai.vlkk.lt/paieska?search=ingredientas). |
| `src/App.tsx:309` | The count is followed by the literal `paruošta`. | Use an invariant status such as `paruošta gaminti` or reuse `Galima gaminti`. The current feminine singular form has no visible noun and does not explain what the number counts. | Editorial UI recommendation. The number-agreement source is [VLKK's cardinal-number guidance](https://vlkk.lt/konsultacijos/2769-samplaikiniai-kiekiniai-skaitvardziai); the final short label is a product decision. |
| `src/i18n.ts:30-32`, `src/App.tsx:335`, `src/App.tsx:342` | The number is displayed separately from `produktų`, `receptų`, and `pirkti`. | Use explicit card labels such as `Produktų`, `Receptų`, and `Pirkinių`, or render a complete phrase such as `Produktų: {n}`. Replace `pirkti` with the noun `Pirkinių`; an isolated infinitive under a number is ambiguous. | Editorial UI recommendation. The official terminology resources support `produktas` in food terminology: [Terminų bankas: produktas](https://terminai.vlkk.lt/paieska?search=produktas). The label layout itself is a product decision. |

### 2. Make shopping language explicit

The shopping section is understandable, but several strings omit the object that makes the action clear.

| Location | Current copy | Recommendation | Type and source |
| --- | --- | --- | --- |
| `src/i18n.ts:84`, `src/i18n.ts:83` | `Pirkiniai`; `KITAS APSIPIRKIMAS` | Use `Pirkinių sąrašas` as the page title. For the eyebrow, use `PIRKINIŲ SĄRAŠAS` or the shorter `KITI PIRKINIAI` depending on the intended meaning. | Editorial context recommendation. `pirkinys` and `sąrašas` are ordinary dictionary words; the official LKI search entry points are [pirkinys](https://ekalba.lt/paieska/detalioji/?paieska=pirkinys) and [sąrašas](https://ekalba.lt/paieska/detalioji/?paieska=s%C4%85ra%C5%A1as). No official source found a mandatory UI phrase, so this is a clarity decision. |
| `src/i18n.ts:100` | `Pridėti į pirkinius` | Use `Pridėti į pirkinių sąrašą`. `Į pirkinius` reads as adding something to purchases rather than to a list. | Editorial context recommendation using the same official lexical sources: [pirkinys](https://ekalba.lt/paieska/detalioji/?paieska=pirkinys) and [sąrašas](https://ekalba.lt/paieska/detalioji/?paieska=s%C4%85ra%C5%A1as). |
| `src/i18n.ts:93`, `src/App.tsx:380` | `Receptui {recipeName}` | Use `Pagal receptą: {recipeName}` or `Receptas: {recipeName}`. `Receptui` is grammatical as a dative, but it does not clearly express attribution in this row. | Editorial UX recommendation. The official [Terminų bankas entry for receptas](https://terminai.vlkk.lt/paieska?search=receptas) supports the food term; the choice between `pagal` and `receptas` is contextual. |
| `src/i18n.ts:92` | `Išvalyti nupirktus` | Use `Pašalinti nupirktus produktus` or, if the list object is clear from the screen, `Pašalinti nupirktus`. The current participle has an omitted noun and is harder to scan on mobile. | Editorial UX recommendation. The wording is not a dictionary error; the issue is the missing object and action clarity. |

### 3. Choose one recipe-ingredient policy

`ingredientas` is not an outright error. VLKK's consultation says it means a mixture's component and is a secondary norm variant. The same consultation gives priority to `sudedamoji dalis` and, in food usage, `sudėtis`. The LKI dictionary defines `ingredientas` as a compound or mixture component.

If the product should follow the preferred Lithuanian wording, use the following compact set:

- `form.ingredients`, `detail.ingredients`: `Sudedamosios dalys`
- `form.addIngredient`: `Pridėti sudedamąją dalį`
- `form.invalidIngredient`: `Pridėk bent vieną sudedamąją dalį.`
- `common.addMissing`: `Pridėti trūkstamas sudedamąsias dalis`
- `toast.haveEverything`: `Jau turi visas sudedamąsias dalis.`

If the shorter industry term is preferred, keep `ingredientas`, but use it consistently. Do not mix `ingredientai`, `produktai`, and `sudedamosios dalys` for the same object without a deliberate distinction.

Sources:

- [VLKK consultation: sudedamosios dalys, sudėtis, ingredientai](https://vlkk.lt/konsultacijos/1163-sudedamosios-dalys-sudetis-ingredientai)
- [Terminų bankas: ingredientas](https://terminai.vlkk.lt/paieska?search=ingredientas)
- [LKI eKalba, Lietuvių kalbos žodynas: ingredientas](https://ekalba.lt/paieska/detalioji/?paieska=ingredientas&p=1&d=50&i=682c82a5-d6d1-40c1-b8be-d1b782baff4c)

### 4. Normalize headings and mobile labels

The source strings contain all-capital headings such as `ŠIANDIEN`, `GALI GAMINTI DABAR`, `TAVO KOLEKCIJA`, `KĄ TURI NAMUOSE`, `KITAS APSIPIRKIMAS`, and `RECEPTO INFORMACIJA`. CSS also applies `text-transform: uppercase` to eyebrow labels in `src/styles.css:91`.

Store these values in normal sentence case and let CSS control the visual treatment:

| Current | Recommended source string |
| --- | --- |
| `ŠIANDIEN` | `Šiandien` |
| `GALI GAMINTI DABAR` | `Gali gaminti dabar` |
| `TAVO KOLEKCIJA` | `Tavo kolekcija` |
| `KĄ TURI NAMUOSE` | `Ką turi namuose` |
| `KITAS APSIPIRKIMAS` | `Kitas apsipirkimas` or `Pirkinių sąrašas` |
| `RECEPTO INFORMACIJA` | `Recepto informacija` |

This keeps the copy correct for screen readers, browser text extraction, and future layouts while preserving the current visual style. VLKK's guidance says that in a title the first word and proper names are capitalized, with examples such as `Prašymas`, `Diktantas`, and `Gaminio instrukcija`: [antraštiniai pavadinimai; didžiosios raidės; kabutės](https://vlkk.lt/konsultacijos/10268-antrastiniai-pavadinimai-didziosios-raides-kabutes).

Other compact labels worth changing:

- `recipes.ready`: change `Galiu gaminti` to `Galima gaminti` to match `common.ready` and keep the interface in an impersonal status voice.
- `common.viewAll`: replace context-free `Rodyti visus` with `Rodyti visus receptus`, `Rodyti visus produktus`, or `Rodyti visus pirkinius`; use `Rodyti daugiau` where the mobile layout needs a short invariant label.
- `common.allIngredients` and `detail.haveEverything`: use `Turi visus ingredientus` or the preferred `Turi visas sudedamąsias dalis` instead of the vague `Viską turi`.

These three are editorial UI recommendations. The cited VLKK heading guidance supports sentence-case source strings, but it does not prescribe a mobile button label.

The design-preview switcher mentioned in the original audit has since been removed from the production bundle. This closes the accessibility issue described here.

### 5. Keep the verified units and food terms

The following existing choices are supported by official terminology sources and should not be changed just to make the Lithuanian look different:

- `min` is the symbol for the minute in the Terminų bankas: [minutė](https://terminai.vlkk.lt/paieska?search=minut%C4%97). The literal `min` in `src/App.tsx:355` and `src/App.tsx:402` is appropriate.
- `ml` is confirmed by VLKK as the abbreviation for `mililitras`: [Kaip žymėti mililitrą?](https://vlkk.lt/konsultacijos/7593-mililitras-ml).
- `porcija` is a recommended food term meaning a quantity of food or drink served at one time: [porcija](https://terminai.vlkk.lt/paieska?search=porcija). The `Porcijos` field is correct. The short `porc.` in `src/App.tsx:402` is a space-saving editorial abbreviation; use full `porcijos` when the mobile width permits.
- `kuminas`, `parmezanas`, and `brokolis` are listed as recommended food terms: [kuminas](https://terminai.vlkk.lt/paieska?search=kuminas), [parmezanas](https://terminai.vlkk.lt/paieska?search=parmezanas), and [brokolis](https://terminai.vlkk.lt/paieska?search=brokolis).
- `paplotėlis` is a recommended term for a baked item made from thinly rolled dough: [paplotėlis](https://terminai.vlkk.lt/paieska?search=paplot%C4%97lis). The food label `Paplotėliai` is therefore sound.

One semantic caution: the Terminų bankas defines `suktinukas` as a dish made from thinly beaten meat with filling that is rolled up: [suktinukas](https://terminai.vlkk.lt/paieska?search=suktinukas). The recipe `Traškūs avinžirnių suktinukai` uses the word for a flatbread wrap. This is understandable, but it extends the official food meaning. For a literal description, consider `Paplotėliai su avinžirniais`; keep `suktinukai` only if the product intentionally uses it as a broad, friendly food name.

### 6. Recipe prose and metadata

These are naturalness and product-copy recommendations, not findings that the official sources classify as errors.

| Location | Current copy | Recommended direction |
| --- | --- | --- |
| `src/i18n.ts:304` | `Atidėk 100 ml virimo vandens.` | `Pasilik 100 ml makaronų virimo vandens.` The object becomes clear. |
| `src/i18n.ts:304` | `užbaik citrinos sultimis` | `Pagardink citrinos sultimis.` This is a more natural cooking instruction. |
| `src/i18n.ts:304` | `Šviesūs, švelnūs makaronai vakarienei...` | Rework `šviesūs` if it is meant to describe taste or texture. For example, describe the actual quality: `Švelnaus skonio makaronai greitai vakarienei.` |
| `src/i18n.ts:307` | Tag `Gaminti daugiau` | Use `Daugiau porcijų` if the intended meaning is that the recipe makes extra servings. `Gaminti daugiau` sounds like an instruction rather than a recipe property. |
| `index.html:8` | `Planuok patiekalus iš to, ką jau turi namuose.` | Consider `Planuok, ką gaminti iš namuose turimų produktų.` This is shorter and makes the pantry relationship explicit. The food term `produktas` is supported in the [Terminų bankas](https://terminai.vlkk.lt/paieska?search=produktas). |
| `src/i18n.ts:78` | `Paprastas produktų sąrašas su metriniais kiekiais.` | Consider `Paprastas namuose turimų produktų sąrašas su kiekiais metriniais vienetais.` This is longer, so test it at the mobile width; it is an editorial clarity option, not a mandatory correction. |

The recipe steps consistently use the informal singular imperative (`Išvirk`, `Sudėk`, `Įkaitink`, `Pabarstyk`). Keep that voice consistent if the copy is revised. Do not switch some steps to the formal `-kite` form unless the whole product voice changes.

## Suggested implementation order

1. Replace the count fragments with either a tested Lithuanian pluralization helper or invariant phrases such as `Paruošta receptų: {n}` and `Žingsnių: {n}`.
2. Rename the shopping section to `Pirkinių sąrašas` and make the related modal and attribution labels explicit.
3. Decide whether Cook Radar follows VLKK's preferred `sudedamoji dalis` or keeps the compact secondary term `ingredientas`.
4. Store headings in sentence case, while leaving the existing uppercase CSS treatment in place if the design needs it.
5. Review the recipe prose and the `suktinukai` label as product copy, not as spelling corrections.

## Source and lookup note

The report uses only VLKK, the Lietuvos Respublikos Terminų bankas, and the Lithuanian Language Institute's E. kalba resources. The official sources provide the lexical status, definitions, number-agreement examples, capitalization guidance, and unit symbols. They do not prescribe every short mobile UI phrase, so those recommendations are marked as editorial. The exact phrase `pirkinių sąrašas`, the abbreviation `porc.`, and the preferred wording for each compact button were not treated as dictionary rulings.
