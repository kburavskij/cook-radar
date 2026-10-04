import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { loadPantry, loadRecipes, loadShopping, savePantry, saveRecipes, saveShopping } from './storage';
import type { Ingredient, PantryCategory, PantryDraft, PantryItem, Recipe, RecipeDraft, ShoppingDraft, ShoppingItem, Tab, Unit } from './types';
import { UNITS } from './types';
import { categoryLabel, foodLabel, ingredientLabel, recipeText, tr, unitLabel, type Language } from './i18n';
import { addOrMergeShopping, formatAmount, getMissingIngredients, getRecipeStatus, makeId, normalize } from './utils';

type IconName =
  | 'home' | 'book' | 'pantry' | 'list' | 'plus' | 'search' | 'clock' | 'check' | 'chevron'
  | 'heart' | 'close' | 'trash' | 'edit' | 'spark' | 'arrow' | 'calendar' | 'filter' | 'info' | 'globe';

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
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  trash: <><path d="M4 7h16M10 11v5M14 11v5" /><path d="m6 7 1 13h10l1-13M9 7V4h6v3" /></>,
  edit: <><path d="m4 16-.8 4.8L8 20l11.5-11.5a2.1 2.1 0 0 0-3-3L5 17Z" /><path d="m14.5 7.5 3 3" /></>,
  spark: <><path d="m12 3 1.2 4.3L17.5 9l-4.3 1.2L12 14.5l-1.2-4.3L6.5 9l4.3-1.7L12 3Z" /><path d="m19 15 .6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15Z" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7h.01" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" /></>,
};

function Icon({ name, size = 20, strokeWidth = 1.55 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return <svg aria-hidden="true" className="icon" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}>{icons[name]}</svg>;
}

const navItems: { id: Tab; key: string; icon: IconName }[] = [
  { id: 'home', key: 'nav.today', icon: 'home' },
  { id: 'recipes', key: 'nav.recipes', icon: 'book' },
  { id: 'pantry', key: 'nav.pantry', icon: 'pantry' },
  { id: 'shopping', key: 'nav.shopping', icon: 'list' },
];

const categoryOptions: PantryCategory[] = ['Produce', 'Dairy', 'Dry goods', 'Protein', 'Seasoning', 'Other'];

const emptyRecipe: RecipeDraft = {
  title: '', description: '', minutes: 30, servings: 2, category: 'Dinner', tags: [], accent: 'sage', icon: '🍲', favorite: false,
  ingredients: [{ id: makeId('ingredient'), name: '', amount: 1, unit: 'pcs', category: 'Produce' }],
  steps: [''],
};

const emptyPantry: PantryDraft = { name: '', quantity: 1, unit: 'pcs', category: 'Produce', expiresAt: '' };
const emptyShopping: ShoppingDraft = { name: '', amount: 1, unit: 'pcs', category: 'Other' };
const isPreviewBuild = import.meta.env.DEV || import.meta.env.VITE_DESIGN_PREVIEW === 'true';
type DesignVariant = 'a' | 'b' | 'c';

type ViewProps = {
  language: Language;
  recipes: Recipe[];
  pantry: PantryItem[];
  shopping: ShoppingItem[];
  recipeStatus: Map<string, ReturnType<typeof getRecipeStatus>>;
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
  onOpenRecipe: (recipe: Recipe) => void;
  onAddMissing: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onAddRecipe: () => void;
  onAddFood: () => void;
  onAddShopping: () => void;
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'lt';
    return window.localStorage.getItem('cook-radar:language') === 'en' ? 'en' : 'lt';
  });
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
  const [variant, setVariant] = useState<DesignVariant>(() => readVariant());

  useEffect(() => saveRecipes(recipes), [recipes]);
  useEffect(() => savePantry(pantry), [pantry]);
  useEffect(() => saveShopping(shopping), [shopping]);
  useEffect(() => window.localStorage.setItem('cook-radar:language', language), [language]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = tr(language, 'app.title');
  }, [language]);

  useEffect(() => {
    const setConnection = () => setOnline(navigator.onLine);
    window.addEventListener('online', setConnection);
    window.addEventListener('offline', setConnection);
    return () => { window.removeEventListener('online', setConnection); window.removeEventListener('offline', setConnection); };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let registration: ServiceWorkerRegistration | undefined;
    const interval = window.setInterval(() => registration?.update(), 30 * 60 * 1000);
    navigator.serviceWorker.register('./sw.js').then((registered) => { registration = registered; }).catch(() => undefined);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isPreviewBuild) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.key === 'ArrowLeft') setVariantFromIndex(-1);
      if (event.key === 'ArrowRight') setVariantFromIndex(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reveal = (item: HTMLElement) => item.classList.add('is-visible');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      items.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [activeTab, language, variant]);

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
      const display = recipeText(recipe, language);
      const matchesSearch = !search || [display.title, display.description, ...display.tags].some((value) => normalize(value).includes(search));
      const matchesFilter = recipeFilter === 'all' || (recipeFilter === 'ready' ? recipeStatus.get(recipe.id)?.ready : recipe.favorite);
      return matchesSearch && matchesFilter;
    });
  }, [language, recipeFilter, recipeSearch, recipes, recipeStatus]);
  const filteredPantry = useMemo(() => {
    const search = normalize(pantrySearch);
    return pantry.filter((item) => !search || normalize(foodLabel(item.name, language)).includes(search) || normalize(categoryLabel(item.category, language)).includes(search));
  }, [language, pantry, pantrySearch]);

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addMissingToShopping = (recipe: Recipe) => {
    const missing = getMissingIngredients(recipe, pantry);
    setShopping((current) => missing.reduce((list, ingredient) => addOrMergeShopping(list, ingredient, recipe.id), current));
    if (missing.length) {
      const word = language === 'lt' ? (missing.length === 1 ? 'ingredientas' : 'ingredientai') : (missing.length === 1 ? 'ingredient' : 'ingredients');
      showToast(tr(language, 'toast.missingAdded', { n: missing.length, word }));
    } else showToast(tr(language, 'toast.haveEverything'));
  };

  const saveRecipe = (draft: RecipeDraft, existing: Recipe | null) => {
    if (existing) {
      setRecipes((current) => current.map((recipe) => recipe.id === existing.id ? { ...draft, id: existing.id, createdAt: existing.createdAt } : recipe));
      showToast(tr(language, 'toast.recipeUpdated'));
    } else {
      setRecipes((current) => [{ ...draft, id: makeId('recipe'), createdAt: new Date().toISOString() }, ...current]);
      showToast(tr(language, 'toast.recipeSaved'));
    }
    setEditingRecipe(null);
  };

  const deleteRecipe = (recipe: Recipe) => {
    if (!window.confirm(`${tr(language, 'confirm.removeRecipe')}\n\n${recipeText(recipe, language).title}`)) return;
    setRecipes((current) => current.filter((item) => item.id !== recipe.id));
    setViewingRecipe(null);
    showToast(tr(language, 'toast.recipeRemoved'));
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
      showToast(tr(language, 'toast.foodUpdated'));
    } else {
      setPantry((current) => [{ ...draft, id: makeId('pantry'), updatedAt }, ...current]);
      showToast(tr(language, 'toast.foodAdded'));
    }
    setEditingPantry(null);
  };

  const removePantryItem = (item: PantryItem) => {
    setPantry((current) => current.filter((entry) => entry.id !== item.id));
    showToast(tr(language, 'toast.foodRemoved'));
  };

  const addShoppingItem = (draft: ShoppingDraft) => {
    setShopping((current) => [...current, { ...draft, id: makeId('shopping'), checked: false, sourceRecipeIds: [] }]);
    setShowShoppingEditor(false);
    showToast(tr(language, 'toast.shoppingAdded'));
  };

  const setVariantFromIndex = (delta: number) => {
    const variants: DesignVariant[] = ['a', 'b', 'c'];
    const currentIndex = variants.indexOf(variant);
    const next = variants[(currentIndex + delta + variants.length) % variants.length];
    const url = new URL(window.location.href);
    url.searchParams.set('variant', next);
    window.history.replaceState({}, '', url);
    setVariant(next);
  };

  const viewProps: ViewProps = {
    language, recipes, pantry, shopping, recipeStatus, activeTab, onChangeTab: changeTab,
    onOpenRecipe: setViewingRecipe, onAddMissing: addMissingToShopping, onToggleFavorite: toggleFavorite,
    onAddRecipe: () => setEditingRecipe('new'), onAddFood: () => setEditingPantry('new'), onAddShopping: () => setShowShoppingEditor(true),
  };

  const page = activeTab === 'home'
    ? variant === 'b' ? <RadarHome {...viewProps} readyRecipes={readyRecipes} />
      : variant === 'c' ? <PantryFirstHome {...viewProps} readyRecipes={readyRecipes} />
        : <TodayHome {...viewProps} readyRecipes={readyRecipes} />
    : activeTab === 'recipes'
      ? <RecipesPage {...viewProps} recipes={filteredRecipes} filter={recipeFilter} search={recipeSearch} onFilter={setRecipeFilter} onSearch={setRecipeSearch} />
      : activeTab === 'pantry'
        ? <PantryPage {...viewProps} pantry={filteredPantry} search={pantrySearch} onSearch={setPantrySearch} onAdd={viewProps.onAddFood} onEdit={setEditingPantry} onRemove={removePantryItem} />
        : <ShoppingPage {...viewProps} onToggle={(id) => setShopping((current) => current.map((item) => item.id === id ? { ...item, checked: !item.checked } : item))} onRemove={(id) => setShopping((current) => current.filter((item) => item.id !== id))} onClearChecked={() => setShopping((current) => current.filter((item) => !item.checked))} />;

  return <div className={`app-shell design-${variant}`}>
    <DesktopRail {...viewProps} pendingCount={pendingShopping.length} />
    <main className="main-content">
      <TopBar {...viewProps} online={online} onChangeLanguage={setLanguage} />
      {!online && <div className="offline-banner"><Icon name="info" size={17} /><span>{tr(language, 'status.offlineMessage')}</span></div>}
      <div className="page-shell">{page}</div>
    </main>
    <MobileNav {...viewProps} pendingCount={pendingShopping.length} />
    {isPreviewBuild && <PrototypeSwitcher language={language} variant={variant} onChange={setVariantFromIndex} />}
    {viewingRecipe && <RecipeDetails language={language} recipe={viewingRecipe} status={recipeStatus.get(viewingRecipe.id)!} onClose={() => setViewingRecipe(null)} onEdit={() => { setEditingRecipe(viewingRecipe); setViewingRecipe(null); }} onDelete={() => deleteRecipe(viewingRecipe)} onAddMissing={() => addMissingToShopping(viewingRecipe)} onToggleFavorite={() => toggleFavorite(viewingRecipe)} />}
    {editingRecipe && <RecipeEditor key={editingRecipe === 'new' ? 'new' : editingRecipe.id} language={language} recipe={editingRecipe === 'new' ? null : editingRecipe} onClose={() => setEditingRecipe(null)} onSave={(draft) => saveRecipe(draft, editingRecipe === 'new' ? null : editingRecipe)} />}
    {editingPantry && <PantryEditor key={editingPantry === 'new' ? 'new' : editingPantry.id} language={language} item={editingPantry === 'new' ? null : editingPantry} onClose={() => setEditingPantry(null)} onSave={(draft) => savePantryItem(draft, editingPantry === 'new' ? null : editingPantry)} />}
    {showShoppingEditor && <ShoppingEditor language={language} onClose={() => setShowShoppingEditor(false)} onSave={addShoppingItem} />}
    {toast && <div className="toast" role="status"><Icon name="check" size={18} />{toast}</div>}
  </div>;
}

function readVariant(): DesignVariant {
  if (!isPreviewBuild || typeof window === 'undefined') return 'c';
  const value = new URLSearchParams(window.location.search).get('variant');
  return value === 'b' || value === 'c' ? value : 'a';
}

function DesktopRail({ language, activeTab, onChangeTab, pendingCount }: ViewProps & { pendingCount: number }) {
  return <aside className="desktop-rail"><button className="rail-brand" onClick={() => onChangeTab('home')} aria-label="Cook Radar"><span className="brand-mark">C</span><span><strong>Cook Radar</strong><small>{tr(language, 'app.tagline')}</small></span></button><p className="rail-label">{tr(language, 'nav.plan')}</p><nav className="rail-nav" aria-label={tr(language, 'nav.plan')}>{navItems.map((item) => <NavButton key={item.id} item={item} language={language} active={activeTab === item.id} count={item.id === 'shopping' ? pendingCount : undefined} onClick={onChangeTab} />)}</nav><div className="rail-note"><span><Icon name="check" size={15} /></span><p><strong>{tr(language, 'status.local')}</strong><small>Cook Radar</small></p></div></aside>;
}

function TopBar({ language, onChangeTab, onAddFood, online, onChangeLanguage }: ViewProps & { online: boolean; onChangeLanguage: (language: Language) => void }) {
  return <header className="topbar"><button className="mobile-brand" onClick={() => onChangeTab('home')} aria-label="Cook Radar"><span className="brand-mark">C</span><span>Cook Radar</span></button><div className="topbar-spacer" /><div className={`connection-pill ${online ? 'is-online' : 'is-offline'}`} aria-live="polite"><span className="connection-dot" />{tr(language, online ? 'status.online' : 'status.offline')}</div><LanguageToggle language={language} onChange={onChangeLanguage} /><button className="header-action" onClick={onAddFood} aria-label={tr(language, 'common.addFood')}><Icon name="plus" size={18} /><span>{tr(language, 'common.addFood')}</span></button></header>;
}

function LanguageToggle({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return <div className="language-toggle" role="group" aria-label={tr(language, 'language.label')}><Icon name="globe" size={16} /><button className={language === 'lt' ? 'is-active' : ''} onClick={() => onChange('lt')} aria-pressed={language === 'lt'}>LT</button><button className={language === 'en' ? 'is-active' : ''} onClick={() => onChange('en')} aria-pressed={language === 'en'}>EN</button></div>;
}

function MobileNav({ language, activeTab, onChangeTab, pendingCount }: ViewProps & { pendingCount: number }) {
  return <nav className="mobile-nav" aria-label={tr(language, 'nav.plan')}>{navItems.map((item) => <NavButton key={item.id} item={item} language={language} active={activeTab === item.id} count={item.id === 'shopping' ? pendingCount : undefined} onClick={onChangeTab} />)}</nav>;
}

function NavButton({ item, language, active, count, onClick }: { item: { id: Tab; key: string; icon: IconName }; language: Language; active: boolean; count?: number; onClick: (tab: Tab) => void }) {
  return <button className={`nav-button ${active ? 'is-active' : ''}`} onClick={() => onClick(item.id)} aria-current={active ? 'page' : undefined}><span className="nav-icon"><Icon name={item.icon} size={20} />{count ? <span className="nav-count">{count > 9 ? '9+' : count}</span> : null}</span><span>{tr(language, item.key)}</span></button>;
}

function TodayHome({ ...props }: ViewProps & { readyRecipes: Recipe[] }) {
  const { language, recipes, pantry, shopping, recipeStatus, readyRecipes, onOpenRecipe, onAddMissing, onChangeTab } = props;
  const suggestions = readyRecipes.length ? readyRecipes.slice(0, 4) : recipes.slice(0, 4);
  return <>
    <section className="welcome-block" data-reveal><p className="eyebrow">{tr(language, 'home.eyebrow')} · {formatToday(language)}</p><h1>{tr(language, 'home.title')}</h1><p className="lede">{tr(language, 'home.lede')}</p></section>
    <section className="ready-panel" data-reveal><div className="ready-panel-copy"><p className="eyebrow">{tr(language, 'home.readyEyebrow')}</p><h2>{readyRecipes.length ? recipeCount(readyRecipes.length, language) : tr(language, 'home.readyEmptyTitle')}</h2><p>{readyRecipes.length ? tr(language, 'home.readyBody') : tr(language, 'home.readyEmptyBody')}</p><button className="button button-primary" onClick={() => onChangeTab(readyRecipes.length ? 'recipes' : 'pantry')}>{readyRecipes.length ? tr(language, 'home.readyAction') : tr(language, 'common.addFood')} <Icon name="arrow" size={16} /></button></div><div className="ready-mark" aria-hidden="true"><span>{readyRecipes.length}</span><small>{language === 'lt' ? 'paruošta' : 'ready'}</small></div></section>
    <SummaryStrip language={language} pantry={pantry.length} recipes={recipes.length} shopping={shopping.filter((item) => !item.checked).length} onChangeTab={onChangeTab} />
    <section className="content-section" data-reveal><SectionHeading language={language} eyebrow="home.sectionTitle" title={tr(language, 'home.sectionTitle')} actionLabel={tr(language, 'common.viewAll')} onAction={() => onChangeTab('recipes')} />{suggestions.length ? <RecipeList language={language} recipes={suggestions} recipeStatus={recipeStatus} onOpenRecipe={onOpenRecipe} onAddMissing={onAddMissing} /> : <EmptyState language={language} icon="book" title={tr(language, 'home.sectionEmpty')} body={tr(language, 'home.sectionEmptyBody')} action={tr(language, 'common.addRecipe')} onAction={() => onChangeTab('recipes')} />}</section>
    <InfoNote language={language} />
  </>;
}

function RadarHome({ ...props }: ViewProps & { readyRecipes: Recipe[] }) {
  const { language, recipes, pantry, shopping, recipeStatus, readyRecipes, onOpenRecipe, onAddMissing, onChangeTab } = props;
  const suggestions = readyRecipes.length ? readyRecipes.slice(0, 3) : recipes.slice(0, 3);
  return <>
    <section className="welcome-block compact-welcome" data-reveal><p className="eyebrow">{tr(language, 'home.eyebrow')}</p><h1>{tr(language, 'home.title')}</h1><p className="lede">{tr(language, 'home.lede')}</p></section>
    <section className="radar-panel" data-reveal><div className="radar-art" aria-hidden="true"><span className="radar-ring ring-one" /><span className="radar-ring ring-two" /><span className="radar-ring ring-three" /><span className="radar-core">{readyRecipes.length}</span>{readyRecipes.slice(0, 3).map((recipe, index) => <span className={`radar-dot dot-${index + 1}`} key={recipe.id}>{recipe.icon}</span>)}</div><div className="radar-copy"><p className="eyebrow">{tr(language, 'home.readyEyebrow')}</p><h2>{readyRecipes.length ? recipeCount(readyRecipes.length, language) : tr(language, 'home.readyEmptyTitle')}</h2><p>{readyRecipes.length ? tr(language, 'home.readyBody') : tr(language, 'home.readyEmptyBody')}</p></div></section>
    <div className="quick-actions" data-reveal><button className="quick-action primary" onClick={() => onChangeTab('recipes')}><span><Icon name="search" size={20} /></span>{tr(language, 'home.readyAction')}</button><button className="quick-action" onClick={() => onChangeTab('pantry')}><span><Icon name="plus" size={20} /></span>{tr(language, 'common.addFood')}</button></div>
    <SummaryStrip language={language} pantry={pantry.length} recipes={recipes.length} shopping={shopping.filter((item) => !item.checked).length} onChangeTab={onChangeTab} />
    <section className="content-section" data-reveal><SectionHeading language={language} eyebrow="home.sectionTitle" title={tr(language, 'home.sectionTitle')} actionLabel={tr(language, 'common.viewAll')} onAction={() => onChangeTab('recipes')} /><RecipeList language={language} recipes={suggestions} recipeStatus={recipeStatus} onOpenRecipe={onOpenRecipe} onAddMissing={onAddMissing} /></section>
  </>;
}

function PantryFirstHome({ ...props }: ViewProps & { readyRecipes: Recipe[] }) {
  const { language, recipes, pantry, shopping, recipeStatus, readyRecipes, onOpenRecipe, onAddMissing, onChangeTab } = props;
  const pantryPreview = pantry.slice(0, 5);
  const suggestions = readyRecipes.length ? readyRecipes.slice(0, 3) : recipes.slice(0, 3);
  return <>
    <section className="welcome-block" data-reveal><p className="eyebrow">{tr(language, 'home.eyebrow')}</p><h1>{tr(language, 'home.title')}</h1><p className="lede">{tr(language, 'home.lede')}</p></section>
    <section className="meal-callout" data-reveal><div><p className="eyebrow">{tr(language, 'home.readyEyebrow')}</p><h2>{readyRecipes.length ? recipeCount(readyRecipes.length, language) : tr(language, 'home.readyEmptyTitle')}</h2></div><button className="button button-primary meal-action" onClick={() => onChangeTab('recipes')}>{tr(language, 'home.readyAction')} <span className="button-icon"><Icon name="arrow" size={16} /></span></button></section>
    <section className="pantry-focus" data-reveal><div className="pantry-focus-head"><div><p className="eyebrow">{tr(language, 'pantry.eyebrow')}</p><h2>{pantry.length} <span>{tr(language, 'home.stats.pantry')}</span></h2></div><button className="button button-secondary" onClick={() => onChangeTab('pantry')}>{tr(language, 'common.viewAll')} <Icon name="arrow" size={16} /></button></div><div className="pantry-chip-list">{pantryPreview.map((item) => <span className="pantry-chip" key={item.id}><b>{foodLabel(item.name, language).charAt(0)}</b>{foodLabel(item.name, language)}<strong>{formatAmount(item.quantity)} {unitLabel(item.unit, language)}</strong></span>)}{!pantryPreview.length && <p className="muted-copy">{tr(language, 'pantry.emptyBody')}</p>}</div></section>
    <section className="content-section" data-reveal><SectionHeading language={language} eyebrow="home.sectionTitle" title={tr(language, 'home.sectionTitle')} actionLabel={tr(language, 'common.viewAll')} onAction={() => onChangeTab('recipes')} /><RecipeList language={language} recipes={suggestions} recipeStatus={recipeStatus} onOpenRecipe={onOpenRecipe} onAddMissing={onAddMissing} /></section>
    <SummaryStrip language={language} pantry={pantry.length} recipes={recipes.length} shopping={shopping.filter((item) => !item.checked).length} onChangeTab={onChangeTab} />
  </>;
}

function SummaryStrip({ language, pantry, recipes, shopping, onChangeTab }: { language: Language; pantry: number; recipes: number; shopping: number; onChangeTab: (tab: Tab) => void }) {
  return <section className="summary-strip" data-reveal aria-label={tr(language, 'nav.plan')}><button onClick={() => onChangeTab('pantry')}><span className="summary-number">{pantry}</span><span>{tr(language, 'home.stats.pantry')}</span></button><button onClick={() => onChangeTab('recipes')}><span className="summary-number">{recipes}</span><span>{tr(language, 'home.stats.recipes')}</span></button><button onClick={() => onChangeTab('shopping')}><span className="summary-number">{shopping}</span><span>{tr(language, 'home.stats.shopping')}</span></button></section>;
}

function SectionHeading({ language, eyebrow, title, actionLabel, onAction }: { language: Language; eyebrow: string; title: string; actionLabel: string; onAction: () => void }) {
  return <div className="section-heading"><div><p className="eyebrow">{tr(language, eyebrow)}</p><h2>{title}</h2></div><button className="text-button" onClick={onAction}>{actionLabel} <Icon name="arrow" size={16} /></button></div>;
}

function RecipeList({ language, recipes, recipeStatus, onOpenRecipe, onAddMissing, onToggleFavorite }: { language: Language; recipes: Recipe[]; recipeStatus: Map<string, ReturnType<typeof getRecipeStatus>>; onOpenRecipe: (recipe: Recipe) => void; onAddMissing: (recipe: Recipe) => void; onToggleFavorite?: (recipe: Recipe) => void }) {
  return <div className="recipe-list">{recipes.map((recipe) => <RecipeListRow key={recipe.id} language={language} recipe={recipe} status={recipeStatus.get(recipe.id)!} onOpen={() => onOpenRecipe(recipe)} onAddMissing={() => onAddMissing(recipe)} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(recipe) : undefined} />)}</div>;
}

function RecipeListRow({ language, recipe, status, onOpen, onAddMissing, onToggleFavorite }: { language: Language; recipe: Recipe; status: ReturnType<typeof getRecipeStatus>; onOpen: () => void; onAddMissing: () => void; onToggleFavorite?: () => void }) {
  const display = recipeText(recipe, language);
  return <article className="recipe-row" data-reveal><button className={`recipe-row-main accent-${recipe.accent}`} onClick={onOpen} aria-label={`${display.title}. ${tr(language, status.ready ? 'common.ready' : 'common.addMissing')}`}><span className="recipe-mark">{recipe.icon}</span><span className="recipe-row-copy"><strong>{display.title}</strong><small>{display.category} · <Icon name="clock" size={13} /> {recipe.minutes} min</small></span><span className={`row-status ${status.ready ? 'is-ready' : 'is-missing'}`}>{status.ready ? <><Icon name="check" size={13} />{tr(language, 'common.ready')}</> : tr(language, 'common.missing', { n: status.missing.length })}</span><Icon name="arrow" size={18} /></button><div className="recipe-row-actions">{status.ready ? <span className="row-action-note"><Icon name="check" size={14} />{tr(language, 'common.makeNow')}</span> : <button className="inline-action" onClick={onAddMissing}><Icon name="plus" size={14} />{tr(language, 'common.addMissing')}</button>}{onToggleFavorite && <button className={`icon-button ${recipe.favorite ? 'is-favorite' : ''}`} onClick={onToggleFavorite} aria-label={recipe.favorite ? `${display.title}: ${tr(language, 'common.remove')}` : `${display.title}: ${tr(language, 'recipes.favorites')}`}><Icon name="heart" size={17} /></button>}</div></article>;
}

function RecipesPage({ language, recipes, recipeStatus, filter, search, onFilter, onSearch, onAddRecipe, onOpenRecipe, onAddMissing, onToggleFavorite }: ViewProps & { recipes: Recipe[]; filter: 'all' | 'ready' | 'favorites'; search: string; onFilter: (filter: 'all' | 'ready' | 'favorites') => void; onSearch: (value: string) => void }) {
  return <><PageHeader language={language} eyebrow="recipes.eyebrow" title={tr(language, 'recipes.title')} description={tr(language, 'recipes.description')} action={<button className="button button-primary" onClick={onAddRecipe}><Icon name="plus" size={18} />{tr(language, 'common.addRecipe')}</button>} /><div className="toolbar" data-reveal><label className="search-field"><Icon name="search" size={19} /><span className="sr-only">{tr(language, 'common.search')}</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={tr(language, 'common.search')} /></label><div className="segmented-control" role="tablist" aria-label={tr(language, 'recipes.title')}><button className={filter === 'all' ? 'is-selected' : ''} onClick={() => onFilter('all')} role="tab" aria-selected={filter === 'all'}>{tr(language, 'recipes.all')}</button><button className={filter === 'ready' ? 'is-selected' : ''} onClick={() => onFilter('ready')} role="tab" aria-selected={filter === 'ready'}>{tr(language, 'recipes.ready')}</button><button className={filter === 'favorites' ? 'is-selected' : ''} onClick={() => onFilter('favorites')} role="tab" aria-selected={filter === 'favorites'}><Icon name="heart" size={15} />{tr(language, 'recipes.favorites')}</button></div></div>{recipes.length ? <RecipeList language={language} recipes={recipes} recipeStatus={recipeStatus} onOpenRecipe={onOpenRecipe} onAddMissing={onAddMissing} onToggleFavorite={onToggleFavorite} /> : <EmptyState language={language} icon="search" title={search ? tr(language, 'recipes.noResultsTitle') : tr(language, 'recipes.emptyTitle')} body={search ? tr(language, 'recipes.noResultsBody') : tr(language, 'recipes.emptyBody')} action={search ? tr(language, 'common.clear') : tr(language, 'common.addRecipe')} onAction={() => { if (search) { onSearch(''); onFilter('all'); } else onAddRecipe(); }} />}</>;
}

function PantryPage({ language, pantry, search, onSearch, onAdd, onEdit, onRemove }: ViewProps & { pantry: PantryItem[]; search: string; onSearch: (value: string) => void; onAdd: () => void; onEdit: (item: PantryItem | 'new') => void; onRemove: (item: PantryItem) => void }) {
  const groups = categoryOptions.map((category) => ({ category, items: pantry.filter((item) => item.category === category) })).filter((group) => group.items.length);
  return <><PageHeader language={language} eyebrow="pantry.eyebrow" title={tr(language, 'pantry.title')} description={tr(language, 'pantry.description')} action={<button className="button button-primary" onClick={onAdd}><Icon name="plus" size={18} />{tr(language, 'common.addFood')}</button>} /><div className="toolbar pantry-toolbar" data-reveal><label className="search-field"><Icon name="search" size={19} /><span className="sr-only">{tr(language, 'common.search')}</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={tr(language, 'common.search')} /></label><span className="toolbar-note"><Icon name="check" size={16} />{tr(language, 'status.local')}</span></div>{groups.length ? <div className="pantry-groups">{groups.map((group) => <section className="pantry-group" key={group.category}><div className="group-heading"><h2>{categoryLabel(group.category, language)}</h2><span>{group.items.length}</span></div><div className="pantry-list">{group.items.map((item) => <PantryRow key={item.id} language={language} item={item} onEdit={() => onEdit(item)} onRemove={() => onRemove(item)} />)}</div></section>)}</div> : <EmptyState language={language} icon="pantry" title={tr(language, 'pantry.emptyTitle')} body={tr(language, 'pantry.emptyBody')} action={tr(language, 'common.addFood')} onAction={onAdd} />}</>;
}

function PantryRow({ language, item, onEdit, onRemove }: { language: Language; item: PantryItem; onEdit: () => void; onRemove: () => void }) {
  const isSoon = item.expiresAt && new Date(`${item.expiresAt}T23:59:59`).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
  return <div className="pantry-row" data-reveal><span className={`food-avatar category-${item.category.toLowerCase().replace(' ', '-')}`}>{foodLabel(item.name, language).charAt(0)}</span><div className="pantry-item-name"><strong>{foodLabel(item.name, language)}</strong><span>{isSoon ? <><Icon name="calendar" size={14} />{tr(language, 'pantry.useBy')} {formatDate(item.expiresAt, language)}</> : `${tr(language, 'pantry.updated')} ${formatDate(item.updatedAt.slice(0, 10), language)}`}</span></div><span className="pantry-quantity"><strong>{formatAmount(item.quantity)}</strong> {unitLabel(item.unit, language)}</span><div className="row-actions"><button className="icon-button" onClick={onEdit} aria-label={`${tr(language, 'common.edit')} ${foodLabel(item.name, language)}`}><Icon name="edit" size={17} /></button><button className="icon-button danger-hover" onClick={onRemove} aria-label={`${tr(language, 'common.remove')} ${foodLabel(item.name, language)}`}><Icon name="trash" size={17} /></button></div></div>;
}

function ShoppingPage({ language, shopping, recipes, onToggle, onRemove, onClearChecked, onAddShopping }: ViewProps & { onToggle: (id: string) => void; onRemove: (id: string) => void; onClearChecked: () => void }) {
  const pending = shopping.filter((item) => !item.checked);
  const checked = shopping.filter((item) => item.checked);
  const recipeName = (id: string) => { const recipe = recipes.find((item) => item.id === id); return recipe ? recipeText(recipe, language).title : undefined; };
  return <><PageHeader language={language} eyebrow="shopping.eyebrow" title={tr(language, 'shopping.title')} description={pending.length ? `${pending.length} ${tr(language, 'shopping.open')}.` : tr(language, 'shopping.description')} action={<button className="button button-primary" onClick={onAddShopping}><Icon name="plus" size={18} />{tr(language, 'common.addItem')}</button>} /><section className="shopping-panel" data-reveal><div className="shopping-panel-head"><div><p className="eyebrow">{tr(language, 'shopping.eyebrow')}</p><h2>{pending.length ? `${pending.length} ${tr(language, 'shopping.open')}` : tr(language, 'shopping.emptyTitle')}</h2></div>{pending.length > 0 && <span className="list-count"><strong>{pending.length}</strong></span>}</div>{pending.length ? <div className="shopping-list">{pending.map((item) => <ShoppingRow key={item.id} language={language} item={item} recipeName={item.sourceRecipeIds.map(recipeName).filter(Boolean)[0]} onToggle={() => onToggle(item.id)} onRemove={() => onRemove(item.id)} />)}</div> : <div className="list-empty"><span className="empty-check"><Icon name="check" size={22} /></span><div><strong>{tr(language, 'shopping.allDone')}</strong><p>{tr(language, 'shopping.allDoneBody')}</p></div></div>}</section>{checked.length > 0 && <section className="shopping-panel checked-panel" data-reveal><div className="shopping-panel-head"><div><p className="eyebrow">{tr(language, 'shopping.bought')}</p><h2>{checked.length}</h2></div><button className="text-button danger-text" onClick={onClearChecked}>{tr(language, 'shopping.clearBought')}</button></div><div className="shopping-list">{checked.map((item) => <ShoppingRow key={item.id} language={language} item={item} onToggle={() => onToggle(item.id)} onRemove={() => onRemove(item.id)} />)}</div></section>}<InfoNote language={language} /></>;
}

function ShoppingRow({ language, item, recipeName, onToggle, onRemove }: { language: Language; item: ShoppingItem; recipeName?: string; onToggle: () => void; onRemove: () => void }) {
  return <div className={`shopping-row ${item.checked ? 'is-checked' : ''}`} data-reveal><button className="check-box" onClick={onToggle} aria-label={`${item.checked ? tr(language, 'common.done') : tr(language, 'common.addItem')} ${foodLabel(item.name, language)}`}>{item.checked && <Icon name="check" size={16} />}</button><div className="shopping-item-copy"><strong>{foodLabel(item.name, language)}</strong><span>{recipeName ? `${tr(language, 'shopping.fromRecipe')} ${recipeName}` : tr(language, 'shopping.addedByYou')}</span></div><span className="shopping-amount">{formatAmount(item.amount)} {unitLabel(item.unit, language)}</span><button className="icon-button danger-hover" onClick={onRemove} aria-label={`${tr(language, 'common.remove')} ${foodLabel(item.name, language)}`}><Icon name="trash" size={17} /></button></div>;
}

function PageHeader({ language, eyebrow, title, description, action }: { language: Language; eyebrow: string; title: string; description: string; action: ReactNode }) {
  return <div className="page-header" data-reveal><div><p className="eyebrow">{tr(language, eyebrow)}</p><h1>{title}</h1><p className="lede">{description}</p></div>{action}</div>;
}

function EmptyState({ language, icon, title, body, action, onAction }: { language: Language; icon: IconName; title: string; body: string; action: string; onAction: () => void }) {
  return <div className="empty-state" data-reveal><span className="empty-state-icon"><Icon name={icon} size={26} /></span><h2>{title}</h2><p>{body}</p><button className="button button-secondary" onClick={onAction}><Icon name="plus" size={17} />{action}</button></div>;
}

function InfoNote({ language }: { language: Language }) {
  return <section className="tip-panel" data-reveal><span className="tip-icon"><Icon name="spark" size={20} /></span><div><strong>{tr(language, 'home.tipTitle')}</strong><p>{tr(language, 'home.tipBody')}</p></div></section>;
}

function PrototypeSwitcher({ language, variant, onChange }: { language: Language; variant: DesignVariant; onChange: (delta: number) => void }) {
  return <div className="prototype-switcher" aria-label="Design prototype switcher"><button onClick={() => onChange(-1)} aria-label={tr(language, 'preview.previous')}>‹</button><span>{tr(language, `preview.${variant}`)}</span><button onClick={() => onChange(1)} aria-label={tr(language, 'preview.next')}>›</button></div>;
}

function RecipeDetails({ language, recipe, status, onClose, onEdit, onDelete, onAddMissing, onToggleFavorite }: { language: Language; recipe: Recipe; status: ReturnType<typeof getRecipeStatus>; onClose: () => void; onEdit: () => void; onDelete: () => void; onAddMissing: () => void; onToggleFavorite: () => void }) {
  const display = recipeText(recipe, language);
  const missingNames = new Set(status.missing.map((ingredient) => ingredient.id));
  return <ModalShell language={language} title={display.title} eyebrow={display.category} onClose={onClose} wide><div className={`detail-visual accent-${recipe.accent}`}><span>{recipe.icon}</span><div><span className="detail-chip"><Icon name="clock" size={14} />{recipe.minutes} min</span><span className="detail-chip">{recipe.servings} {language === 'lt' ? 'porc.' : 'servings'}</span></div></div><div className="detail-body"><div className="detail-intro"><div><p>{display.description}</p><div className="tag-row">{display.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div><button className={`favorite-large ${recipe.favorite ? 'is-favorite' : ''}`} onClick={onToggleFavorite} aria-label={tr(language, 'recipes.favorites')}><Icon name="heart" size={20} /><span>{tr(language, 'recipes.favorites')}</span></button></div><div className="detail-columns"><div><div className="detail-heading"><h3>{tr(language, 'detail.ingredients')}</h3><span>{status.ready ? <span className="inline-success"><Icon name="check" size={14} />{tr(language, 'detail.haveEverything')}</span> : tr(language, 'common.missing', { n: status.missing.length })}</span></div><div className="ingredient-list">{recipe.ingredients.map((ingredient) => <div className={`ingredient-row ${missingNames.has(ingredient.id) ? 'is-missing' : ''}`} key={ingredient.id}><span className={`ingredient-check ${missingNames.has(ingredient.id) ? 'missing' : ''}`}>{missingNames.has(ingredient.id) ? <Icon name="plus" size={14} /> : <Icon name="check" size={14} />}</span><span>{ingredientLabel(ingredient, language)}{ingredient.optional && <small>{tr(language, 'detail.optional')}</small>}</span><strong>{formatAmount(ingredient.amount)} {unitLabel(ingredient.unit, language)}</strong></div>)}</div>{status.missing.length > 0 && <button className="button button-secondary full-button" onClick={onAddMissing}><Icon name="list" size={17} />{tr(language, 'common.addMissing')}</button>}</div><div className="method-column"><div className="detail-heading"><h3>{tr(language, 'detail.method')}</h3><span>{recipe.steps.length} {tr(language, 'detail.steps')}</span></div><ol className="method-list">{display.steps.map((step, index) => <li key={`${recipe.id}-step-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol></div></div><div className="detail-footer"><button className="button button-quiet" onClick={onDelete}><Icon name="trash" size={17} />{tr(language, 'common.remove')}</button><button className="button button-secondary" onClick={onEdit}><Icon name="edit" size={17} />{tr(language, 'common.edit')}</button></div></div></ModalShell>;
}

function ModalShell({ language, title, eyebrow, children, onClose, wide = false }: { language: Language; title: string; eyebrow?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); };
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-header">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<button className="icon-button modal-close" onClick={onClose} aria-label={tr(language, 'common.close')}><Icon name="close" size={21} /></button><h2>{title}</h2></div>{children}</section></div>;
}

function RecipeEditor({ language, recipe, onClose, onSave }: { language: Language; recipe: Recipe | null; onClose: () => void; onSave: (draft: RecipeDraft) => void }) {
  const display = recipe ? recipeText(recipe, language) : null;
  const [draft, setDraft] = useState<RecipeDraft>(() => recipe ? { title: display!.title, description: display!.description, minutes: recipe.minutes, servings: recipe.servings, category: display!.category, tags: recipe.tags, accent: recipe.accent, icon: recipe.icon, favorite: recipe.favorite, ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient, name: ingredientLabel(ingredient, language) })), steps: display!.steps } : emptyRecipe);
  const [error, setError] = useState('');
  const setField = <K extends keyof RecipeDraft>(field: K, value: RecipeDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));
  const updateIngredient = (id: string, updates: Partial<Ingredient>) => setDraft((current) => ({ ...current, ingredients: current.ingredients.map((ingredient) => ingredient.id === id ? { ...ingredient, ...updates } : ingredient) }));
  const updateStep = (index: number, value: string) => setDraft((current) => ({ ...current, steps: current.steps.map((step, stepIndex) => stepIndex === index ? value : step) }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ingredients = draft.ingredients.filter((ingredient) => ingredient.name.trim());
    const steps = draft.steps.filter((step) => step.trim());
    if (!draft.title.trim()) { setError(tr(language, 'form.invalidRecipeName')); return; }
    if (!ingredients.length) { setError(tr(language, 'form.invalidIngredient')); return; }
    if (!steps.length) { setError(tr(language, 'form.invalidStep')); return; }
    onSave({ ...draft, title: draft.title.trim(), ingredients, steps });
  };
  return <ModalShell language={language} title={recipe ? tr(language, 'modal.editRecipe') : tr(language, 'modal.newRecipe')} eyebrow={tr(language, 'modal.recipeDetails')} onClose={onClose} wide><form className="editor-form" onSubmit={submit}><div className="form-grid two-col"><label><span>{tr(language, 'form.recipeName')}</span><input autoFocus value={draft.title} onChange={(event) => setField('title', event.target.value)} placeholder={language === 'lt' ? 'Pvz., makaronai su pomidorais' : 'e.g. Weeknight tomato pasta'} /></label><label><span>{tr(language, 'form.category')}</span><input value={draft.category} onChange={(event) => setField('category', event.target.value)} placeholder={language === 'lt' ? 'Pvz., greita vakarienė' : 'e.g. Quick dinner'} /></label><label className="full-span"><span>{tr(language, 'form.description')}</span><textarea rows={2} value={draft.description} onChange={(event) => setField('description', event.target.value)} /></label><label><span>{tr(language, 'form.minutes')}</span><input inputMode="numeric" type="number" min="1" value={draft.minutes} onChange={(event) => setField('minutes', Number(event.target.value) || 1)} /></label><label><span>{tr(language, 'form.servings')}</span><input inputMode="numeric" type="number" min="1" value={draft.servings} onChange={(event) => setField('servings', Number(event.target.value) || 1)} /></label></div><div className="editor-section"><div className="editor-section-head"><div><h3>{tr(language, 'form.ingredients')}</h3><p>{tr(language, 'form.ingredientsHint')}</p></div><button type="button" className="small-action" onClick={() => setField('ingredients', [...draft.ingredients, { id: makeId('ingredient'), name: '', amount: 1, unit: 'pcs', category: 'Produce' }])}><Icon name="plus" size={15} />{tr(language, 'form.addIngredient')}</button></div><div className="ingredient-editor">{draft.ingredients.map((ingredient) => <div className="ingredient-edit-row" key={ingredient.id}><input aria-label={tr(language, 'form.foodName')} value={ingredient.name} onChange={(event) => updateIngredient(ingredient.id, { name: event.target.value })} placeholder={tr(language, 'form.foodName')} /><input aria-label={tr(language, 'form.quantity')} inputMode="decimal" type="number" min="0" step="0.01" value={ingredient.amount} onChange={(event) => updateIngredient(ingredient.id, { amount: Number(event.target.value) || 0 })} /><select aria-label={tr(language, 'form.unit')} value={ingredient.unit} onChange={(event) => updateIngredient(ingredient.id, { unit: event.target.value as Unit })}>{UNITS.map((unit) => <option value={unit} key={unit}>{unitLabel(unit, language)}</option>)}</select><select aria-label={tr(language, 'form.category')} value={ingredient.category} onChange={(event) => updateIngredient(ingredient.id, { category: event.target.value as PantryCategory })}>{categoryOptions.map((category) => <option value={category} key={category}>{categoryLabel(category, language)}</option>)}</select><button type="button" className="icon-button danger-hover" onClick={() => setField('ingredients', draft.ingredients.filter((item) => item.id !== ingredient.id))} aria-label={`${tr(language, 'common.remove')} ${ingredient.name || tr(language, 'form.foodName')}`}><Icon name="trash" size={17} /></button></div>)}</div></div><div className="editor-section"><div className="editor-section-head"><div><h3>{tr(language, 'form.method')}</h3><p>{tr(language, 'form.methodHint')}</p></div><button type="button" className="small-action" onClick={() => setField('steps', [...draft.steps, ''])}><Icon name="plus" size={15} />{tr(language, 'form.addStep')}</button></div><div className="steps-editor">{draft.steps.map((step, index) => <div className="step-edit-row" key={`step-${index}`}><span>{index + 1}</span><textarea aria-label={`${tr(language, 'form.method')} ${index + 1}`} rows={2} value={step} onChange={(event) => updateStep(index, event.target.value)} placeholder={tr(language, 'form.stepPlaceholder')} /><button type="button" className="icon-button danger-hover" onClick={() => setField('steps', draft.steps.filter((_, stepIndex) => stepIndex !== index))} aria-label={`${tr(language, 'common.remove')} ${tr(language, 'form.method')} ${index + 1}`}><Icon name="trash" size={17} /></button></div>)}</div></div>{error && <p className="form-error" role="alert"><Icon name="info" size={16} />{error}</p>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>{tr(language, 'common.cancel')}</button><button type="submit" className="button button-primary">{tr(language, 'common.save')} <Icon name="arrow" size={17} /></button></div></form></ModalShell>;
}

function PantryEditor({ language, item, onClose, onSave }: { language: Language; item: PantryItem | null; onClose: () => void; onSave: (draft: PantryDraft) => void }) {
  const [draft, setDraft] = useState<PantryDraft>(() => item ? { name: foodLabel(item.name, language), quantity: item.quantity, unit: item.unit, category: item.category, expiresAt: item.expiresAt || '' } : emptyPantry);
  const [error, setError] = useState('');
  const setField = <K extends keyof PantryDraft>(field: K, value: PantryDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!draft.name.trim()) { setError(tr(language, 'form.invalidFoodName')); return; } if (draft.quantity <= 0) { setError(tr(language, 'form.invalidQuantity')); return; } onSave({ ...draft, name: draft.name.trim() }); };
  return <ModalShell language={language} title={item ? tr(language, 'modal.editFood') : tr(language, 'modal.newFood')} eyebrow={tr(language, 'pantry.eyebrow')} onClose={onClose}><form className="editor-form" onSubmit={submit}><label><span>{tr(language, 'form.foodName')}</span><input autoFocus value={draft.name} onChange={(event) => setField('name', event.target.value)} placeholder={language === 'lt' ? 'Pvz., pomidorai' : 'e.g. Tomatoes'} /></label><div className="form-grid two-col"><label><span>{tr(language, 'form.quantity')}</span><input inputMode="decimal" type="number" min="0" step="0.01" value={draft.quantity} onChange={(event) => setField('quantity', Number(event.target.value) || 0)} /></label><label><span>{tr(language, 'form.unit')}</span><select value={draft.unit} onChange={(event) => setField('unit', event.target.value as Unit)}>{UNITS.map((unit) => <option value={unit} key={unit}>{unitLabel(unit, language)}</option>)}</select></label><label><span>{tr(language, 'form.category')}</span><select value={draft.category} onChange={(event) => setField('category', event.target.value as PantryCategory)}>{categoryOptions.map((category) => <option value={category} key={category}>{categoryLabel(category, language)}</option>)}</select></label><label><span>{tr(language, 'form.expiry')} <em>{tr(language, 'form.optional')}</em></span><input type="date" value={draft.expiresAt} onChange={(event) => setField('expiresAt', event.target.value)} /></label></div>{error && <p className="form-error" role="alert"><Icon name="info" size={16} />{error}</p>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>{tr(language, 'common.cancel')}</button><button type="submit" className="button button-primary">{tr(language, 'common.save')} <Icon name="arrow" size={17} /></button></div></form></ModalShell>;
}

function ShoppingEditor({ language, onClose, onSave }: { language: Language; onClose: () => void; onSave: (draft: ShoppingDraft) => void }) {
  const [draft, setDraft] = useState<ShoppingDraft>(emptyShopping);
  const [error, setError] = useState('');
  const setField = <K extends keyof ShoppingDraft>(field: K, value: ShoppingDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!draft.name.trim()) { setError(tr(language, 'form.invalidFoodName')); return; } onSave({ ...draft, name: draft.name.trim() }); };
  return <ModalShell language={language} title={tr(language, 'modal.newShopping')} eyebrow={tr(language, 'shopping.eyebrow')} onClose={onClose}><form className="editor-form" onSubmit={submit}><label><span>{tr(language, 'form.foodName')}</span><input autoFocus value={draft.name} onChange={(event) => setField('name', event.target.value)} placeholder={language === 'lt' ? 'Pvz., šviežias bazilikas' : 'e.g. Fresh basil'} /></label><div className="form-grid two-col"><label><span>{tr(language, 'form.quantity')}</span><input inputMode="decimal" type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => setField('amount', Number(event.target.value) || 0)} /></label><label><span>{tr(language, 'form.unit')}</span><select value={draft.unit} onChange={(event) => setField('unit', event.target.value as Unit)}>{UNITS.map((unit) => <option value={unit} key={unit}>{unitLabel(unit, language)}</option>)}</select></label><label className="full-span"><span>{tr(language, 'form.category')}</span><select value={draft.category} onChange={(event) => setField('category', event.target.value as PantryCategory)}>{categoryOptions.map((category) => <option value={category} key={category}>{categoryLabel(category, language)}</option>)}</select></label></div>{error && <p className="form-error" role="alert"><Icon name="info" size={16} />{error}</p>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>{tr(language, 'common.cancel')}</button><button type="submit" className="button button-primary">{tr(language, 'common.save')} <Icon name="arrow" size={17} /></button></div></form></ModalShell>;
}

function formatToday(language: Language) {
  return new Intl.DateTimeFormat(language === 'lt' ? 'lt-LT' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
}

function formatDate(iso: string | undefined, language: Language) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(language === 'lt' ? 'lt-LT' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00`));
}

function recipeCount(count: number, language: Language) {
  if (language === 'lt') return `${count} ${count === 1 ? 'receptas paruoštas' : 'receptai paruošti'}`;
  return `${count} recipe${count === 1 ? '' : 's'} ready now`;
}

export default App;
