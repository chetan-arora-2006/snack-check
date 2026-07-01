export interface Additive {
  name: string;
  hazard: string; // Low, Moderate, High
  description: string;
}

export interface Nutrients {
  calories: number | null;
  sugars: number | null;
  fat: number | null;
  saturated_fat: number | null;
  protein: number | null;
  sodium: number | null;
  fiber: number | null;
}

export interface Warnings {
  high_sugar: boolean;
  high_sodium: boolean;
  high_saturated_fat: boolean;
  allergens: string[];
  additives: Additive[];
}

export interface IngredientsAnalysis {
  beneficial: string[];
  neutral: string[];
  avoid: string[];
}

export interface Alternative {
  name: string;
  description: string;
}

export interface ScanReport {
  product_name: string;
  health_rating: number;
  health_grade: string;
  grade_color: string;
  summary: string;
  nutrients: Nutrients;
  warnings: Warnings;
  ingredients_analysis: IngredientsAnalysis;
  healthier_alternatives: Alternative[];
}

export interface ScanDB {
  id: string;
  user_id: string | null;
  member_id?: string | null;
  filename: string;
  mime: string;
  result: ScanReport;
  created_at: string; // ISO datetime string
}
