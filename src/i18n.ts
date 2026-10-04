import type { CountKind as IngredientCountKind, Ingredient, PantryCategory, Recipe, Unit } from './types';
import { canonicalIngredientKey, findIngredientCatalogEntry } from './ingredientCatalog';

export type Language = 'lt' | 'en';

const text: Record<Language, Record<string, string>> = {
  lt: {
    'app.title': 'Cook Radar | Gamink iš to, ką turi',
    'app.tagline': 'Ką gaminsime?',
    'nav.today': 'Šiandien',
    'nav.recipes': 'Receptai',
    'nav.pantry': 'Atsargos',
    'nav.shopping': 'Pirkinių sąrašas',
    'nav.plan': 'Tavo virtuvė',
    'status.online': 'Prisijungta',
    'status.offline': 'Veikia neprisijungus',
    'status.local': 'Išsaugota šiame įrenginyje',
    'status.offlineMessage': 'Nėra ryšio. Pakeitimai išsaugomi šiame įrenginyje.',
    'language.label': 'Kalba',
    'language.lithuanian': 'Lietuvių',
    'language.english': 'English',
    'home.eyebrow': 'Šiandien',
    'home.title': 'Ką gaminame šiandien?',
    'home.lede': 'Pasirink receptą pagal tai, ką jau turi namuose.',
    'home.readyEyebrow': 'Gali gaminti dabar',
    'home.readyTitle': 'Maistas iš tavo atsargų',
    'home.readyBody': 'Šiems receptams nieko papildomai nereikia pirkti.',
    'home.readyEmptyTitle': 'Dar trūksta kelių produktų',
    'home.readyEmptyBody': 'Pridėk namuose turimus produktus ir pamatysi daugiau galimybių.',
    'home.readyAction': 'Rodyti receptus',
    'home.stats.pantry': 'produktų',
    'home.stats.recipes': 'receptų',
    'home.stats.shopping': 'pirkinių',
    'home.sectionTitle': 'Gali gaminti dabar',
    'home.sectionEmpty': 'Receptų sąrašas tuščias',
    'home.sectionEmptyBody': 'Pridėk pirmą receptą, kurį nori išsaugoti.',
    'home.tipTitle': 'Pradėk nuo to, ką turi',
    'home.tipBody': 'Cook Radar parodo, ką gali pagaminti iš namuose turimų produktų.',
    'common.addFood': 'Pridėti produktą',
    'common.addRecipe': 'Pridėti receptą',
    'common.addItem': 'Pridėti produktą',
    'common.viewAll': 'Rodyti daugiau',
    'common.viewRecipes': 'Rodyti visus receptus',
    'common.viewProducts': 'Rodyti visus produktus',
    'common.search': 'Ieškoti',
    'common.ready': 'Galima gaminti',
    'common.makeNow': 'Gaminti dabar',
    'common.allIngredients': 'Turi visas sudedamąsias dalis',
    'common.addMissing': 'Pridėti trūkstamas sudedamąsias dalis',
    'common.missing': 'Trūksta: {n}',
    'common.toBuy': 'pirkinių',
    'common.cancel': 'Atšaukti',
    'common.save': 'Išsaugoti',
    'common.remove': 'Pašalinti',
    'common.edit': 'Redaguoti',
    'common.close': 'Uždaryti',
    'common.clear': 'Išvalyti',
    'common.done': 'Atlikta',
    'common.markBought': 'Pažymėti kaip nupirktą',
    'common.markNotBought': 'Pažymėti kaip nenupirktą',
    'toast.recipeUpdated': 'Receptas atnaujintas.',
    'toast.recipeSaved': 'Receptas išsaugotas.',
    'toast.recipeRemoved': 'Receptas pašalintas.',
    'toast.foodUpdated': 'Produktas atnaujintas.',
    'toast.foodAdded': 'Produktas pridėtas į atsargas.',
    'toast.foodRemoved': 'Produktas pašalintas iš atsargų.',
    'toast.shoppingAdded': 'Pridėta į pirkinių sąrašą.',
    'toast.missingAdded': 'Trūkstami produktai įtraukti į pirkinių sąrašą.',
    'toast.haveEverything': 'Jau turi visas sudedamąsias dalis.',
    'confirm.removeRecipe': 'Pašalinti šį receptą?',
    'recipes.eyebrow': 'Tavo receptai',
    'recipes.title': 'Receptai',
    'recipes.description': 'Išsaugok receptus ir sužinok, ką gali pagaminti šiandien.',
    'recipes.all': 'Visi',
    'recipes.ready': 'Galima gaminti',
    'recipes.favorites': 'Mėgstami',
    'recipes.emptyTitle': 'Receptų dar nėra',
    'recipes.emptyBody': 'Pridėk receptą, kurį nori turėti po ranka.',
    'recipes.noResultsTitle': 'Receptų nerasta',
    'recipes.noResultsBody': 'Pabandyk kitą paiešką arba išvalyk filtrą.',
    'pantry.eyebrow': 'Ką turi namuose',
    'pantry.title': 'Atsargos',
    'pantry.description': 'Namuose turimi produktai ir jų kiekiai.',
    'pantry.emptyTitle': 'Nėra produktų',
    'pantry.emptyBody': 'Pridėk namuose turimus produktus.',
    'pantry.updated': 'Atnaujinta',
    'pantry.useBy': 'Sunaudoti iki',
    'shopping.eyebrow': 'Pirkinių sąrašas',
    'shopping.title': 'Pirkinių sąrašas',
    'shopping.description': 'Čia matysi receptams trūkstamus produktus.',
    'shopping.open': 'Liko nupirkti',
    'shopping.emptyTitle': 'Pirkinių sąrašas tuščias',
    'shopping.emptyBody': 'Kai receptui ko nors trūks, pridėk tai į pirkinių sąrašą.',
    'shopping.allDone': 'Viskas nupirkta',
    'shopping.allDoneBody': 'Gali planuoti kitą patiekalą.',
    'shopping.bought': 'Nupirkta',
    'shopping.clearBought': 'Pašalinti nupirktus produktus',
    'shopping.fromRecipe': 'Pagal receptą:',
    'shopping.addedByYou': 'Pridėta rankiniu būdu',
    'modal.recipeDetails': 'Recepto informacija',
    'modal.newRecipe': 'Naujas receptas',
    'modal.editRecipe': 'Redaguoti receptą',
    'recipeSource.title': 'Pridėti receptą',
    'recipeSource.description': 'Pasirink, kaip nori pridėti receptą.',
    'recipeSource.import': 'Importuoti iš nuorodos',
    'recipeSource.importDescription': 'Įklijuok recepto nuorodą, patikrink duomenis ir išsaugok receptą.',
    'recipeSource.manual': 'Įvesti rankiniu būdu',
    'recipeSource.manualDescription': 'Užpildyk laukus ir sukurk receptą.',
    'import.title': 'Importuoti receptą',
    'import.description': 'Įklijuok recepto nuorodą. Importuotus duomenis galėsi patikrinti ir pataisyti redaktoriuje.',
    'import.urlLabel': 'Recepto nuoroda',
    'import.urlPlaceholder': 'https://www.recipetineats.com/...',
    'import.sources': 'Palaikomos svetainės',
    'import.sourceLanguage': 'Recepto pavadinimas ir eiga lieka originalo kalba. Produktų pavadinimai ir kiekiai suvienodinami, o prieš išsaugant juos gali pataisyti.',
    'import.usageNotice': 'Importuok receptus asmeniniam naudojimui. Šaltinio nuoroda išsaugoma kartu su receptu.',
    'import.submit': 'Importuoti receptą',
    'import.loading': 'Importuojamas receptas...',
    'import.error.invalidUrl': 'Įklijuok galiojančią HTTPS nuorodą į konkretų recepto puslapį.',
    'import.error.unsupported': 'Ši svetainė dar nepalaikoma. Pasirink vieną iš palaikomų svetainių.',
    'import.error.notFound': 'Pagal šią nuorodą recepto rasti nepavyko. Patikrink, ar tai konkretaus recepto puslapis.',
    'import.error.network': 'Nepavyko pasiekti svetainės. Patikrink ryšį ir bandyk dar kartą.',
    'import.error.parse': 'Šiame puslapyje nepavyko rasti recepto duomenų.',
    'import.error.restricted': 'Šio recepto negalima importuoti, nes jis nėra laisvai prieinamas.',
    'import.error.generic': 'Nepavyko importuoti recepto. Pabandyk kitą nuorodą.',
    'import.manual': 'Įvesti rankiniu būdu',
    'modal.newFood': 'Pridėti produktą',
    'modal.editFood': 'Redaguoti produktą',
    'modal.newShopping': 'Pridėti į pirkinių sąrašą',
    'form.recipeName': 'Recepto pavadinimas',
    'form.category': 'Kategorija',
    'form.description': 'Trumpas aprašymas',
    'form.minutes': 'Gaminimo laikas (min.)',
    'form.servings': 'Porcijos',
    'form.foodName': 'Produkto pavadinimas',
    'form.quantity': 'Kiekis',
    'form.unit': 'Vienetas',
    'form.expiry': 'Sunaudoti iki',
    'form.optional': 'nebūtina',
    'form.ingredients': 'Sudedamosios dalys',
    'form.ingredientsHint': 'Importuoti kiekiai suvienodinami į g, ml ir aiškius vienetus. Prieš išsaugodamas patikrink neaiškius kiekius.',
    'form.method': 'Gaminimo eiga',
    'form.methodHint': 'Kiekviename žingsnyje aprašyk vieną veiksmą.',
    'form.addIngredient': 'Pridėti sudedamąją dalį',
    'form.addStep': 'Pridėti žingsnį',
    'form.stepPlaceholder': 'Kas vyksta toliau?',
    'form.invalidRecipeName': 'Įrašyk recepto pavadinimą.',
    'form.invalidIngredient': 'Pridėk bent vieną sudedamąją dalį.',
    'form.invalidStep': 'Pridėk bent vieną gaminimo žingsnį.',
    'form.invalidFoodName': 'Įrašyk produkto pavadinimą.',
    'form.invalidQuantity': 'Kiekis turi būti didesnis už nulį.',
    'detail.ingredients': 'Sudedamosios dalys',
    'detail.method': 'Gaminimo eiga',
    'detail.optional': 'nebūtina',
    'detail.amountUnknown': 'pagal poreikį',
    'detail.haveEverything': 'Turi visas sudedamąsias dalis',
    'detail.steps': 'žingsniai',
    'detail.servings': 'porc.',
    'detail.source': 'Šaltinis',
    'detail.viewSource': 'Atidaryti receptą',
  },
  en: {
    'app.title': 'Cook Radar | Cook with what you have',
    'app.tagline': 'What are we cooking?',
    'nav.today': 'Today',
    'nav.recipes': 'Recipes',
    'nav.pantry': 'Pantry',
    'nav.shopping': 'Shopping list',
    'nav.plan': 'Your kitchen',
    'status.online': 'Online',
    'status.offline': 'Working offline',
    'status.local': 'Saved on this device',
    'status.offlineMessage': 'No connection. Changes stay on this device.',
    'language.label': 'Language',
    'language.lithuanian': 'Lietuvių',
    'language.english': 'English',
    'home.eyebrow': 'TODAY',
    'home.title': 'What are we cooking today?',
    'home.lede': 'Choose a recipe based on what you already have at home.',
    'home.readyEyebrow': 'READY TO COOK',
    'home.readyTitle': 'Food from your pantry',
    'home.readyBody': 'These recipes need no extra shopping.',
    'home.readyEmptyTitle': 'A few items are missing',
    'home.readyEmptyBody': 'Add what you have at home to see more options.',
    'home.readyAction': 'Browse recipes',
    'home.stats.pantry': 'items',
    'home.stats.recipes': 'recipes',
    'home.stats.shopping': 'to buy',
    'home.sectionTitle': 'Ready to cook',
    'home.sectionEmpty': 'Your recipe shelf is empty',
    'home.sectionEmptyBody': 'Add a recipe you want to remember.',
    'home.tipTitle': 'Start with what you have',
    'home.tipBody': 'Cook Radar shows what you can make from your current stock.',
    'common.addFood': 'Add food',
    'common.addRecipe': 'Add recipe',
    'common.addItem': 'Add item',
    'common.viewAll': 'View all',
    'common.viewRecipes': 'View all recipes',
    'common.viewProducts': 'View all products',
    'common.search': 'Search',
    'common.ready': 'Ready to cook',
    'common.makeNow': 'Make this now',
    'common.allIngredients': 'All ingredients',
    'common.addMissing': 'Add missing',
    'common.missing': '{n} missing',
    'common.toBuy': 'to buy',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.remove': 'Remove',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.clear': 'Clear',
    'common.done': 'Done',
    'common.markBought': 'Mark as bought',
    'common.markNotBought': 'Mark as not bought',
    'toast.recipeUpdated': 'Recipe updated.',
    'toast.recipeSaved': 'Recipe saved.',
    'toast.recipeRemoved': 'Recipe removed.',
    'toast.foodUpdated': 'Food updated.',
    'toast.foodAdded': 'Added to your pantry.',
    'toast.foodRemoved': 'Removed from your pantry.',
    'toast.shoppingAdded': 'Added to your shopping list.',
    'toast.missingAdded': '{n} {word} added to your shopping list.',
    'toast.haveEverything': 'You already have everything.',
    'confirm.removeRecipe': 'Remove this recipe?',
    'recipes.eyebrow': 'YOUR COLLECTION',
    'recipes.title': 'Recipes',
    'recipes.description': 'Save recipes and see what you can cook today.',
    'recipes.all': 'All',
    'recipes.ready': 'Ready now',
    'recipes.favorites': 'Favourites',
    'recipes.emptyTitle': 'No recipes yet',
    'recipes.emptyBody': 'Add a recipe you want to keep close.',
    'recipes.noResultsTitle': 'No recipes found',
    'recipes.noResultsBody': 'Try another search or clear the filter.',
    'pantry.eyebrow': 'WHAT YOU HAVE',
    'pantry.title': 'Pantry',
    'pantry.description': 'A simple list of food at home with metric quantities.',
    'pantry.emptyTitle': 'Your pantry is empty',
    'pantry.emptyBody': 'Add the food you already have at home.',
    'pantry.updated': 'Updated',
    'pantry.useBy': 'Use by',
    'shopping.eyebrow': 'NEXT SHOP',
    'shopping.title': 'Shopping list',
    'shopping.description': 'Missing ingredients from your recipes in one place.',
    'shopping.open': 'left to buy',
    'shopping.emptyTitle': 'Your list is clear',
    'shopping.emptyBody': 'When a recipe needs something, add it here.',
    'shopping.allDone': 'All bought',
    'shopping.allDoneBody': 'You can plan the next meal.',
    'shopping.bought': 'Bought',
    'shopping.clearBought': 'Clear bought',
    'shopping.fromRecipe': 'For',
    'shopping.addedByYou': 'Added by you',
    'modal.recipeDetails': 'RECIPE DETAILS',
    'modal.newRecipe': 'New recipe',
    'modal.editRecipe': 'Edit recipe',
    'recipeSource.title': 'Add a recipe',
    'recipeSource.description': 'Choose how you want to add the recipe.',
    'recipeSource.import': 'Import from a link',
    'recipeSource.importDescription': 'Paste a recipe link and check the details before saving.',
    'recipeSource.manual': 'Enter manually',
    'recipeSource.manualDescription': 'Create the recipe by filling in the fields yourself.',
    'import.title': 'Import a recipe',
    'import.description': 'Paste a recipe link. You can check and edit the imported data before saving.',
    'import.urlLabel': 'Recipe link',
    'import.urlPlaceholder': 'https://www.recipetineats.com/...',
    'import.sources': 'Supported websites',
    'import.sourceLanguage': 'The recipe title and method stay in the source language. Ingredient names and quantities are normalized before you save them.',
    'import.usageNotice': 'Import recipes for personal use. The source link is saved with the recipe.',
    'import.submit': 'Import recipe',
    'import.loading': 'Importing recipe...',
    'import.error.invalidUrl': 'Paste a valid HTTPS link to a specific recipe.',
    'import.error.unsupported': 'This website is not supported yet. Choose one of the supported websites.',
    'import.error.notFound': 'We could not find a recipe at that link. Check that it is a specific recipe page.',
    'import.error.network': 'We could not reach the website. Check your connection and try again.',
    'import.error.parse': 'We could not find recipe data on that page.',
    'import.error.restricted': 'This recipe is not freely available to import.',
    'import.error.generic': 'The recipe could not be imported. Try another link.',
    'import.manual': 'Enter manually',
    'modal.newFood': 'Add food',
    'modal.editFood': 'Edit food',
    'modal.newShopping': 'Add to shopping list',
    'form.recipeName': 'Recipe name',
    'form.category': 'Category',
    'form.description': 'Short description',
    'form.minutes': 'Time in minutes',
    'form.servings': 'Servings',
    'form.foodName': 'Food name',
    'form.quantity': 'Quantity',
    'form.unit': 'Unit',
    'form.expiry': 'Use by',
    'form.optional': 'optional',
    'form.ingredients': 'Ingredients',
    'form.ingredientsHint': 'Imported quantities use grams, millilitres, and clear count units. Check any unknown amounts before saving.',
    'form.method': 'Method',
    'form.methodHint': 'Keep one short action per step.',
    'form.addIngredient': 'Add ingredient',
    'form.addStep': 'Add step',
    'form.stepPlaceholder': 'What happens next?',
    'form.invalidRecipeName': 'Add a name for this recipe.',
    'form.invalidIngredient': 'Add at least one ingredient.',
    'form.invalidStep': 'Add at least one method step.',
    'form.invalidFoodName': 'Add a name for this food.',
    'form.invalidQuantity': 'Quantity must be more than zero.',
    'detail.ingredients': 'Ingredients',
    'detail.method': 'Method',
    'detail.optional': 'optional',
    'detail.amountUnknown': 'as needed',
    'detail.haveEverything': 'You have everything',
    'detail.steps': 'steps',
    'detail.servings': 'servings',
    'detail.source': 'Source',
    'detail.viewSource': 'Open recipe',
  },
};

const foodNames: Record<string, string> = {
  spaghetti: 'Spagečiai',
  courgette: 'Cukinija',
  garlic: 'Česnakas',
  lemon: 'Citrina',
  'cooking cream': 'Grietinėlė',
  parmesan: 'Parmezanas',
  'olive oil': 'Alyvuogių aliejus',
  salt: 'Druska',
  'red lentils': 'Raudonieji lęšiai',
  'chopped tomatoes': 'Smulkinti pomidorai',
  'yellow onion': 'Svogūnas',
  carrot: 'Morka',
  'vegetable stock': 'Daržovių sultinys',
  'ground cumin': 'Maltas kuminas',
  'baby spinach': 'Špinatai',
  chickpeas: 'Avinžirniai',
  flatbread: 'Paplotėliai',
  cucumber: 'Agurkas',
  'greek yoghurt': 'Graikiškas jogurtas',
  'red onion': 'Raudonasis svogūnas',
  'smoked paprika': 'Rūkyta paprika',
  'salmon fillets': 'Lašišos filė',
  'baby potatoes': 'Mažos bulvės',
  broccoli: 'Brokolis',
  'miso paste': 'Miso pasta',
  honey: 'Medus',
  'sesame seeds': 'Sezamo sėklos',
  'coffee beans': 'Kavos pupelės',
  bananas: 'Bananai',
};

const englishAliases: Record<string, string> = Object.keys(foodNames).reduce((aliases, english) => {
  aliases[english] = english;
  aliases[foodNames[english].toLowerCase()] = english;
  return aliases;
}, {} as Record<string, string>);

const recipeCopy: Record<string, Partial<Record<Language, { title: string; description: string; category: string; tags: string[]; steps: string[] }>>> = {
  'recipe-pasta': {
    lt: { title: 'Kreminiai citrininiai makaronai', description: 'Švelnaus skonio makaronai greitai vakarienei.', category: 'Greita vakarienė', tags: ['Vegetariška', '20 min'], steps: ['Išvirk spagečius pasūdytame vandenyje, kol suminkštės. Pasilik 100 ml makaronų virimo vandens.', 'Apkepk cukiniją ir česnaką alyvuogių aliejuje, kol suminkštės ir lengvai paruduos.', 'Įmaišyk grietinėlę, citrinos žievelę ir pusę parmezano. Praskiesk makaronų virimo vandeniu.', 'Sumaišyk su makaronais, pagardink citrinos sultimis ir patiek su likusiu parmezanu.'] },
  },
  'recipe-stew': {
    lt: { title: 'Lęšių troškinys su pomidorais', description: 'Vieno puodo patiekalas, kurio užteks ir rytojaus pietums.', category: 'Vienas puodas', tags: ['Veganiška', 'Daugiau porcijų'], steps: ['Svogūną ir morkas pakepink su kuminu, kol svogūnas suminkštės.', 'Sudėk lęšius, pomidorus ir sultinį. Užvirk.', 'Virk 25 minutes, kol lęšiai suminkštės.', 'Jei nori, įmaišyk špinatus. Pagardink pagal skonį ir patiek su duona arba ryžiais.'] },
  },
  'recipe-wraps': {
    lt: { title: 'Paplotėliai su avinžirniais', description: 'Traškūs avinžirniai, gaivus jogurtas ir šviežios daržovės šiltame paplotėlyje.', category: 'Greiti pietūs', tags: ['Vegetariška', 'Daug skaidulų'], steps: ['Avinžirnius sumaišyk su aliejumi, rūkyta paprika ir žiupsniu druskos.', 'Kepk orkaitėje arba keptuvėje, kol kraštai taps traškūs.', 'Jogurtą sumaišyk su citrinos sultimis ir druska. Supjaustyk agurką ir svogūną.', 'Pašildyk paplotėlius ir pripildyk jogurto, daržovių bei avinžirnių.'] },
  },
  'recipe-salmon': {
    lt: {
      title: 'Vienoje skardoje kepta lašiša',
      description: 'Lašiša ir daržovės vienoje skardoje su saldžiai sūriu padažu.',
      category: 'Vakarienė',
      tags: ['Pescetariška', 'Viena skarda'],
      steps: [
        'Įkaitink orkaitę iki 210 °C. Kepk perpjautas bulves su aliejumi 18 minučių.',
        'Miso pastą, medų ir šlakelį vandens sumaišyk į padažą.',
        'Į skardą sudėk brokolį ir lašišą. Lašišą aptepk padažu.',
        'Kepk dar 10–12 minučių. Jei nori, pabarstyk sezamų sėklomis.',
      ],
    },
  },
};

type CountKind = 'product' | 'recipe' | 'shopping' | 'component' | 'step';
type CountCase = 'nominative' | 'genitive' | 'accusative';
type CountForms = { one: string; few: string; many: string };

const countForm = (count: number): keyof CountForms => {
  const absolute = Math.abs(count);
  const lastTwo = absolute % 100;
  const lastDigit = absolute % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return 'many';
  if (lastDigit === 1) return 'one';
  if (lastDigit >= 2 && lastDigit <= 9) return 'few';
  return 'many';
};

const lithuanianCountForms: Record<CountKind, Record<CountCase, CountForms>> = {
  product: {
    nominative: { one: 'produktas', few: 'produktai', many: 'produktų' },
    genitive: { one: 'produkto', few: 'produktų', many: 'produktų' },
    accusative: { one: 'produktą', few: 'produktus', many: 'produktų' },
  },
  recipe: {
    nominative: { one: 'receptas', few: 'receptai', many: 'receptų' },
    genitive: { one: 'recepto', few: 'receptų', many: 'receptų' },
    accusative: { one: 'receptą', few: 'receptus', many: 'receptų' },
  },
  shopping: {
    nominative: { one: 'pirkinys', few: 'pirkiniai', many: 'pirkinių' },
    genitive: { one: 'pirkinio', few: 'pirkinių', many: 'pirkinių' },
    accusative: { one: 'pirkinį', few: 'pirkinius', many: 'pirkinių' },
  },
  component: {
    nominative: { one: 'sudedamoji dalis', few: 'sudedamosios dalys', many: 'sudedamųjų dalių' },
    genitive: { one: 'sudedamosios dalies', few: 'sudedamųjų dalių', many: 'sudedamųjų dalių' },
    accusative: { one: 'sudedamąją dalį', few: 'sudedamąsias dalis', many: 'sudedamųjų dalių' },
  },
  step: {
    nominative: { one: 'žingsnis', few: 'žingsniai', many: 'žingsnių' },
    genitive: { one: 'žingsnio', few: 'žingsnių', many: 'žingsnių' },
    accusative: { one: 'žingsnį', few: 'žingsnius', many: 'žingsnių' },
  },
};

export const countWord = (count: number, kind: CountKind, language: Language, grammaticalCase: CountCase = 'nominative') => {
  if (language === 'en') {
    if (kind === 'product') return count === 1 ? 'item' : 'items';
    if (kind === 'recipe') return count === 1 ? 'recipe' : 'recipes';
    if (kind === 'shopping') return 'to buy';
    if (kind === 'component') return count === 1 ? 'ingredient' : 'ingredients';
    return count === 1 ? 'step' : 'steps';
  }
  return lithuanianCountForms[kind][grammaticalCase][countForm(count)];
};

export const formatMissingCount = (count: number, language: Language) => language === 'lt'
  ? `Trūksta ${count} ${countWord(count, 'product', language, 'genitive')}`
  : tr(language, 'common.missing', { n: count });

export const formatReadyRecipeCount = (count: number, language: Language) => language === 'lt'
  ? `Paruošta receptų: ${count}`
  : `${count} recipe${count === 1 ? '' : 's'} ready now`;

export const formatShoppingOpenCount = (count: number, language: Language) => language === 'lt'
  ? `Liko nupirkti ${count} ${countWord(count, 'product', language, 'accusative')}`
  : `${count} ${tr(language, 'shopping.open')}`;

export const formatStepCount = (count: number, language: Language) => language === 'lt'
  ? `Žingsnių: ${count}`
  : `${count} ${count === 1 ? 'step' : 'steps'}`;

export const formatMissingAdded = (count: number, language: Language) => {
  if (language === 'en') return `${count} ingredient${count === 1 ? '' : 's'} added to your shopping list.`;
  const form = countForm(count);
  if (form === 'one') return `Į pirkinių sąrašą įtrauktas ${count} trūkstamas produktas.`;
  if (form === 'few') return `Į pirkinių sąrašą įtraukti ${count} trūkstami produktai.`;
  return `Į pirkinių sąrašą įtraukta ${count} trūkstamų produktų.`;
};

export const tr = (language: Language, key: string, values: Record<string, string | number> = {}) => {
  const value = text[language][key] ?? text.en[key] ?? key;
  return Object.entries(values).reduce((result, [name, replacement]) => result.replace(`{${name}}`, String(replacement)), value);
};

export const normalizeFoodName = (name: string) => {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
  return canonicalIngredientKey(name) ?? englishAliases[normalized] ?? normalized;
};

export const foodLabel = (name: string, language: Language) => {
  const catalogEntry = findIngredientCatalogEntry(name);
  if (catalogEntry) return language === 'lt' ? catalogEntry.labelLt : catalogEntry.canonicalName;
  const canonical = normalizeFoodName(name);
  return language === 'lt' ? foodNames[canonical] ?? name : canonical.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const categoryLabel = (category: PantryCategory, language: Language) => {
  if (language === 'en') return category;
  return ({ Produce: 'Daržovės', Dairy: 'Pieno produktai', 'Dry goods': 'Sausi produktai', Protein: 'Baltymai', Seasoning: 'Prieskoniai', Other: 'Kita' })[category];
};

const lithuanianUnits: Record<Unit, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  pcs: 'vnt.',
  tsp: 'a. š.',
  tbsp: 'v. š.',
};

export const unitLabel = (unit: Unit, language: Language) => language === 'lt' ? lithuanianUnits[unit] : unit;

const countKindWords: Record<Exclude<IngredientCountKind, 'unknown'>, { en: [string, string]; lt: [string, string] }> = {
  whole: { en: ['whole', 'whole'], lt: ['vnt.', 'vnt.'] },
  clove: { en: ['clove', 'cloves'], lt: ['skiltelė', 'skiltelės'] },
  can: { en: ['can', 'cans'], lt: ['skardinė', 'skardinės'] },
  jar: { en: ['jar', 'jars'], lt: ['stiklainis', 'stiklainiai'] },
  bottle: { en: ['bottle', 'bottles'], lt: ['butelis', 'buteliai'] },
  packet: { en: ['packet', 'packets'], lt: ['pakelis', 'pakeliai'] },
  bag: { en: ['bag', 'bags'], lt: ['maišelis', 'maišeliai'] },
  box: { en: ['box', 'boxes'], lt: ['dėžutė', 'dėžutės'] },
  bunch: { en: ['bunch', 'bunches'], lt: ['ryšulėlis', 'ryšulėliai'] },
  head: { en: ['head', 'heads'], lt: ['galvutė', 'galvutės'] },
  stalk: { en: ['stalk', 'stalks'], lt: ['stiebas', 'stiebai'] },
  sprig: { en: ['sprig', 'sprigs'], lt: ['šakelė', 'šakelės'] },
  slice: { en: ['slice', 'slices'], lt: ['riekelė', 'riekelės'] },
  fillet: { en: ['fillet', 'fillets'], lt: ['filė', 'filė'] },
  breast: { en: ['breast', 'breasts'], lt: ['krūtinėlė', 'krūtinėlės'] },
  thigh: { en: ['thigh', 'thighs'], lt: ['šlaunelė', 'šlaunelės'] },
  leaf: { en: ['leaf', 'leaves'], lt: ['lapas', 'lapai'] },
  strip: { en: ['strip', 'strips'], lt: ['juostelė', 'juostelės'] },
  egg: { en: ['egg', 'eggs'], lt: ['kiaušinis', 'kiaušiniai'] },
  piece: { en: ['piece', 'pieces'], lt: ['vnt.', 'vnt.'] },
};

export const countKindLabel = (kind: IngredientCountKind | undefined, amount: number, language: Language) => {
  if (!kind || kind === 'unknown' || kind === 'whole') return unitLabel('pcs', language);
  const words = countKindWords[kind][language];
  return words[amount === 1 ? 0 : 1];
};

export const recipeText = (recipe: Recipe, language: Language) => {
  const localized = recipeCopy[recipe.id]?.[language];
  return {
    title: localized?.title ?? recipe.title,
    description: localized?.description ?? recipe.description,
    category: localized?.category ?? recipe.category,
    tags: localized?.tags ?? recipe.tags,
    steps: localized?.steps ?? recipe.steps,
  };
};

export const ingredientLabel = (ingredient: Ingredient, language: Language) => foodLabel(ingredient.name, language);
