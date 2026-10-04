# Cook Radar

An offline-first PWA for deciding what to cook from the food already at home.

Live app: <https://kburavskij.github.io/cook-radar/>

The live app uses the Today-first layout.

## Run locally

```bash
npm install
npm run dev
```

The app stores recipes, pantry stock, and the shopping list in the browser. The
service worker caches the app shell after the first visit, so the core workflow
continues without a connection.

## First slice

- Browse recipes and filter to meals that can be made now.
- Import recipes from a link or add them manually, then review the imported data.
- Add, edit, and remove recipes with metric ingredients.
- Track pantry quantities and see what each recipe is missing.
- Add missing ingredients to a local shopping list.
- Install as a PWA on iPhone or desktop.

The importer currently supports RecipeTin Eats, Love & Lemons, Budget Bytes,
Minimalist Baker, Cookie and Kate, and BBC Good Food. It keeps imported recipe
text in the source language so you can review and edit it before saving.

The current recipe-source research is in
[`research/recipe-import-source-audit.md`](research/recipe-import-source-audit.md).

Imported ingredient names and quantities are normalized through the semantic
catalog in [`src/ingredientCatalog.ts`](src/ingredientCatalog.ts). The parser
keeps preparation notes, recognizes count kinds such as cloves and cans, and
matches spoon quantities with millilitres when checking pantry stock.

The normalization decisions and source examples are in
[`research/recipe-normalization-audit.md`](research/recipe-normalization-audit.md).
