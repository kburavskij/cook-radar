# Recipe import source audit

Date: 2026-10-04

Repository: `/home/gwanz/Dev/cook-radar`

## Recommendation

Start with three import adapters, each with a different contract:

| Priority | Source | Import method | Release decision |
| --- | --- | --- | --- |
| 1 | [TheMealDB](https://www.themealdb.com/api.php) | Official JSON API | Best first public API source. Use a production or supporter key before treating the public PWA as a production service. Keep the required attribution. |
| 1 | [BBC Good Food](https://www.bbcgoodfood.com/recipes/chicken-tikka-masala) | Direct HTML fetch, then `application/ld+json` `Recipe` extraction | Technically works from GitHub Pages because the page returns `Access-Control-Allow-Origin: *`. Restrict the feature to user-driven, personal, non-commercial imports and do not assume that schema presence grants redistribution rights. Reject or warn on pages whose schema says `isAccessibleForFree` is `False`. |
| 1, with a rights gate | [RecipeTin Eats](https://www.recipetineats.com/one-pot-chicken-risoni-with-crispy-salami/) | Source-owned WordPress REST API, then parse the returned WPRM recipe-card HTML | Technically works through the public WordPress API even though the article HTML does not allow CORS. RecipeTin Eats says it does not permit sharing ingredients or directions except in limited cases, so keep this personal-only until the intended use is cleared with the publisher. |

The current client also supports [Love & Lemons](https://www.loveandlemons.com/pasta-salad/), [Budget Bytes](https://www.budgetbytes.com/easy-sesame-chicken/), [Minimalist Baker](https://minimalistbaker.com/how-to-make-hummus-from-scratch/), and [Cookie and Kate](https://cookieandkate.com/best-lentil-soup-recipe/) through their public WordPress REST responses or recipe-page markup. These adapters are still user-initiated and personal-use only. TheMealDB is the next source worth adding because its official API is a better long-term contract than scraping publisher pages.

Do not add King Arthur Baking, Serious Eats, or Allrecipes to the first public set. King Arthur Baking's terms prohibit automated scraping and reproduction without permission. People Inc.'s terms, linked by both Serious Eats and Allrecipes robots files, prohibit scraping and downloading data from the services. Serious Eats and Allrecipes also returned a Cloudflare `402` page to the unauthenticated checks in this audit. A server-side proxy would solve a browser-origin problem, but it would not solve these permission or access restrictions.

## What a GitHub Pages PWA can read

[GitHub Pages is static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages). It publishes HTML, CSS, and JavaScript from the repository; it does not provide a server-side relay for fetching another site's HTML.

The PWA's production origin is [https://kburavskij.github.io/cook-radar/](https://kburavskij.github.io/cook-radar/). A browser fetch from that origin can read a cross-origin response only when the source supplies a compatible CORS response header. The [Fetch Standard's CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol) defines `Access-Control-Allow-Origin` as the response permission. `mode: "no-cors"` would return an opaque response, which is not useful for parsing recipe HTML or JSON.

The checks below sent `Origin: https://kburavskij.github.io` and used ordinary unauthenticated GET requests. A missing `Access-Control-Allow-Origin` means the browser cannot expose the body to the PWA, even when `curl` can download it.

| Response tested | Status | CORS evidence | Client-side result |
| --- | ---: | --- | --- |
| RecipeTin Eats article HTML | 200 | No `Access-Control-Allow-Origin`; `Vary: Cookie,Origin` | The PWA cannot read the article HTML directly. |
| RecipeTin Eats WordPress REST API | 200 | `Access-Control-Allow-Origin: https://kburavskij.github.io`, `Access-Control-Allow-Credentials: true` | Readable from the PWA. The site reflects the requesting origin, so keep requests simple and send no credentials. |
| BBC Good Food free recipe HTML | 200 | `Access-Control-Allow-Origin: *` | Readable directly from the PWA. |
| King Arthur Baking recipe HTML | 200 | No `Access-Control-Allow-Origin` | Not readable from the PWA. |
| Love & Lemons article HTML | 200 | No `Access-Control-Allow-Origin` | Not readable directly. |
| Love & Lemons WordPress post API | 200 for `?slug=pasta-salad` | `Access-Control-Allow-Origin: https://kburavskij.github.io`, `Access-Control-Allow-Credentials: true` | Readable through the same slug-based adapter used for other WordPress recipe sites. |
| Budget Bytes WordPress post API | 200 for `?slug=easy-sesame-chicken` | `Access-Control-Allow-Origin: https://kburavskij.github.io` | Readable; the response contains WPRM recipe-card markup. |
| Minimalist Baker recipe HTML | 200 after redirect | `Access-Control-Allow-Origin: *` | Readable directly; the page contains WPRM recipe-card markup. |
| Cookie and Kate WordPress post API | 200 for `?slug=best-lentil-soup-recipe` | `Access-Control-Allow-Origin: https://kburavskij.github.io` | Readable; the response contains Tasty Recipes markup. |
| TheMealDB JSON API | 200 | `Access-Control-Allow-Origin: *` | Readable directly from the PWA. |
| Serious Eats recipe page | 402 | No usable CORS response; Cloudflare response | Not a supported source. |
| Allrecipes recipe page | 402 | No usable CORS response; Cloudflare response | Not a supported source. |

## Source findings

### RecipeTin Eats

Checked article: [One pot chicken risoni with crispy salami](https://www.recipetineats.com/one-pot-chicken-risoni-with-crispy-salami/).

Schema evidence:

- The page returns a public `application/ld+json` `Recipe` object. The sample contained 22 `recipeIngredient` entries and 8 `HowToStep` entries.
- The first ingredient strings were `1/2 tbsp olive oil`, `100g/ 3 oz salami stick`, and `2 x 250g / 8 oz chicken breasts`. These are usable recipe data, but the amount and unit are not always separated cleanly.
- The page response links to the site's WordPress API with `Link: <https://www.recipetineats.com/wp-json/>; rel="https://api.w.org/"` and exposes the post JSON link for post `129921`.

First-party API evidence:

- [WordPress REST API index](https://www.recipetineats.com/wp-json/) lists the site's `wp/v2` and `wp-recipe-maker/v1` namespaces.
- The source-owned request [posts?slug=one-pot-chicken-risoni-with-crispy-salami](https://www.recipetineats.com/wp-json/wp/v2/posts?slug=one-pot-chicken-risoni-with-crispy-salami&_fields=id,link,slug,title,content) returned one post, ID `129921`, with `content.rendered` containing the recipe card. The content includes `wprm-recipe-ingredient` and `wprm-recipe-instruction` elements, so an adapter can parse the structured recipe card without fetching the article HTML.
- [WPRM app discovery](https://www.recipetineats.com/wp-json/wp-recipe-maker/v1/app/discovery) reports an `app_recipes` capability, but [the app recipe endpoint](https://www.recipetineats.com/wp-json/wp-recipe-maker/v1/app/recipes/129921) returned `401 wprm_app_invalid_token`. [The embed endpoint](https://www.recipetineats.com/wp-json/wp-recipe-maker/v1/embed/129921) returned `403 embed_api_disabled`. Treat the WordPress post response as the usable public endpoint, not the WPRM app API.

Access and policy evidence:

- [robots.txt](https://www.recipetineats.com/robots.txt) has an empty `Disallow` for `User-agent: *`, but separately disallows several AI and bot user agents.
- The article HTML does not return `Access-Control-Allow-Origin`. The WordPress API does return `Access-Control-Allow-Origin: https://kburavskij.github.io` and `Access-Control-Allow-Credentials: true` for the tested origin. The API also reflected `https://example.com` in a separate header check, so the response appears to reflect arbitrary origins rather than maintain a fixed allowlist.
- RecipeTin Eats' [Policy: Use of Recipes & Images](https://www.recipetineats.com/policy-use-of-recipes-images/) says the site's content is copyrighted, prohibits commercial use without permission, and says: "I do not give permission to share my content where the ingredients or recipe directions are provided, except in very limited circumstances." This is the main release constraint. A user-private import is a different use from publishing a recipe catalog, but the adapter should not be presented as a blanket redistribution license.

Recommended handling: support the WordPress API behind an explicit personal-import notice, preserve the source URL and attribution, do not cache a shared server-side copy, and obtain permission before making imported recipes visible to other users.

### BBC Good Food

Checked article: [Chicken tikka masala](https://www.bbcgoodfood.com/recipes/chicken-tikka-masala).

Schema evidence:

- The page returns a public `application/ld+json` `Recipe` object with `recipeYield: 10`, `prepTime: PT15M`, `cookTime: PT50M`, `totalTime: PT1H5M`, 12 ingredient strings, and 5 instruction steps.
- The page response returned `Access-Control-Allow-Origin: *`, so a browser running on the Cook Radar GitHub Pages origin can fetch and parse it.
- A second checked page, [Last minute Christmas cake](https://www.bbcgoodfood.com/recipes/last-minute-christmas-cake), returned a `Recipe` object with `isAccessibleForFree: "False"` and a `.zephr-locked-content` marker. The parser should detect this condition rather than treating every valid JSON-LD block as freely available content.

API and access evidence:

- No public recipe API was identified in the checked first-party material. [robots.txt](https://www.bbcgoodfood.com/robots.txt) explicitly disallows `/api/*` while allowing the public site paths outside its listed exclusions. Do not build against an undocumented endpoint under that path.
- [The official sitemap](https://www.bbcgoodfood.com/sitemap.xml) exposes recipe URLs, but it is an index for discovery, not a recipe-data API.

Terms evidence:

- BBC Good Food links to [Immediate Media's terms](https://www.immediate.co.uk/terms-and-conditions/). The terms allow access for a user's own personal and non-commercial use and allow adaptation for that same use, but say that copying, storing, distributing, republishing, modifying, or showing content publicly requires prior written permission unless specifically permitted.
- [robots.txt](https://www.bbcgoodfood.com/robots.txt) also publishes `Content-signal: search=yes, ai-train=no`. Treat that as a signal against training or dataset use, not as a license for importing the site's content into a shared service.

Recommended handling: make this a direct, user-initiated HTML import for personal non-commercial use. Preserve the source URL, do not support premium or locked pages, and do not build a background crawler or shared recipe mirror.

### King Arthur Baking

Checked article: [Pain de Campagne (Country Bread)](https://www.kingarthurbaking.com/recipes/pain-de-campagne-country-bread-recipe).

Schema evidence:

- The page returns a public `application/ld+json` `Recipe` object named `Pain de Campagne (Country Bread)`.
- The sample has a two-item yield array, 5 ingredient strings, 17 instructions, `prepTime: PT20M`, `cookTime: PT45M`, and `totalTime: PT21H5M`.

API and access evidence:

- No public recipe API was identified. The checked Drupal endpoints [jsonapi](https://www.kingarthurbaking.com/jsonapi) and [api](https://www.kingarthurbaking.com/api) returned `404`.
- The recipe page returned `200` without an origin error, but no `Access-Control-Allow-Origin` header for `https://kburavskij.github.io`. The browser therefore cannot expose the HTML to the PWA.
- [robots.txt](https://www.kingarthurbaking.com/robots.txt) does not disallow ordinary recipe pages, but robots permission is not a reuse license.

Terms evidence:

- [Terms of Use](https://www.kingarthurbaking.com/policies/terms-of-use) prohibit access to data through automated devices, scripts, bots, spiders, crawlers, or scrapers, and separately prohibit using any means to scrape or crawl web pages.
- The terms also say that King Arthur Baking content may not be reproduced, modified, adapted, made into derivative works, published, distributed, transmitted, sold, licensed, or otherwise exploited without prior written permission.

Recommended handling: do not add this source without written permission and a source-approved API or import arrangement. The public JSON-LD block is not enough.

### Love & Lemons

Checked article: [Easy Pasta Salad](https://www.loveandlemons.com/pasta-salad/).

Schema evidence:

- The page returns a public `application/ld+json` `Recipe` object named `Easy Pasta Salad` with `recipeYield: ["6"]`, `prepTime: PT20M`, `cookTime: PT10M`, `totalTime: PT30M`, `recipeIngredient`, and `recipeInstructions`.
- The page also exposes a WPRM recipe ID `43201` and WordPress post ID `36946` in its public HTML.

First-party API evidence:

- [Direct WordPress post JSON](https://www.loveandlemons.com/wp-json/wp/v2/posts/36946?_fields=id,link,slug,title,content) returned the post content with WPRM ingredient and instruction markup and allowed the tested GitHub Pages origin through CORS.
- The public recipe-box endpoint [recipe/43201](https://www.loveandlemons.com/wp-json/lnl-recipe-box/v1/recipe/43201) returned `401` with `Login required`.
- The REST route index [wp-json](https://www.loveandlemons.com/wp-json/) exposes the `lnl-shortcodes/v1/recipe-index-search` route with a required `q` argument and exposes the recipe-box routes. The tested `?q=pasta` request returned `400 rest_missing_callback_param`, so this route is not a verified URL-to-recipe resolver for the PWA.

Access and policy evidence:

- The article HTML returned no `Access-Control-Allow-Origin`, so its JSON-LD cannot be read directly by the PWA.
- [robots.txt](https://www.loveandlemons.com/robots.txt) permits ordinary paths and names the site's sitemap.
- The checked first-party legal page was the [Privacy Policy](https://www.loveandlemons.com/privacy-policy/). It does not grant a recipe-content reuse license. Treat the API's CORS behavior as a transport fact, not as permission to republish recipes.

Recommended handling: defer until the site supplies a stable public URL-to-post or recipe endpoint and the intended use is cleared. A known-post-ID adapter is technically possible, but it is not enough for a normal user-pasted URL flow.

### TheMealDB

Checked official documentation: [API documentation](https://www.themealdb.com/api.php), [OpenAPI v1](https://www.themealdb.com/api/spec/openapi-v1.yaml), and sample [search response](https://www.themealdb.com/api/json/v1/1/search.php?s=Arrabiata).

API evidence:

- The documentation describes a free recipe API and gives the development key `1` for development or educational use. It documents search, lookup, category, area, ingredient, and random-meal endpoints.
- The sample response is JSON with `idMeal`, `strMeal`, `strCategory`, `strArea`, `strInstructions`, `strMealThumb`, `strIngredient1` through `strIngredient20`, and matching `strMeasure1` through `strMeasure20` slots. The official [agent guide](https://www.themealdb.com/AGENTS.md) says to pair each `strIngredientN` with `strMeasureN`, ignore empty slots, and use lookup by ID for full details.
- The API returned `Access-Control-Allow-Origin: *` for the tested GitHub Pages origin. No HTML scraping is needed.

Terms and robots evidence:

- [robots.txt](https://www.themealdb.com/robots.txt) allows all user agents.
- [Terms of Use](https://www.themealdb.com/terms_of_use.php) allow scraping, copying, and modifying content returned from official API endpoints, but prohibit scraping the website and require copyright or trademark notices to remain intact.
- The terms say the free API is for development projects and that apps published to an app store require a paid subscription. The FAQ also says commercial apps should use the commercial tier. A public GitHub Pages PWA is not an app-store binary, but it is still a public production service, so obtain the appropriate production access before relying on the development key.
- The terms require permission or legal justification for third-party content, prohibit reselling the API, and require attribution for custom artwork. Preserve the source URL, the `strSource` value when present, and TheMealDB attribution.

Recommended handling: make this the first API adapter. Use search followed by lookup, retain source and attribution fields, pair measures by slot, and do not invent quantities where the API leaves them blank.

### Serious Eats and Allrecipes

Checked article URLs:

- [Serious Eats carbonara recipe](https://www.seriouseats.com/pasta-with-carbonara-sauce-recipe)
- [Allrecipes World's Best Lasagna](https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/)

Access evidence:

- Both recipe page requests returned an unauthenticated Cloudflare `402` response during this audit. Earlier direct requests also returned a Cloudflare challenge response. No recipe JSON-LD claim is made for either site because the page body was not available for inspection.
- Both [Serious Eats robots.txt](https://www.seriouseats.com/robots.txt) and [Allrecipes robots.txt](https://www.allrecipes.com/robots.txt) link to [People Inc.'s terms](https://www.people.inc/brands-termsofservice). The robots text says automated data mining, scraping, and dataset creation require prior written permission.
- The People Inc. terms grant only a limited personal, non-commercial license and prohibit automated software, spiders, robots, scrapers, crawlers, data-mining tools, and downloading data from the services. They also prohibit copying or distributing the services and using the data to build a similar or competitive application.

Recommended handling: exclude both from a client-side importer. Revisit only with a written license or a publisher-provided API.

## Parser requirements for the first set

Schema.org `Recipe` is a useful discovery format, not the application's final model. The checked pages use strings for ingredients and arrays for instructions. The parser should:

1. Select a `Recipe` object from a single JSON-LD block or an `@graph`, ignoring `BreadcrumbList`, `WebPage`, and `Organization` objects.
2. Preserve the original source URL, raw ingredient strings, raw instructions, author, image URL, yield, and any `isAccessibleForFree` value.
3. Parse common quantities and units, including fractions, ranges, `x` multipliers, metric and imperial alternatives, and notes. Keep the raw line when the amount cannot be normalized safely.
4. Convert ISO 8601 durations such as `PT1H5M` to minutes, while preserving the original duration string.
5. Handle numeric or array yields. Do not assume that the first numeric value is always the number of servings. King Arthur Baking, for example, reports `["36", "2 large loaves"]`.
6. Treat a missing quantity as unknown, not zero. TheMealDB's paired measure fields may be blank.
7. Put a source link and attribution in the imported recipe. Do not download or rehost source images unless the source terms permit it.

RecipeTin Eats is the exception to the direct JSON-LD path in the first set. Its public WordPress response contains a structured WPRM recipe card instead, so that adapter needs a DOM parser for the `wprm-recipe-*` elements.

## Reproduction notes

The evidence was collected on 2026-10-04 with unauthenticated requests. The CORS checks used this header:

```http
Origin: https://kburavskij.github.io
```

Representative checks:

```sh
curl -L -sS -D - -o /dev/null \
  -H 'Origin: https://kburavskij.github.io' \
  'https://www.bbcgoodfood.com/recipes/chicken-tikka-masala'

curl -L -sS -D - -o /dev/null \
  -H 'Origin: https://kburavskij.github.io' \
  'https://www.recipetineats.com/wp-json/wp/v2/posts?slug=one-pot-chicken-risoni-with-crispy-salami&_fields=id,link,slug,title,content'

curl -L -sS -D - -o /dev/null \
  -H 'Origin: https://kburavskij.github.io' \
  'https://www.themealdb.com/api/json/v1/1/search.php?s=Arrabiata'
```

The audit changed only this research note. No application code or other repository files were edited.
