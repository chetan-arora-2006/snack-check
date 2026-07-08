import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search, X, ShieldAlert,
  Leaf, AlertTriangle, CheckCircle, ChevronRight, Package,
  BarChart3, Loader2, ArrowRight, Star, FlaskConical, Zap, RefreshCw
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



const curatedIndianProducts: Product[] = [
  {
    product_name: 'Maggi 2-Minute Masala Noodles',
    health_rating: 54,
    health_grade: 'D',
    grade_color: '#eab308',
    summary: 'A familiar Indian instant noodle option. Best kept occasional because it is refined and usually high in sodium.',
    nutrients: { calories: 420, sugars: 3.5, fat: 14, saturated_fat: 6, protein: 8, sodium: 980, fiber: 2.5 },
    warnings: { high_sugar: false, high_sodium: true, high_saturated_fat: true, allergens: ['Gluten'], additives: [] },
    ingredients_analysis: { beneficial: [], neutral: ['wheat flour', 'spices'], avoid: ['refined flour', 'palm oil'] },
    healthier_alternatives: [{ name: 'Vegetable poha', description: 'Lower sodium and easier to balance with vegetables and peanuts.' }],
    image_url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400',
    barcode: 'india-curated-maggi',
    brand: 'Maggi',
    quantity: '70 g'
  },
  {
    product_name: 'Parle-G Original Gluco Biscuits',
    health_rating: 48,
    health_grade: 'D',
    grade_color: '#eab308',
    summary: 'A classic Indian biscuit, but it is sugar-forward and made with refined flour.',
    nutrients: { calories: 450, sugars: 25, fat: 12, saturated_fat: 5, protein: 7, sodium: 420, fiber: 2 },
    warnings: { high_sugar: true, high_sodium: false, high_saturated_fat: false, allergens: ['Gluten', 'Dairy'], additives: [] },
    ingredients_analysis: { beneficial: [], neutral: ['milk solids'], avoid: ['sugar', 'refined wheat flour'] },
    healthier_alternatives: [{ name: 'Roasted chana', description: 'More protein and fiber with less added sugar.' }],
    image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
    barcode: 'india-curated-parleg',
    brand: 'Parle',
    quantity: '250 g'
  },
  {
    product_name: 'Haldiram Bhujia',
    health_rating: 42,
    health_grade: 'F',
    grade_color: '#ef4444',
    summary: 'Crunchy Indian namkeen with high fat and sodium. Better as a small portion snack.',
    nutrients: { calories: 560, sugars: 2, fat: 36, saturated_fat: 11, protein: 13, sodium: 950, fiber: 5 },
    warnings: { high_sugar: false, high_sodium: true, high_saturated_fat: true, allergens: [], additives: [] },
    ingredients_analysis: { beneficial: ['gram flour'], neutral: ['spices'], avoid: ['palm oil', 'excess salt'] },
    healthier_alternatives: [{ name: 'Masala makhana', description: 'Crunchy, lighter, and easier to portion.' }],
    image_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527fdcac?w=400',
    barcode: 'india-curated-haldiram-bhujia',
    brand: 'Haldiram',
    quantity: '200 g'
  },
  {
    product_name: 'Kurkure Masala Munch',
    health_rating: 38,
    health_grade: 'F',
    grade_color: '#ef4444',
    summary: 'Popular Indian extruded snack with high sodium and processed starches.',
    nutrients: { calories: 545, sugars: 4, fat: 31, saturated_fat: 13, protein: 6, sodium: 1040, fiber: 3 },
    warnings: { high_sugar: false, high_sodium: true, high_saturated_fat: true, allergens: [], additives: [] },
    ingredients_analysis: { beneficial: [], neutral: ['rice meal', 'corn meal'], avoid: ['palm oil', 'flavour enhancers'] },
    healthier_alternatives: [{ name: 'Homemade bhel', description: 'Add peanuts, onions, tomato, and less sev for better balance.' }],
    image_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527fdcac?w=400',
    barcode: 'india-curated-kurkure',
    brand: 'Kurkure',
    quantity: '90 g'
  },
  {
    product_name: 'Amul Kool Kesar',
    health_rating: 62,
    health_grade: 'C',
    grade_color: '#eab308',
    summary: 'Milk-based Indian drink with protein, but it can add a fair amount of sugar.',
    nutrients: { calories: 90, sugars: 12, fat: 2, saturated_fat: 1.3, protein: 3.2, sodium: 55, fiber: 0 },
    warnings: { high_sugar: false, high_sodium: false, high_saturated_fat: false, allergens: ['Dairy'], additives: [] },
    ingredients_analysis: { beneficial: ['milk'], neutral: ['kesar flavour'], avoid: ['added sugar'] },
    healthier_alternatives: [{ name: 'Plain chaas', description: 'Lower sugar and still dairy-based.' }],
    image_url: 'https://images.unsplash.com/photo-1550461716-ba4cea53b7c4?w=400',
    barcode: 'india-curated-amul-kool',
    brand: 'Amul',
    quantity: '200 ml'
  },
  {
    product_name: 'Britannia Good Day Cashew Cookies',
    health_rating: 50,
    health_grade: 'D',
    grade_color: '#eab308',
    summary: 'Indian cookie with cashew notes, but refined flour and sugar dominate.',
    nutrients: { calories: 500, sugars: 23, fat: 24, saturated_fat: 12, protein: 6, sodium: 380, fiber: 2 },
    warnings: { high_sugar: true, high_sodium: false, high_saturated_fat: true, allergens: ['Gluten', 'Tree Nuts', 'Dairy'], additives: [] },
    ingredients_analysis: { beneficial: ['cashew'], neutral: [], avoid: ['sugar', 'refined wheat flour', 'palm oil'] },
    healthier_alternatives: [{ name: 'Fruit and peanuts', description: 'Sweet, crunchy, and more filling.' }],
    image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
    barcode: 'india-curated-good-day',
    brand: 'Britannia',
    quantity: '200 g'
  },
  {
    product_name: 'Balaji Wafers Masala Masti',
    health_rating: 40,
    health_grade: 'F',
    grade_color: '#ef4444',
    summary: 'Indian potato chips with high fat and sodium. Portion size matters.',
    nutrients: { calories: 540, sugars: 2.5, fat: 34, saturated_fat: 12, protein: 6, sodium: 760, fiber: 4 },
    warnings: { high_sugar: false, high_sodium: true, high_saturated_fat: true, allergens: [], additives: [] },
    ingredients_analysis: { beneficial: [], neutral: ['potato', 'spices'], avoid: ['palm oil', 'excess salt'] },
    healthier_alternatives: [{ name: 'Roasted peanuts', description: 'Crunchy and higher in protein.' }],
    image_url: 'https://images.unsplash.com/photo-1566478989037-e924836412f1?w=400',
    barcode: 'india-curated-balaji',
    brand: 'Balaji',
    quantity: '52 g'
  },
  {
    product_name: 'Dabur Real Mixed Fruit Juice',
    health_rating: 58,
    health_grade: 'D',
    grade_color: '#eab308',
    summary: 'A common Indian packaged juice. It is convenient, but whole fruit is usually a better choice.',
    nutrients: { calories: 55, sugars: 12, fat: 0, saturated_fat: 0, protein: 0.2, sodium: 10, fiber: 0.3 },
    warnings: { high_sugar: false, high_sodium: false, high_saturated_fat: false, allergens: [], additives: [] },
    ingredients_analysis: { beneficial: ['fruit pulp'], neutral: [], avoid: ['added sugar'] },
    healthier_alternatives: [{ name: 'Whole orange or guava', description: 'More fiber and better satiety.' }],
    image_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    barcode: 'india-curated-dabur-real',
    brand: 'Dabur',
    quantity: '1 L'
  }
];

const curatedGlobalHighRatedProducts: Product[] = [
  {
    product_name: 'Quaker Oats Original',
    health_rating: 92,
    health_grade: 'A',
    grade_color: '#22c55e',
    summary: 'A widely used breakfast staple with whole-grain oats, useful fiber, and very low added sugar.',
    nutrients: { calories: 389, sugars: 1, fat: 6.9, saturated_fat: 1.2, protein: 16.9, sodium: 2, fiber: 10.6 },
    warnings: { high_sugar: false, high_sodium: false, high_saturated_fat: false, allergens: [], additives: [] },
    ingredients_analysis: { beneficial: ['whole grain oats'], neutral: [], avoid: [] },
    healthier_alternatives: [{ name: 'Steel-cut oats', description: 'A less processed oat option with a slower texture and strong satiety.' }],
    image_url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400',
    barcode: 'global-curated-quaker-oats',
    brand: 'Quaker',
    quantity: '1 kg'
  },
  {
    product_name: 'Chobani Plain Greek Yogurt',
    health_rating: 88,
    health_grade: 'B',
    grade_color: '#22c55e',
    summary: 'A high-protein plain yogurt option. Choose plain over sweetened flavors for a stronger score.',
    nutrients: { calories: 59, sugars: 3.6, fat: 0.4, saturated_fat: 0.1, protein: 10, sodium: 36, fiber: 0 },
    warnings: { high_sugar: false, high_sodium: false, high_saturated_fat: false, allergens: ['Dairy'], additives: [] },
    ingredients_analysis: { beneficial: ['cultured milk'], neutral: [], avoid: [] },
    healthier_alternatives: [{ name: 'Plain curd with fruit', description: 'A simple homemade alternative without added sugar.' }],
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    barcode: 'global-curated-greek-yogurt',
    brand: 'Chobani',
    quantity: '170 g'
  },
  {
    product_name: 'Kind Dark Chocolate Nuts & Sea Salt',
    health_rating: 78,
    health_grade: 'B',
    grade_color: '#22c55e',
    summary: 'A globally popular nut bar with useful fats and protein, though portion size still matters.',
    nutrients: { calories: 480, sugars: 18, fat: 36, saturated_fat: 7, protein: 12, sodium: 320, fiber: 7 },
    warnings: { high_sugar: true, high_sodium: false, high_saturated_fat: true, allergens: ['Tree Nuts'], additives: [] },
    ingredients_analysis: { beneficial: ['almonds', 'peanuts'], neutral: ['dark chocolate'], avoid: ['added sugar'] },
    healthier_alternatives: [{ name: 'Unsalted mixed nuts', description: 'Keeps the protein and fats while reducing added sugar.' }],
    image_url: 'https://images.unsplash.com/photo-1604085792782-8d92f276d7d8?w=400',
    barcode: 'global-curated-kind-bar',
    brand: 'Kind',
    quantity: '40 g'
  },
  {
    product_name: 'Tata Sampann Unpolished Moong Dal',
    health_rating: 94,
    health_grade: 'A',
    grade_color: '#22c55e',
    summary: 'An Indian pantry staple with strong protein and fiber for everyday meals.',
    nutrients: { calories: 347, sugars: 2, fat: 1.2, saturated_fat: 0.2, protein: 24, sodium: 15, fiber: 16 },
    warnings: { high_sugar: false, high_sodium: false, high_saturated_fat: false, allergens: [], additives: [] },
    ingredients_analysis: { beneficial: ['moong dal'], neutral: [], avoid: [] },
    healthier_alternatives: [{ name: 'Sprouted moong', description: 'Adds freshness and can be used in salads or chaat.' }],
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    barcode: 'global-curated-tata-moong',
    brand: 'Tata Sampann',
    quantity: '1 kg'
  },
  {
    product_name: 'Saffola Masala Oats',
    health_rating: 76,
    health_grade: 'B',
    grade_color: '#22c55e',
    summary: 'An Indian instant oats product that scores better than many fried snacks, though sodium should be watched.',
    nutrients: { calories: 380, sugars: 5, fat: 8, saturated_fat: 1.5, protein: 12, sodium: 560, fiber: 9 },
    warnings: { high_sugar: false, high_sodium: true, high_saturated_fat: false, allergens: ['Gluten'], additives: [] },
    ingredients_analysis: { beneficial: ['oats', 'vegetables'], neutral: ['spices'], avoid: ['excess salt'] },
    healthier_alternatives: [{ name: 'Plain oats upma', description: 'More control over salt and vegetables.' }],
    image_url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400',
    barcode: 'global-curated-saffola-oats',
    brand: 'Saffola',
    quantity: '500 g'
  },
  {
    product_name: 'Alpro Unsweetened Soya Milk',
    health_rating: 84,
    health_grade: 'B',
    grade_color: '#22c55e',
    summary: 'A commonly used dairy alternative with low sugar and moderate protein.',
    nutrients: { calories: 33, sugars: 0, fat: 1.8, saturated_fat: 0.3, protein: 3.3, sodium: 40, fiber: 0.6 },
    warnings: { high_sugar: false, high_sodium: false, high_saturated_fat: false, allergens: ['Soy'], additives: [] },
    ingredients_analysis: { beneficial: ['soya protein'], neutral: ['calcium'], avoid: [] },
    healthier_alternatives: [{ name: 'Unsweetened fortified milk', description: 'Pick whichever fits your allergies and nutrition goals.' }],
    image_url: 'https://images.unsplash.com/photo-1590111166710-85f2eb7197fa?w=400',
    barcode: 'global-curated-alpro-soya',
    brand: 'Alpro',
    quantity: '1 L'
  }
];

const shuffleArray = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

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
            loading="lazy"
            decoding="async"
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
  const { apiFetch, activeMemberId } = useAuth();
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  const handleLogSnack = async () => {
    setLogging(true);
    try {
      await apiFetch('/api/consumption/log', {
        method: 'POST',
        body: JSON.stringify({
          product_name: product.product_name,
          calories: product.nutrients.calories || 0,
          sugars: product.nutrients.sugars || 0,
          sodium: product.nutrients.sodium || 0,
          member_id: activeMemberId
        })
      });
      setLogged(true);
    } catch (err) {
      console.error('Failed to log catalog product:', err);
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
              <img src={product.image_url} alt="" loading="lazy" decoding="async" className="w-10 h-10 object-contain rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1" />
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
                <><CheckCircle className="w-4 h-4" /> Logged to Today!</>
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
    'maggi', 'parle-g', 'amul', 'haldiram', 'kurkure',
    'britannia', 'oats', 'greek yogurt', 'moong dal', 'nuts'
  ];

  const loadFeaturedProducts = useCallback(() => {
    setFeaturedLoading(true);
    // Instantly load random products from the highly curated local pool instead of waiting for external APIs
    const curatedPool = shuffleArray([...curatedGlobalHighRatedProducts, ...curatedIndianProducts]);
    setFeaturedProducts(curatedPool.slice(0, 8));
    setFeaturedLoading(false);
  }, []);

  useEffect(() => {
    loadFeaturedProducts();
  }, [loadFeaturedProducts]);

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
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Featured Picks</p>
              {!featuredLoading && featuredProducts.length > 0 && (
                <button
                  onClick={loadFeaturedProducts}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Shuffle Indian & global high-rated picks
                </button>
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
