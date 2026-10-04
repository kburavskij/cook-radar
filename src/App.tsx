import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { loadPantry, loadRecipes, loadShopping, savePantry, saveRecipes, saveShopping } from './storage';
import type { Ingredient, PantryCategory, PantryDraft, PantryItem, Recipe, RecipeDraft, ShoppingDraft, ShoppingItem, Tab, Unit } from './types';
import { UNITS } from './types';
import { addOrMergeShopping, formatAmount, formatDate, getMissingIngredients, getRecipeStatus, makeId, normalize } from './utils';

type IconName =
  | 'home'
  | 'book'
  | 'pantry'
  | 'list'
  | 'plus'
  | 'search'
  | 'clock'
  | 'check'
  | 'chevron'
  | 'heart'
  | 'more'
  | 'close'
  | 'trash'
  | 'edit'
  | 'spark'
  | 'arrow'
  | 'refresh'
  | 'calendar'
  | 'filter'
  | 'minus'
  | 'info';

const icons: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v10h14V9" /><path d="M9 19v-6h6v6" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M8 7h8M8 10h6" /></>,
  pantry: <><path d="M4 6h16" /><path d="M5 6v13h14V6" /><path d="M8 3h8v3H8z" /><path d="M8 10h8M8 14h5" /></>,
  list: <><path d="M8 6h12M8 12h12M8 18h12" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m8 10 4 4 4-4" />,
  heart: <path d="M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  trash: <><path d="M4 7h16M10 11v5M14 11v5" /><path d="m6 7 1 13h10l1-13M9 7V4h6v3" /></>,
  edit: <><path d="m4 16-.8 4.8L8 20l11.5-11.5a2.1 2.1 0 0 0-3-3L5 17Z" /><path d="m14.5 7.5 3 3" /></>,
  spark: <><path d="m12 3 1.2 4.3L17.5 9l-4.3 1.2L12 14.5l-1.2-4.3L6.5 9l4.3-1.7L12 3Z" /><path d="m19 15 .6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15Z" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.8-3L4 10" /><path d="M4 5v5h5" /><path d="M4 13a8 8 0 0 0 14.8 3L20 14" /><path d="M20 19v-5h-5" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
  minus: <path d="M5 12h14" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7h.01" /></>,
};

function Icon({ name, size = 20, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" className="icon" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}>
      {icons[name]}
    </svg>
  );
}

const navItems: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Overview', icon: 'home' },
  { id: 'recipes', label: 'Recipes', icon: 'book' },
  { id: 'pantry', label: 'Pantry', icon: 'pantry' },
  { id: 'shopping', label: 'Shopping list', icon: 'list' },
];

const emptyRecipe: RecipeDraft = {
  title: '',
  description: '',
  minutes: 30,
  servings: 2,
  category: 'Dinner',
  tags: ['Homemade'],
  accent: 'sage',
  icon: '🍲',
  favorite: false,
  ingredients: [
    { id: makeId('ingredient'), name: '', amount: 1, unit: 'pcs', category: 'Produce' },
  ],
  steps: [''],
};

const emptyPantry: PantryDraft = {
  name: '',
  quantity: 1,
  unit: 'pcs',
  category: 'Produce',
  expiresAt: '',
};

const emptyShopping: ShoppingDraft = {
  name: '',
  amount: 1,
  unit: 'pcs',
  category: 'Other',
};

const categoryOptions: PantryCategory[] = ['Produce', 'Dairy', 'Dry goods', 'Protein', 'Seasoning', 'Other'];

const dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes);
  const [pantry, setPantry] = useState<PantryItem[]>(loadPantry);
  const [shopping, setShopping] = useState<ShoppingItem[]>(loadShopping);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [recipeFilter, setRecipeFilter] = useState<'all' | 'ready' | 'favorites'>('all');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [pantrySearch, setPantrySearch] = useState('');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | 'new' | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [editingPantry, setEditingPantry] = useState<PantryItem | 'new' | null>(null);
  const [showShoppingEditor, setShowShoppingEditor] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => saveRecipes(recipes), [recipes]);
  useEffect(() => savePantry(pantry), [pantry]);
  useEffect(() => saveShopping(shopping), [shopping]);

  useEffect(() => {
    const setConnection = () => setOnline(navigator.onLine);
    window.addEventListener('online', setConnection);
    window.addEventListener('offline', setConnection);
    return () => {
      window.removeEventListener('online', setConnection);
      window.removeEventListener('offline', setConnection);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let registration: ServiceWorkerRegistration | undefined;
    let interval: number | undefined;
    navigator.serviceWorker.register('./sw.js').then((registered) => {
      registration = registered;
      interval = window.setInterval(() => registration?.update(), 30 * 60 * 1000);
    }).catch(() => undefined);
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => current === message ? null : current), 2800);
  };

  const recipeStatus = useMemo(() => new Map(recipes.map((recipe) => [recipe.id, getRecipeStatus(recipe, pantry)])), [recipes, pantry]);
  const readyRecipes = useMemo(() => recipes.filter((recipe) => recipeStatus.get(recipe.id)?.ready), [recipes, recipeStatus]);
  const pendingShopping = shopping.filter((item) => !item.checked);

  const filteredRecipes = useMemo(() => {
    const search = normalize(recipeSearch);
    return recipes.filter((recipe) => {
      const matchesSearch = !search || [recipe.title, recipe.description, ...recipe.tags].some((value) => normalize(value).includes(search));
      const matchesFilter = recipeFilter === 'all' || (recipeFilter === 'ready' ? recipeStatus.get(recipe.id)?.ready : recipe.favorite);
      return matchesSearch && matchesFilter;
    });
  }, [recipeFilter, recipeSearch, recipes, recipeStatus]);

  const filteredPantry = useMemo(() => {
    const search = normalize(pantrySearch);
    return pantry.filter((item) => !search || normalize(item.name).includes(search) || normalize(item.category).includes(search));
  }, [pantry, pantrySearch]);

  const updateTab = (tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addMissingToShopping = (recipe: Recipe) => {
    const missing = getMissingIngredients(recipe, pantry);
    setShopping((current) => missing.reduce((list, ingredient) => addOrMergeShopping(list, ingredient, recipe.id), current));
    if (missing.length) showToast(`${missing.length} ${missing.length === 1 ? 'ingredient' : 'ingredients'} added to your shopping list.`);
    else showToast('You already have everything for this recipe.');
  };

  const saveRecipe = (draft: RecipeDraft, existing: Recipe | null) => {
    if (existing) {
      setRecipes((current) => current.map((recipe) => recipe.id === existing.id ? { ...draft, id: existing.id, createdAt: existing.createdAt } : recipe));
      showToast('Recipe updated.');
    } else {
      setRecipes((current) => [{ ...draft, id: makeId('recipe'), createdAt: new Date().toISOString() }, ...current]);
      showToast('Recipe saved.');
    }
    setEditingRecipe(null);
  };

  const deleteRecipe = (recipe: Recipe) => {
    if (!window.confirm(`Remove “${recipe.title}” from your recipes?`)) return;
    setRecipes((current) => current.filter((item) => item.id !== recipe.id));
    setViewingRecipe(null);
    showToast('Recipe removed.');
  };

  const toggleFavorite = (recipe: Recipe) => {
    const updated = { ...recipe, favorite: !recipe.favorite };
    setRecipes((current) => current.map((item) => item.id === recipe.id ? updated : item));
    setViewingRecipe((current) => current?.id === recipe.id ? updated : current);
  };

  const savePantryItem = (draft: PantryDraft, existing: PantryItem | null) => {
    const updatedAt = new Date().toISOString();
    if (existing) {
      setPantry((current) => current.map((item) => item.id === existing.id ? { ...draft, id: existing.id, updatedAt } : item));
      showToast('Pantry item updated.');
    } else {
      setPantry((current) => [{ ...draft, id: makeId('pantry'), updatedAt }, ...current]);
      showToast('Added to your pantry.');
    }
    setEditingPantry(null);
  };

  const removePantryItem = (item: PantryItem) => {
    setPantry((current) => current.filter((entry) => entry.id !== item.id));
    showToast(`${item.name} removed from your pantry.`);
  };

  const addShoppingItem = (draft: ShoppingDraft) => {
    setShopping((current) => [...current, { ...draft, id: makeId('shopping'), checked: false, sourceRecipeIds: [] }]);
    setShowShoppingEditor(false);
    showToast('Added to your shopping list.');
  };

  const page = activeTab === 'home'
    ? <HomePage readyRecipes={readyRecipes} recipes={recipes} recipeStatus={recipeStatus} pantryCount={pantry.length} shoppingCount={pendingShopping.length} onAddMissing={addMissingToShopping} onOpenRecipe={setViewingRecipe} onOpenRecipes={() => updateTab('recipes')} onOpenPantry={() => updateTab('pantry')} onOpenShopping={() => updateTab('shopping')} />
    : activeTab === 'recipes'
      ? <RecipesPage recipes={filteredRecipes} recipeStatus={recipeStatus} filter={recipeFilter} search={recipeSearch} onFilter={setRecipeFilter} onSearch={setRecipeSearch} onAddRecipe={() => setEditingRecipe('new')} onOpenRecipe={setViewingRecipe} onAddMissing={addMissingToShopping} onToggleFavorite={toggleFavorite} />
      : activeTab === 'pantry'
        ? <PantryPage pantry={filteredPantry} search={pantrySearch} onSearch={setPantrySearch} onAdd={() => setEditingPantry('new')} onEdit={setEditingPantry} onRemove={removePantryItem} />
        : <ShoppingPage shopping={shopping} recipes={recipes} onToggle={(id) => setShopping((current) => current.map((item) => item.id === id ? { ...item, checked: !item.checked } : item))} onRemove={(id) => setShopping((current) => current.filter((item) => item.id !== id))} onClearChecked={() => setShopping((current) => current.filter((item) => !item.checked))} onAdd={() => setShowShoppingEditor(true)} />;

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} pendingShopping={pendingShopping.length} onChange={updateTab} />
      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">m</span><span>mise</span></div>
          <div className={`connection-pill ${online ? 'is-online' : 'is-offline'}`} aria-live="polite">
            <span className="connection-dot" />
            {online ? 'Online' : 'Working offline'}
          </div>
          <button className="topbar-add" onClick={() => setEditingPantry('new')}><Icon name="plus" size={18} /><span>Add food</span></button>
        </header>
        {!online && <div className="offline-banner"><Icon name="info" size={17} /><span>No connection. Changes stay on this device and sync can be added later.</span></div>}
        <div className="page-shell">{page}</div>
      </main>
      <MobileNav activeTab={activeTab} pendingShopping={pendingShopping.length} onChange={updateTab} />

      {viewingRecipe && <RecipeDetails recipe={viewingRecipe} status={recipeStatus.get(viewingRecipe.id)!} onClose={() => setViewingRecipe(null)} onEdit={() => { setEditingRecipe(viewingRecipe); setViewingRecipe(null); }} onDelete={() => deleteRecipe(viewingRecipe)} onAddMissing={() => addMissingToShopping(viewingRecipe)} onToggleFavorite={() => toggleFavorite(viewingRecipe)} />}
      {editingRecipe && <RecipeEditor key={editingRecipe === 'new' ? 'new' : editingRecipe.id} recipe={editingRecipe === 'new' ? null : editingRecipe} onClose={() => setEditingRecipe(null)} onSave={(draft) => saveRecipe(draft, editingRecipe === 'new' ? null : editingRecipe)} />}
      {editingPantry && <PantryEditor key={editingPantry === 'new' ? 'new' : editingPantry.id} item={editingPantry === 'new' ? null : editingPantry} onClose={() => setEditingPantry(null)} onSave={(draft) => savePantryItem(draft, editingPantry === 'new' ? null : editingPantry)} />}
      {showShoppingEditor && <ShoppingEditor onClose={() => setShowShoppingEditor(false)} onSave={addShoppingItem} />}
      {toast && <div className="toast" role="status"><Icon name="check" size={18} />{toast}</div>}
    </div>
  );
}

function Sidebar({ activeTab, pendingShopping, onChange }: { activeTab: Tab; pendingShopping: number; onChange: (tab: Tab) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand-lockup"><span className="brand-mark">m</span><div><span className="brand-name">mise</span><span className="brand-caption">your kitchen, remembered</span></div></div>
      <nav className="side-nav" aria-label="Main navigation">
        <p className="nav-label">Plan your food</p>
        {navItems.map((item) => <NavButton key={item.id} item={item} active={activeTab === item.id} count={item.id === 'shopping' ? pendingShopping : undefined} onClick={onChange} />)}
      </nav>
      <div className="sidebar-foot"><div className="local-note"><span className="local-note-icon"><Icon name="check" size={16} /></span><div><strong>Saved locally</strong><span>Your data stays on this device.</span></div></div><span className="sidebar-version">v0.1 · metric units</span></div>
    </aside>
  );
}

function MobileNav({ activeTab, pendingShopping, onChange }: { activeTab: Tab; pendingShopping: number; onChange: (tab: Tab) => void }) {
  return <nav className="mobile-nav" aria-label="Main navigation">{navItems.map((item) => <NavButton key={item.id} item={item} active={activeTab === item.id} count={item.id === 'shopping' ? pendingShopping : undefined} onClick={onChange} />)}</nav>;
}

function NavButton({ item, active, count, onClick }: { item: { id: Tab; label: string; icon: IconName }; active: boolean; count?: number; onClick: (tab: Tab) => void }) {
  return <button className={`nav-button ${active ? 'is-active' : ''}`} onClick={() => onClick(item.id)} aria-current={active ? 'page' : undefined}><span className="nav-icon"><Icon name={item.icon} size={20} />{count ? <span className="nav-count">{count > 9 ? '9+' : count}</span> : null}</span><span>{item.label}</span></button>;
}

function HomePage({ readyRecipes, recipes, recipeStatus, pantryCount, shoppingCount, onAddMissing, onOpenRecipe, onOpenRecipes, onOpenPantry, onOpenShopping }: { readyRecipes: Recipe[]; recipes: Recipe[]; recipeStatus: Map<string, ReturnType<typeof getRecipeStatus>>; pantryCount: number; shoppingCount: number; onAddMissing: (recipe: Recipe) => void; onOpenRecipe: (recipe: Recipe) => void; onOpenRecipes: () => void; onOpenPantry: () => void; onOpenShopping: () => void }) {
  const suggestions = readyRecipes.length ? readyRecipes.slice(0, 3) : recipes.slice(0, 3);
  return <>
    <section className="welcome-row"><div><p className="eyebrow">{dateLabel}</p><h1>What can you cook today?</h1><p className="lede">Start with what is already in your kitchen.</p></div><div className="welcome-orbit" aria-hidden="true"><span>✦</span><span>◒</span><span>·</span></div></section>
    <section className="hero-panel">
      <div className="hero-copy"><p className="eyebrow light">Your next meal</p><h2>{readyRecipes.length ? `${readyRecipes.length} recipe${readyRecipes.length === 1 ? '' : 's'} ready now` : 'Add a few pantry items'}</h2><p>{readyRecipes.length ? 'These recipes use only ingredients you have on hand.' : 'Once your pantry has the basics, mise can show you what is possible.'}</p><button className="button button-light" onClick={() => readyRecipes.length ? onOpenRecipes() : onOpenPantry()}>{readyRecipes.length ? 'See ready recipes' : 'Add food'} <Icon name="arrow" size={17} /></button></div>
      <div className="hero-plate" aria-hidden="true"><div className="plate-shadow" /><div className="plate"><span className="plate-leaf leaf-one" /><span className="plate-leaf leaf-two" /><span className="plate-dot dot-one" /><span className="plate-dot dot-two" /><span className="plate-dot dot-three" /></div><span className="hero-spark spark-one">✦</span><span className="hero-spark spark-two">·</span></div>
    </section>
    <section className="stat-row" aria-label="Kitchen summary"><button className="stat-card" onClick={onOpenPantry}><span className="stat-icon stat-icon-green"><Icon name="pantry" size={21} /></span><span><strong>{pantryCount}</strong><small>pantry items</small></span><Icon name="chevron" size={18} /></button><button className="stat-card" onClick={onOpenRecipes}><span className="stat-icon stat-icon-peach"><Icon name="book" size={21} /></span><span><strong>{recipes.length}</strong><small>saved recipes</small></span><Icon name="chevron" size={18} /></button><button className="stat-card" onClick={onOpenShopping}><span className="stat-icon stat-icon-blue"><Icon name="list" size={21} /></span><span><strong>{shoppingCount}</strong><small>to buy</small></span><Icon name="chevron" size={18} /></button></section>
    <section className="content-section"><div className="section-heading"><div><p className="eyebrow">Cook with what you have</p><h2>Ready to cook</h2></div><button className="text-button" onClick={onOpenRecipes}>View all <Icon name="arrow" size={16} /></button></div>{suggestions.length ? <div className="recipe-grid home-grid">{suggestions.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} status={recipeStatus.get(recipe.id)!} onOpen={() => onOpenRecipe(recipe)} onAddMissing={() => onAddMissing(recipe)} />)}</div> : <EmptyState icon="book" title="Your recipe shelf is empty" body="Save a recipe to start planning meals." action="Add a recipe" onAction={onOpenRecipes} />}</section>
    <section className="tip-panel"><span className="tip-icon"><Icon name="spark" size={20} /></span><div><strong>Keep it simple</strong><p>Add the food you buy most often. You can adjust quantities whenever you use something.</p></div><button className="icon-button muted" aria-label="More about local storage" title="More about local storage"><Icon name="info" size={19} /></button></section>
  </>;
}

function RecipesPage({ recipes, recipeStatus, filter, search, onFilter, onSearch, onAddRecipe, onOpenRecipe, onAddMissing, onToggleFavorite }: { recipes: Recipe[]; recipeStatus: Map<string, ReturnType<typeof getRecipeStatus>>; filter: 'all' | 'ready' | 'favorites'; search: string; onFilter: (filter: 'all' | 'ready' | 'favorites') => void; onSearch: (value: string) => void; onAddRecipe: () => void; onOpenRecipe: (recipe: Recipe) => void; onAddMissing: (recipe: Recipe) => void; onToggleFavorite: (recipe: Recipe) => void }) {
  return <><PageHeader eyebrow="Your collection" title="Recipes" description="Save the meals you want to remember, then see what you can make right now." action={<button className="button button-primary" onClick={onAddRecipe}><Icon name="plus" size={18} />New recipe</button>} /><div className="toolbar"><label className="search-field"><Icon name="search" size={19} /><span className="sr-only">Search recipes</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search recipes" /></label><div className="segmented-control" role="tablist" aria-label="Recipe filters"><button className={filter === 'all' ? 'is-selected' : ''} onClick={() => onFilter('all')} role="tab" aria-selected={filter === 'all'}>All recipes</button><button className={filter === 'ready' ? 'is-selected' : ''} onClick={() => onFilter('ready')} role="tab" aria-selected={filter === 'ready'}>Ready now</button><button className={filter === 'favorites' ? 'is-selected' : ''} onClick={() => onFilter('favorites')} role="tab" aria-selected={filter === 'favorites'}><Icon name="heart" size={15} />Favourites</button></div></div>{recipes.length ? <div className="recipe-grid">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} status={recipeStatus.get(recipe.id)!} onOpen={() => onOpenRecipe(recipe)} onAddMissing={() => onAddMissing(recipe)} onToggleFavorite={() => onToggleFavorite(recipe)} />)}</div> : <EmptyState icon="search" title="No recipes found" body="Try another search or clear the current filter." action="Show all recipes" onAction={() => { onFilter('all'); onSearch(''); }} />}</>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action: ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lede">{description}</p></div>{action}</div>;
}

function RecipeCard({ recipe, status, onOpen, onAddMissing, onToggleFavorite }: { recipe: Recipe; status: ReturnType<typeof getRecipeStatus>; onOpen: () => void; onAddMissing: () => void; onToggleFavorite?: () => void }) {
  return <article className="recipe-card"><button className={`recipe-visual accent-${recipe.accent}`} onClick={onOpen} aria-label={`Open ${recipe.title}`}><span className="recipe-icon">{recipe.icon}</span><span className="recipe-category">{recipe.category}</span>{status.ready && <span className="ready-pill"><Icon name="check" size={13} />Ready</span>}</button><div className="recipe-card-body"><div className="recipe-card-top"><div><button className="card-title" onClick={onOpen}>{recipe.title}</button><p>{recipe.description}</p></div>{onToggleFavorite && <button className={`icon-button favorite-button ${recipe.favorite ? 'is-favorite' : ''}`} onClick={onToggleFavorite} aria-label={recipe.favorite ? `Remove ${recipe.title} from favourites` : `Add ${recipe.title} to favourites`} title={recipe.favorite ? 'Remove from favourites' : 'Add to favourites'}><Icon name="heart" size={19} /></button>}</div><div className="recipe-meta"><span><Icon name="clock" size={16} />{recipe.minutes} min</span><span><Icon name="pantry" size={16} />{status.ready ? 'All ingredients' : `${status.missing.length} to buy`}</span></div><div className="recipe-card-actions">{status.ready ? <span className="ready-copy"><span className="status-check"><Icon name="check" size={13} /></span>Make this now</span> : <button className="small-action" onClick={onAddMissing}><Icon name="plus" size={15} />Add missing</button>}<button className="small-arrow" onClick={onOpen} aria-label={`View ${recipe.title}`}><Icon name="arrow" size={17} /></button></div></div></article>;
}

function PantryPage({ pantry, search, onSearch, onAdd, onEdit, onRemove }: { pantry: PantryItem[]; search: string; onSearch: (value: string) => void; onAdd: () => void; onEdit: (item: PantryItem) => void; onRemove: (item: PantryItem) => void }) {
  const grouped = categoryOptions.map((category) => ({ category, items: pantry.filter((item) => item.category === category) })).filter((group) => group.items.length);
  return <><PageHeader eyebrow="What you have" title="Pantry" description="Keep a simple count of the food at home. Quantities use metric units." action={<button className="button button-primary" onClick={onAdd}><Icon name="plus" size={18} />Add food</button>} /><div className="toolbar pantry-toolbar"><label className="search-field"><Icon name="search" size={19} /><span className="sr-only">Search pantry</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search pantry" /></label><span className="toolbar-note"><Icon name="check" size={16} />Saved on this device</span></div>{grouped.length ? <div className="pantry-groups">{grouped.map((group) => <section className="pantry-group" key={group.category}><div className="group-heading"><h2>{group.category}</h2><span>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</span></div><div className="pantry-list">{group.items.map((item) => <PantryRow key={item.id} item={item} onEdit={() => onEdit(item)} onRemove={() => onRemove(item)} />)}</div></section>)}</div> : <EmptyState icon="pantry" title="Nothing in your pantry yet" body="Add the food you already have. mise will use it to find recipes you can make." action="Add food" onAction={onAdd} />}</>;
}

function PantryRow({ item, onEdit, onRemove }: { item: PantryItem; onEdit: () => void; onRemove: () => void }) {
  const isSoon = item.expiresAt && new Date(`${item.expiresAt}T23:59:59`).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
  return <div className="pantry-row"><span className={`food-avatar category-${item.category.toLowerCase().replace(' ', '-')}`}>{item.name.charAt(0).toUpperCase()}</span><div className="pantry-item-name"><strong>{item.name}</strong><span>{isSoon ? <><Icon name="calendar" size={14} />Use by {formatDate(item.expiresAt)}</> : `Updated ${formatDate(item.updatedAt.slice(0, 10))}`}</span></div><span className="pantry-quantity"><strong>{formatAmount(item.quantity)}</strong> {item.unit}</span><div className="row-actions"><button className="icon-button" onClick={onEdit} aria-label={`Edit ${item.name}`} title="Edit"><Icon name="edit" size={17} /></button><button className="icon-button danger-hover" onClick={onRemove} aria-label={`Remove ${item.name}`} title="Remove"><Icon name="trash" size={17} /></button></div></div>;
}

function ShoppingPage({ shopping, recipes, onToggle, onRemove, onClearChecked, onAdd }: { shopping: ShoppingItem[]; recipes: Recipe[]; onToggle: (id: string) => void; onRemove: (id: string) => void; onClearChecked: () => void; onAdd: () => void }) {
  const pending = shopping.filter((item) => !item.checked);
  const checked = shopping.filter((item) => item.checked);
  const recipeName = (id: string) => recipes.find((recipe) => recipe.id === id)?.title;
  return <><PageHeader eyebrow="Bring home" title="Shopping list" description={pending.length ? `${pending.length} ${pending.length === 1 ? 'item' : 'items'} left to buy.` : 'Your list is clear. Add an item or plan from a recipe.'} action={<button className="button button-primary" onClick={onAdd}><Icon name="plus" size={18} />Add item</button>} /><section className="shopping-panel"><div className="shopping-panel-head"><div><p className="eyebrow">Next shop</p><h2>{pending.length ? 'Things to pick up' : 'Nothing left to buy'}</h2></div><span className="list-count"><strong>{pending.length}</strong> open</span></div>{pending.length ? <div className="shopping-list">{pending.map((item) => <ShoppingRow key={item.id} item={item} recipeName={item.sourceRecipeIds.map(recipeName).filter(Boolean)[0]} onToggle={() => onToggle(item.id)} onRemove={() => onRemove(item.id)} />)}</div> : <div className="list-empty"><span className="empty-check"><Icon name="check" size={22} /></span><div><strong>All caught up</strong><p>When a recipe needs something, add it here in one tap.</p></div></div>}</section>{checked.length > 0 && <section className="shopping-panel checked-panel"><div className="shopping-panel-head"><div><p className="eyebrow">Done</p><h2>Already bought</h2></div><button className="text-button danger-text" onClick={onClearChecked}>Clear bought</button></div><div className="shopping-list">{checked.map((item) => <ShoppingRow key={item.id} item={item} onToggle={() => onToggle(item.id)} onRemove={() => onRemove(item.id)} />)}</div></section>}<section className="shopping-note"><span className="tip-icon"><Icon name="spark" size={20} /></span><div><strong>Missing ingredients stay linked</strong><p>Items added from a recipe show its name here, so you know why they are on the list.</p></div></section></>;
}

function ShoppingRow({ item, recipeName, onToggle, onRemove }: { item: ShoppingItem; recipeName?: string; onToggle: () => void; onRemove: () => void }) {
  return <div className={`shopping-row ${item.checked ? 'is-checked' : ''}`}><button className="check-box" onClick={onToggle} aria-label={`${item.checked ? 'Mark' : 'Buy'} ${item.name}`}>{item.checked && <Icon name="check" size={16} />}</button><div className="shopping-item-copy"><strong>{item.name}</strong><span>{recipeName ? `For ${recipeName}` : 'Added by you'}</span></div><span className="shopping-amount">{formatAmount(item.amount)} {item.unit}</span><button className="icon-button danger-hover" onClick={onRemove} aria-label={`Remove ${item.name} from shopping list`} title="Remove"><Icon name="trash" size={17} /></button></div>;
}

function EmptyState({ icon, title, body, action, onAction }: { icon: IconName; title: string; body: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><span className="empty-state-icon"><Icon name={icon} size={26} /></span><h2>{title}</h2><p>{body}</p><button className="button button-secondary" onClick={onAction}><Icon name="plus" size={17} />{action}</button></div>;
}

function ModalShell({ title, eyebrow, children, onClose, wide = false }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); };
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-header">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<button className="icon-button modal-close" onClick={onClose} aria-label="Close"><Icon name="close" size={21} /></button><h2>{title}</h2></div>{children}</section></div>;
}

function RecipeDetails({ recipe, status, onClose, onEdit, onDelete, onAddMissing, onToggleFavorite }: { recipe: Recipe; status: ReturnType<typeof getRecipeStatus>; onClose: () => void; onEdit: () => void; onDelete: () => void; onAddMissing: () => void; onToggleFavorite: () => void }) {
  const missingNames = new Set(status.missing.map((ingredient) => ingredient.id));
  return <ModalShell title={recipe.title} eyebrow={recipe.category} onClose={onClose} wide><div className={`detail-visual accent-${recipe.accent}`}><span>{recipe.icon}</span><div><span className="detail-chip"><Icon name="clock" size={14} />{recipe.minutes} min</span><span className="detail-chip"><Icon name="pantry" size={14} />{recipe.servings} servings</span></div></div><div className="detail-body"><div className="detail-intro"><div><p>{recipe.description}</p><div className="tag-row">{recipe.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div><button className={`favorite-large ${recipe.favorite ? 'is-favorite' : ''}`} onClick={onToggleFavorite} aria-label={recipe.favorite ? 'Remove from favourites' : 'Add to favourites'}><Icon name="heart" size={20} /><span>{recipe.favorite ? 'Favourite' : 'Save'}</span></button></div><div className="detail-columns"><div><div className="detail-heading"><h3>Ingredients</h3><span>{status.ready ? <span className="inline-success"><Icon name="check" size={14} />You have everything</span> : `${status.missing.length} to buy`}</span></div><div className="ingredient-list">{recipe.ingredients.map((ingredient) => <div className={`ingredient-row ${missingNames.has(ingredient.id) ? 'is-missing' : ''}`} key={ingredient.id}><span className={`ingredient-check ${missingNames.has(ingredient.id) ? 'missing' : ''}`}>{missingNames.has(ingredient.id) ? <Icon name="plus" size={14} /> : <Icon name="check" size={14} />}</span><span>{ingredient.name}{ingredient.optional && <small>optional</small>}</span><strong>{formatAmount(ingredient.amount)} {ingredient.unit}</strong></div>)}</div>{status.missing.length > 0 && <button className="button button-secondary full-button" onClick={onAddMissing}><Icon name="list" size={17} />Add missing to shopping list</button>}</div><div className="method-column"><div className="detail-heading"><h3>Method</h3><span>{recipe.steps.length} steps</span></div><ol className="method-list">{recipe.steps.map((step, index) => <li key={`${recipe.id}-step-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol></div></div><div className="detail-footer"><button className="button button-quiet" onClick={onDelete}><Icon name="trash" size={17} />Remove recipe</button><button className="button button-secondary" onClick={onEdit}><Icon name="edit" size={17} />Edit recipe</button></div></div></ModalShell>;
}

function RecipeEditor({ recipe, onClose, onSave }: { recipe: Recipe | null; onClose: () => void; onSave: (draft: RecipeDraft) => void }) {
  const [draft, setDraft] = useState<RecipeDraft>(() => recipe ? { title: recipe.title, description: recipe.description, minutes: recipe.minutes, servings: recipe.servings, category: recipe.category, tags: recipe.tags, accent: recipe.accent, icon: recipe.icon, favorite: recipe.favorite, ingredients: recipe.ingredients, steps: recipe.steps } : emptyRecipe);
  const [error, setError] = useState('');
  const setField = <K extends keyof RecipeDraft>(field: K, value: RecipeDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));
  const updateIngredient = (id: string, updates: Partial<Ingredient>) => setField('ingredients', draft.ingredients.map((ingredient) => ingredient.id === id ? { ...ingredient, ...updates } : ingredient));
  const updateStep = (index: number, value: string) => setField('steps', draft.steps.map((step, stepIndex) => stepIndex === index ? value : step));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ingredients = draft.ingredients.filter((ingredient) => ingredient.name.trim());
    const steps = draft.steps.filter((step) => step.trim());
    if (!draft.title.trim()) { setError('Add a name for this recipe.'); return; }
    if (!ingredients.length) { setError('Add at least one ingredient.'); return; }
    if (!steps.length) { setError('Add at least one method step.'); return; }
    onSave({ ...draft, title: draft.title.trim(), ingredients, steps });
  };
  return <ModalShell title={recipe ? 'Edit recipe' : 'New recipe'} eyebrow="Recipe details" onClose={onClose} wide><form className="editor-form" onSubmit={submit}><div className="form-grid two-col"><label><span>Recipe name</span><input autoFocus value={draft.title} onChange={(event) => setField('title', event.target.value)} placeholder="e.g. Weeknight tomato pasta" /></label><label><span>Category</span><input value={draft.category} onChange={(event) => setField('category', event.target.value)} placeholder="e.g. Quick dinner" /></label><label className="full-span"><span>Short description</span><textarea rows={2} value={draft.description} onChange={(event) => setField('description', event.target.value)} placeholder="What makes this worth cooking?" /></label><label><span>Time in minutes</span><input inputMode="numeric" type="number" min="1" value={draft.minutes} onChange={(event) => setField('minutes', Number(event.target.value) || 1)} /></label><label><span>Servings</span><input inputMode="numeric" type="number" min="1" value={draft.servings} onChange={(event) => setField('servings', Number(event.target.value) || 1)} /></label></div><div className="editor-section"><div className="editor-section-head"><div><h3>Ingredients</h3><p>Use grams, kilograms, millilitres, litres, pieces, teaspoons, or tablespoons.</p></div><button type="button" className="small-action" onClick={() => setField('ingredients', [...draft.ingredients, { id: makeId('ingredient'), name: '', amount: 1, unit: 'pcs', category: 'Produce' }])}><Icon name="plus" size={15} />Add ingredient</button></div><div className="ingredient-editor">{draft.ingredients.map((ingredient) => <div className="ingredient-edit-row" key={ingredient.id}><input aria-label="Ingredient name" value={ingredient.name} onChange={(event) => updateIngredient(ingredient.id, { name: event.target.value })} placeholder="Ingredient" /><input aria-label="Amount" inputMode="decimal" type="number" min="0" step="0.01" value={ingredient.amount} onChange={(event) => updateIngredient(ingredient.id, { amount: Number(event.target.value) || 0 })} /><select aria-label="Unit" value={ingredient.unit} onChange={(event) => updateIngredient(ingredient.id, { unit: event.target.value as Unit })}>{UNITS.map((unit) => <option value={unit} key={unit}>{unit}</option>)}</select><select aria-label="Category" value={ingredient.category} onChange={(event) => updateIngredient(ingredient.id, { category: event.target.value as PantryCategory })}>{categoryOptions.map((category) => <option value={category} key={category}>{category}</option>)}</select><button type="button" className="icon-button danger-hover" onClick={() => setField('ingredients', draft.ingredients.filter((item) => item.id !== ingredient.id))} aria-label={`Remove ${ingredient.name || 'ingredient'}`}><Icon name="trash" size={17} /></button></div>)}</div></div><div className="editor-section"><div className="editor-section-head"><div><h3>Method</h3><p>Keep each step short and easy to follow.</p></div><button type="button" className="small-action" onClick={() => setField('steps', [...draft.steps, ''])}><Icon name="plus" size={15} />Add step</button></div><div className="steps-editor">{draft.steps.map((step, index) => <div className="step-edit-row" key={`step-${index}`}><span>{index + 1}</span><textarea aria-label={`Step ${index + 1}`} rows={2} value={step} onChange={(event) => updateStep(index, event.target.value)} placeholder="What happens next?" /><button type="button" className="icon-button danger-hover" onClick={() => setField('steps', draft.steps.filter((_, stepIndex) => stepIndex !== index))} aria-label={`Remove step ${index + 1}`}><Icon name="trash" size={17} /></button></div>)}</div></div>{error && <p className="form-error" role="alert"><Icon name="info" size={16} />{error}</p>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{recipe ? 'Save changes' : 'Save recipe'} <Icon name="arrow" size={17} /></button></div></form></ModalShell>;
}

function PantryEditor({ item, onClose, onSave }: { item: PantryItem | null; onClose: () => void; onSave: (draft: PantryDraft) => void }) {
  const [draft, setDraft] = useState<PantryDraft>(() => item ? { name: item.name, quantity: item.quantity, unit: item.unit, category: item.category, expiresAt: item.expiresAt || '' } : emptyPantry);
  const [error, setError] = useState('');
  const setField = <K extends keyof PantryDraft>(field: K, value: PantryDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!draft.name.trim()) { setError('Add a name for this food.'); return; } if (draft.quantity <= 0) { setError('Quantity must be more than zero.'); return; } onSave({ ...draft, name: draft.name.trim() }); };
  return <ModalShell title={item ? 'Edit pantry item' : 'Add food'} eyebrow="Your kitchen" onClose={onClose}><form className="editor-form" onSubmit={submit}><label><span>Food name</span><input autoFocus value={draft.name} onChange={(event) => setField('name', event.target.value)} placeholder="e.g. Tomatoes" /></label><div className="form-grid two-col"><label><span>Quantity</span><input inputMode="decimal" type="number" min="0" step="0.01" value={draft.quantity} onChange={(event) => setField('quantity', Number(event.target.value) || 0)} /></label><label><span>Unit</span><select value={draft.unit} onChange={(event) => setField('unit', event.target.value as Unit)}>{UNITS.map((unit) => <option value={unit} key={unit}>{unit}</option>)}</select></label><label><span>Category</span><select value={draft.category} onChange={(event) => setField('category', event.target.value as PantryCategory)}>{categoryOptions.map((category) => <option value={category} key={category}>{category}</option>)}</select></label><label><span>Use by <em>optional</em></span><input type="date" value={draft.expiresAt} onChange={(event) => setField('expiresAt', event.target.value)} /></label></div><p className="form-hint"><Icon name="info" size={16} />You can change the quantity any time. Recipes only use items with enough stock.</p>{error && <p className="form-error" role="alert"><Icon name="info" size={16} />{error}</p>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{item ? 'Save changes' : 'Add to pantry'} <Icon name="arrow" size={17} /></button></div></form></ModalShell>;
}

function ShoppingEditor({ onClose, onSave }: { onClose: () => void; onSave: (draft: ShoppingDraft) => void }) {
  const [draft, setDraft] = useState<ShoppingDraft>(emptyShopping);
  const [error, setError] = useState('');
  const setField = <K extends keyof ShoppingDraft>(field: K, value: ShoppingDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!draft.name.trim()) { setError('Add an item to your list.'); return; } onSave({ ...draft, name: draft.name.trim() }); };
  return <ModalShell title="Add to shopping list" eyebrow="Next shop" onClose={onClose}><form className="editor-form" onSubmit={submit}><label><span>Item</span><input autoFocus value={draft.name} onChange={(event) => setField('name', event.target.value)} placeholder="e.g. Fresh basil" /></label><div className="form-grid two-col"><label><span>Amount</span><input inputMode="decimal" type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => setField('amount', Number(event.target.value) || 0)} /></label><label><span>Unit</span><select value={draft.unit} onChange={(event) => setField('unit', event.target.value as Unit)}>{UNITS.map((unit) => <option value={unit} key={unit}>{unit}</option>)}</select></label><label className="full-span"><span>Category</span><select value={draft.category} onChange={(event) => setField('category', event.target.value as PantryCategory)}>{categoryOptions.map((category) => <option value={category} key={category}>{category}</option>)}</select></label></div>{error && <p className="form-error" role="alert"><Icon name="info" size={16} />{error}</p>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">Add item <Icon name="arrow" size={17} /></button></div></form></ModalShell>;
}

export default App;
