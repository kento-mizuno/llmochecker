// LLMO無料診断 TypeScript型定義

// ======================
// 基本エンティティ
// ======================

export interface Diagnosis {
  id: string;
  url: string;
  url_hash: string; // URL正規化後のハッシュ値
  total_score: number; // 0-100の総合スコア
  status: DiagnosisStatus;
  created_at: string; // ISO 8601形式
  updated_at: string; // ISO 8601形式
  completed_at?: string; // 診断完了日時
  error_message?: string; // エラー時のメッセージ
}

export type DiagnosisStatus = 
  | 'pending'     // 開始待ち
  | 'analyzing'   // URL解析中
  | 'crawling'    // HTML取得中
  | 'evaluating'  // 基本評価中
  | 'ai_analyzing'// AI分析中
  | 'completed'   // 完了
  | 'failed'      // 失敗
  | 'partial';    // 部分完了

// 評価項目マスタデータ
export interface EvaluationCriteria {
  id: string;
  name: string; // 項目名（日本語）
  category: EvaluationCategory;
  impact: EvaluationImpact;
  description: string;
  llmo_reason: string; // LLMOにおける重要性の理由
  weight: number; // スコア計算時の重み（0-1）
  order: number; // 表示順序
}

export type EvaluationCategory = 
  | 'e_e_a_t'           // E-E-A-T
  | 'entity'            // エンティティ
  | 'quality'           // 品質と独創性
  | 'ai_friendly'       // AIフレンドリー
  | 'document_hierarchy'// 文書階層
  | 'language_clarity'  // 言語の明確性
  | 'technical';        // 技術的シグナル

export type EvaluationImpact = 
  | 'critical'    // 最重要
  | 'important'   // 重要
  | 'moderate'    // 中程度
  | 'low';        // 低/投機的

// 各診断の評価結果
export interface Evaluation {
  id: string;
  diagnosis_id: string;
  criteria_id: string;
  score: number; // 0-100の項目別スコア
  status: EvaluationStatus;
  reason: string; // 評価理由
  ai_analysis?: string; // Gemini による詳細分析
  created_at: string;
}

export type EvaluationStatus = 
  | 'pass'        // 合格
  | 'fail'        // 不合格
  | 'needs_improvement'; // 改善の余地あり

// 改善提案
export interface Improvement {
  id: string;
  diagnosis_id: string;
  criteria_id?: string; // 対応する評価項目（任意）
  priority: ImprovementPriority;
  title: string;
  description: string;
  action_items: string[]; // 具体的なアクション項目
  implementation_example?: string; // 実装例
  estimated_impact: number; // 予想される改善効果（0-100）
  created_at: string;
}

export type ImprovementPriority = 
  | 'high'    // 高優先度
  | 'medium'  // 中優先度
  | 'low';    // 低優先度

// ======================
// API リクエスト/レスポンス
// ======================

// 診断開始リクエスト
export interface StartDiagnosisRequest {
  url: string;
  force_refresh?: boolean; // キャッシュを無視して再診断
}

// 診断開始レスポンス
export interface StartDiagnosisResponse {
  diagnosis_id: string;
  status: DiagnosisStatus;
  estimated_duration: number; // 予想完了時間（秒）
  is_cached?: boolean; // キャッシュされた結果かどうか
}

// 診断結果取得レスポンス
export interface DiagnosisResultResponse {
  diagnosis: Diagnosis;
  evaluations: EvaluationWithCriteria[];
  improvements: Improvement[];
  category_scores: CategoryScore[];
  benchmark_comparison?: BenchmarkComparison;
}

// 評価結果（評価基準情報付き）
export interface EvaluationWithCriteria extends Evaluation {
  criteria: EvaluationCriteria;
}

// カテゴリ別スコア
export interface CategoryScore {
  category: EvaluationCategory;
  category_name: string;
  score: number; // 0-100
  max_possible_score: number;
  evaluation_count: number;
  passed_count: number;
}

// ベンチマーク比較（オプション機能）
export interface BenchmarkComparison {
  industry_average: number;
  percentile: number; // 上位何%かの表示
  better_than_percentage: number; // 何%のサイトより良いか
}

// ======================
// フロントエンド状態管理
// ======================

// Zustand ストア用の診断状態
export interface DiagnosisState {
  currentDiagnosis?: Diagnosis;
  evaluations: EvaluationWithCriteria[];
  improvements: Improvement[];
  categoryScores: CategoryScore[];
  progress: DiagnosisProgress;
  error?: string;
  isLoading: boolean;
}

// 診断進捗情報
export interface DiagnosisProgress {
  percentage: number; // 0-100
  current_stage: DiagnosisStatus;
  stage_description: string;
  estimated_remaining_seconds?: number;
  completed_evaluations?: number;
  total_evaluations?: number;
}

// ======================
// Gemini API 連携
// ======================

// Gemini 分析リクエスト
export interface GeminiAnalysisRequest {
  url: string;
  html_content: string;
  meta_data: SiteMetaData;
  evaluation_criteria: EvaluationCriteria[];
  target_categories?: EvaluationCategory[]; // 分析対象カテゴリ
}

// サイトメタデータ
export interface SiteMetaData {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  og_info?: OpenGraphInfo;
  schema_data?: SchemaData[];
  robots_txt?: string;
  sitemap_urls?: string[];
}

// OpenGraph 情報
export interface OpenGraphInfo {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  site_name?: string;
}

// 構造化データ
export interface SchemaData {
  type: string; // Organization, Person, FAQPage など
  data: Record<string, any>;
}

// Gemini 分析レスポンス
export interface GeminiAnalysisResponse {
  e_e_a_t_analysis: EEATAnalysis;
  content_quality: ContentQualityAnalysis;
  improvement_suggestions: GeminiImprovementSuggestion[];
  overall_assessment: OverallAssessment;
}

// E-E-A-T 分析結果
export interface EEATAnalysis {
  experience_score: number; // 0-100
  experience_evidence: string[];
  expertise_score: number;
  expertise_evidence: string[];
  authoritativeness_score: number;
  authoritativeness_evidence: string[];
  trustworthiness_score: number;
  trustworthiness_evidence: string[];
}

// コンテンツ品質分析
export interface ContentQualityAnalysis {
  originality_score: number; // 0-100
  accuracy_score: number;
  verification_sources: string[];
  content_structure_score: number;
  readability_score: number;
}

// Gemini による改善提案
export interface GeminiImprovementSuggestion {
  category: EvaluationCategory;
  priority: ImprovementPriority;
  title: string;
  description: string;
  specific_actions: string[];
  implementation_example?: string;
  expected_impact: number; // 0-100
}

// 総合評価
export interface OverallAssessment {
  llmo_readiness_score: number; // 0-100
  key_strengths: string[];
  critical_weaknesses: string[];
  next_steps: string[];
}

// ======================
// 内部処理用インターフェース
// ======================

// サイトクローリング結果
export interface CrawlResult {
  url: string;
  html_content: string;
  meta_data: SiteMetaData;
  technical_info: TechnicalInfo;
  crawl_errors?: CrawlError[];
}

// 技術的情報
export interface TechnicalInfo {
  is_https: boolean;
  response_time_ms: number;
  mobile_friendly: boolean;
  page_speed_score?: number;
  core_web_vitals?: CoreWebVitals;
  has_robots_txt: boolean;
  has_sitemap: boolean;
  has_llms_txt: boolean;
}

// Core Web Vitals
export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
}

// クローリングエラー
export interface CrawlError {
  type: 'network' | 'timeout' | 'blocked' | 'javascript' | 'other';
  message: string;
  url?: string;
}

// ======================
// レポート生成用
// ======================

// 診断レポート（完全版）
export interface DiagnosisReport {
  diagnosis: Diagnosis;
  summary: ReportSummary;
  category_details: CategoryDetail[];
  improvements: Improvement[];
  benchmark_comparison?: BenchmarkComparison;
  generated_at: string;
}

// レポートサマリー
export interface ReportSummary {
  total_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[]; // 強みとなる項目
  weaknesses: string[]; // 改善が必要な項目
  quick_wins: Improvement[]; // 簡単に改善できる項目
  high_impact: Improvement[]; // 効果の高い改善項目
}

// カテゴリ詳細
export interface CategoryDetail {
  category: EvaluationCategory;
  category_name: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  evaluations: EvaluationWithCriteria[];
  summary: string;
  key_recommendations: string[];
}

// ======================
// ユーティリティ型
// ======================

// API共通レスポンス
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// ページネーション
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// 診断履歴用（セッション内表示）
export interface DiagnosisHistory {
  diagnoses: DiagnosisSummary[];
}

export interface DiagnosisSummary {
  id: string;
  url: string;
  total_score: number;
  status: DiagnosisStatus;
  created_at: string;
}