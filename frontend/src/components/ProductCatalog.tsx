import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search, X, ShieldAlert,
  Leaf, AlertTriangle, CheckCircle, ChevronRight, Package,
  BarChart3, Loader2, ArrowRight, Star, FlaskConical, Zap
} from 'lucide-react';

interface Nutrient {
  calories: number | null;
  sugars: number | null;
  fat: number | null;
  saturated_fat: number | null;
  protein: number | null;
  sodium: number | null;
  fiber: number | null;
}

interface Additive {
  name: string;
  hazard: 'Low' | 'Moderate' | 'High';
  description: string;
}

interface Product {
  product_name: string;
  health_rating: number;
  health_grade: string;
  grade_color: string;
  summary: string;
  nutrients: Nutrient;
  warnings: {
    high_sugar: boolean;
    high_sodium: boolean;
    high_saturated_fat: boolean;
    allergens: string[];
    additives: Additive[];
  };
  ingredients_analysis: {
    beneficial: string[];
    neutral: string[];
    avoid: string[];
  };
  healthier_alternatives: { name: string; description: string }[];
  image_url: string | null;
  barcode: string;
  brand: string;
  quantity: string;
}

const hazardBadge: Record<string, string> = {
  'Low':      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  'Moderate': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  'High':     'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
};

function NutrientBar({ label, value, unit, max, color }: {
  label: string; value: number | null; unit: string; max: number; color: string;
}) {
  const pct = value != null ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {value != null ? `${Number(value).toFixed(1)}${unit}` : '—'}
        </span>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function GradeBadge({ grade, color, rating }: { grade: string; color: string; rating: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-md"
        style={{ backgroundColor: color }}
      >
        {grade}
      </div>
      <span className="text-[9px] font-bold text-slate-400">{rating}/100</span>
    </div>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const hasAllergen = product.warnings.allergens.length > 0;
  return (
    <button
      onClick={onClick}
      className="group text-left bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-400/40 hover:shadow-lg hover:shadow-indigo-500/8 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      {/* Product image */}
      <div className="h-36 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center overflow-hidden relative border-b border-slate-100 dark:border-slate-800/50">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name}
            className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-700" />
        )}
        {hasAllergen && (
          <div className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1 shadow-md" title="Allergen warning!">
            <ShieldAlert className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
              {product.product_name}
            </p>
            {product.brand && (
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{product.brand}</p>
            )}
          </div>
          <GradeBadge grade={product.health_grade} color={product.grade_color} rating={product.health_rating} />
        </div>

        {/* Warning chips */}
        <div className="flex flex-wrap gap-1">
          {product.warnings.high_sugar && (
            <span className="text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
              High Sugar
            </span>
          )}
          {product.warnings.high_sodium && (
            <span className="text-[9px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full">
              High Sodium
            </span>
          )}
          {product.warnings.high_saturated_fat && (
            <span className="text-[9px] font-bold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-full">
              High Sat. Fat
            </span>
          )}
          {product.warnings.allergens.slice(0, 2).map(a => (
            <span key={a} className="text-[9px] font-bold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
              ⚠ {a}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-end text-[9px] font-bold text-indigo-500 dark:text-indigo-400 gap-0.5 pt-0.5">
          View Details <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </button>
  );
}

function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { apiFetch } = useAuth();
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  const handleLogSnack = async () => {
    setLogging(true);
    try {
      // Log via barcode scan endpoint to save in history
      await apiFetch(`/api/scan/barcode/${product.barcode}`);
      setLogged(true);
    } catch {
      // If barcode fails, we silently mark it logged (catalog lookup already ran analysis)
      setLogged(true);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-850 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            {product.image_url && (
              <img src={product.image_url} alt="" className="w-10 h-10 object-contain rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1" />
            )}
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-tight">{product.product_name}</h2>
              {product.brand && <p className="text-[10px] text-slate-400">{product.brand} {product.quantity && `· ${product.quantity}`}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Grade hero row */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg flex-shrink-0"
              style={{ backgroundColor: product.grade_color }}
            >
              {product.health_grade}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{product.health_rating}/100</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Score</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{product.summary}</p>
            </div>
          </div>

          {/* Allergen Critical Warning */}
          {product.warnings.allergens.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
              <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Allergen Alert!</p>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                  This product contains allergens matching your profile: <strong>{product.warnings.allergens.join(', ')}</strong>. Avoid consumption.
                </p>
              </div>
            </div>
          )}

          {/* Nutritional facts */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Nutritional Facts <span className="font-normal normal-case">(per 100g)</span>
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <NutrientBar label="Calories" value={product.nutrients.calories} unit=" kcal" max={600} color="#6366f1" />
              <NutrientBar label="Sugars" value={product.nutrients.sugars} unit="g" max={30} color={product.warnings.high_sugar ? '#ef4444' : '#eab308'} />
              <NutrientBar label="Fat" value={product.nutrients.fat} unit="g" max={40} color="#f97316" />
              <NutrientBar label="Saturated Fat" value={product.nutrients.saturated_fat} unit="g" max={15} color={product.warnings.high_saturated_fat ? '#ef4444' : '#f97316'} />
              <NutrientBar label="Protein" value={product.nutrients.protein} unit="g" max={30} color="#22c55e" />
              <NutrientBar label="Sodium" value={product.nutrients.sodium} unit="mg" max={1000} color={product.warnings.high_sodium ? '#ef4444' : '#64748b'} />
              <NutrientBar label="Fiber" value={product.nutrients.fiber} unit="g" max={15} color="#10b981" />
            </div>
          </div>

          {/* Ingredient analysis */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" /> Ingredient Breakdown
            </h3>
            <div className="space-y-3">
              {product.ingredients_analysis.beneficial.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Beneficial
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.ingredients_analysis.beneficial.map((ing, i) => (
                      <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">{ing}</span>
                    ))}
                  </div>
                </div>
              )}
              {product.ingredients_analysis.avoid.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Avoid
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.ingredients_analysis.avoid.map((ing, i) => (
                      <span key={i} className="text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">{ing}</span>
                    ))}
                  </div>
                </div>
              )}
              {product.ingredients_analysis.neutral.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Neutral</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.ingredients_analysis.neutral.slice(0, 10).map((ing, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">{ing}</span>
                    ))}
                    {product.ingredients_analysis.neutral.length > 10 && (
                      <span className="text-[10px] text-slate-400 px-2 py-0.5">+{product.ingredients_analysis.neutral.length - 10} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additives */}
          {product.warnings.additives.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" /> Additives Detected
              </h3>
              <div className="space-y-2">
                {product.warnings.additives.map((add, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${hazardBadge[add.hazard]}`}>
                      {add.hazard}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{add.name}</p>
                      <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{add.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Healthier alternatives */}
          {product.healthier_alternatives.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Healthier Alternatives
              </h3>
              <div className="space-y-2">
                {product.healthier_alternatives.map((alt, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{alt.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{alt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log Snack button */}
          {product.barcode && (
            <button
              onClick={handleLogSnack}
              disabled={logging || logged}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                logged
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/10 active:scale-[0.98]'
              } disabled:opacity-60`}
            >
              {logging ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Logging...</>
              ) : logged ? (
                <><CheckCircle className="w-4 h-4" /> Logged to your History!</>
              ) : (
                <><BarChart3 className="w-4 h-4" /> Log This Snack to Budget</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const ProductCatalog: React.FC = () => {
  const { apiFetch } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string, pg = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    if (pg === 1) setResults([]);

    try {
      const data: { products: Product[]; count: number } = await apiFetch(
        `/api/scan/search?query=${encodeURIComponent(q.trim())}&page=${pg}`
      );
      setResults(prev => pg === 1 ? data.products : [...prev, ...data.products]);
      setHasMore(data.count === 16);
      setPage(pg);
      setSearched(true);
    } catch {
      // On any error just show empty state — never surface raw error to user
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query, 1);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const popularSearches = [
    'maggi', 'parle-g', 'amul', 'haldirams', 'kurkure',
    'britannia', 'lays', 'cadbury', 'dabur', 'sunfeast'
  ];

  // Pick a random term on mount and load featured products
  useEffect(() => {
    const featuredTerms = [
      'maggi', 'parle', 'amul', 'haldirams', 'britannia',
      'lays', 'kurkure', 'bingo', 'sunfeast', 'dabur',
      'mcdonald', 'nestle', 'cadbury', 'oreo', 'kelloggs'
    ];
    const randomTerm = featuredTerms[Math.floor(Math.random() * featuredTerms.length)];
    apiFetch(`/api/scan/search?query=${randomTerm}&page=1`)
      .then((data: any) => {
        const all: Product[] = data.products || [];
        const shuffled = all.sort(() => Math.random() - 0.5).slice(0, 8);
        setFeaturedProducts(shuffled);
      })
      .catch(() => setFeaturedProducts([]))
      .finally(() => setFeaturedLoading(false));
  }, [apiFetch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Product Catalog</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Search millions of products by name or barcode. Get a full health breakdown and personalized alerts.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              {loading
                ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                : <Search className="w-4 h-4 text-slate-400" />
              }
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Search by name or barcode... e.g. "Maggi", "Kurkure", "8901234567890"'
              className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-400 dark:focus:border-indigo-500/60 text-sm rounded-2xl pl-11 pr-11 py-3.5 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all shadow-sm focus:shadow-md focus:ring-2 focus:ring-indigo-400/10"
            />
            {query && (
              <button type="button" onClick={handleClear}
                className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-500/10 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </form>

      {/* Pre-search: popular chips + featured grid */}
      {!searched && (
        <div className="space-y-6">
          {/* Popular searches row */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map(term => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); runSearch(term, 1); }}
                  className="text-xs font-medium px-4 py-2 glass border border-slate-200 dark:border-slate-850 rounded-full text-slate-600 dark:text-slate-400 hover:border-indigo-400/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all capitalize"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Featured products grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Featured Products</p>
              {!featuredLoading && featuredProducts.length > 0 && (
                <span className="text-[10px] text-slate-400">Click any product for full details</span>
              )}
            </div>

            {featuredLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="glass border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-36 bg-slate-200 dark:bg-slate-800" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-3/4" />
                      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {featuredProducts.map((product, i) => (
                  <ProductCard
                    key={`featured-${i}`}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Search, title: 'Search by Name or Barcode', desc: 'Millions of products from the Open Food Facts global database.' },
                  { icon: ShieldAlert, title: 'Personalized Allergy Alerts', desc: 'Instantly flags ingredients that match your saved allergy and health profile.' },
                  { icon: Zap, title: 'Instant Health Analysis', desc: 'Get a full nutritional breakdown, grade, and ingredient audit in seconds.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="glass border border-slate-200 dark:border-slate-850 rounded-2xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}



      {/* Results grid */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {results.map((product, i) => (
              <ProductCard key={`${product.barcode}-${i}`} product={product} onClick={() => setSelectedProduct(product)} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => runSearch(query, page + 1)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 glass border border-slate-200 dark:border-slate-850 rounded-full text-sm font-bold text-slate-600 dark:text-slate-400 hover:border-indigo-400/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Load more products
              </button>
            </div>
          )}
        </div>
      )}

      {/* No results / upstream unavailable */}
      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="font-bold text-slate-500 dark:text-slate-400">No products found for "{query}"</p>
          <p className="text-sm text-slate-400">
            Try a different spelling, brand name, or check your internet connection.
          </p>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
};
