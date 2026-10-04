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
- Add, edit, and remove recipes with metric ingredients.
- Track pantry quantities and see what each recipe is missing.
- Add missing ingredients to a local shopping list.
- Install as a PWA on iPhone or desktop.

The next integration is receipt import. It should stay behind an explicit
connection to a supermarket account, then normalize receipt lines into pantry
items before changing stock.
