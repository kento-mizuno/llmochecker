/**
 * LLMO診断ツール TypeScript インターフェース定義
 * 
 * このファイルには、システム全体で使用される型定義が含まれています。
 * フロントエンドとバックエンドで共通の型安全性を提供します。
 */

// =======================
// 基本的な共通型
// =======================

export type UUID = string;
export type URL = string;
export type ISODateTime = string;

export type SupportedLanguage = 'ja' | 'en';

export interface BaseEntity {
  id: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// =======================
// 診断リクエスト・レスポンス
// =======================

export interface DiagnosticRequest {
  url: URL;
  language?: SupportedLanguage;
  options?: DiagnosticOptions;
}

export interface DiagnosticOptions {
  /** 詳細な分析を実行するか（処理時間が長くなる） */
  deepAnalysis?: boolean;
  /** 特定の評価層のみを実行 */
  layers?: ('layer1' | 'layer2' | 'layer3')[];
  /** 外部API呼び出しを無効にするか */
  skipExternalAPIs?: boolean;
}

export interface DiagnosticResponse {
  id: UUID;
  url: URL;
  status: DiagnosticStatus;
  startedAt: ISODateTime;
  completedAt?: ISODateTime;
  results?: DiagnosticResults;
  error?: DiagnosticError;
  progress?: DiagnosticProgress;
}

export type DiagnosticStatus = 
  | 'pending'     // 診断待機中
  | 'processing'  // 診断実行中
  | 'completed'   // 診断完了
  | 'failed'      // 診断失敗
  | 'timeout'     // タイムアウト
  | 'partial';    // 部分完了

export interface DiagnosticError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DiagnosticProgress {
  percentage: number; // 0-100
  currentStage: string;
  estimatedTimeRemaining?: number; // 秒
}

// =======================
// 診断結果
// =======================

export interface DiagnosticResults extends BaseEntity {
  url: URL;
  totalScore: number; // 0-100
  layer1Results: Layer1Results;
  layer2Results: Layer2Results;
  layer3Results: Layer3Results;
  improvementSuggestions: ImprovementSuggestion[];
  benchmarkComparison?: BenchmarkComparison;
  metadata: DiagnosticMetadata;
}

export interface DiagnosticMetadata {
  processingTimeSeconds: number;
  // 個人情報は削除: userAgent, clientIP など
  crawledAt: ISODateTime;
  urlAfterRedirects: URL;
  responseCode: number;
  pageSize: number;
  loadTime: number;
}

// =======================
// Layer 1: 信頼性の基礎 (50%加重)
// =======================

export interface Layer1Results {
  totalScore: number; // 0-100
  weight: 0.5;
  eeatScore: EEATScore;
  entityScore: EntityScore;
  contentQualityScore: ContentQualityScore;
}

export interface EEATScore {
  totalScore: number; // 0-100
  experience: ExperienceMetrics;
  expertise: ExpertiseMetrics;
  authoritativeness: AuthoritativenessMetrics;
  trustworthiness: TrustworthinessMetrics;
}

export interface ExperienceMetrics {
  score: number; // 0-100
  firstPersonExpressions: number;
  originalImages: number;
  caseStudies: number;
  testingEvidence: boolean;
}

export interface ExpertiseMetrics {
  score: number; // 0-100
  authorInfoExists: boolean;
  qualifications: string[];
  linkedinProfile?: URL;
  professionalBackground: string[];
  ymylSpecialistRequired: boolean;
  ymylSpecialistPresent: boolean;
}

export interface AuthoritativenessMetrics {
  score: number; // 0-100
  backlinksCount: number;
  authoritativeBacklinks: number;
  mediaMentions: number;
  industryRecognition: string[];
  wikipediaPresence: boolean;
}

export interface TrustworthinessMetrics {
  score: number; // 0-100
  httpsEnabled: boolean;
  contactInfoPresent: boolean;
  privacyPolicyExists: boolean;
  termsOfServiceExists: boolean;
  externalCitationsCount: number;
  factualAccuracy: number; // 0-100
}

export interface EntityScore {
  totalScore: number; // 0-100
  knowledgeGraphPresence: boolean;
  napConsistency: NAPConsistency;
  entityDisambiguation: EntityDisambiguation;
}

export interface NAPConsistency {
  score: number; // 0-100
  nameVariations: string[];
  addressVariations: string[];
  phoneVariations: string[];
  consistencyRate: number; // 0-1
}

export interface EntityDisambiguation {
  score: number; // 0-100
  sameAsProperties: URL[];
  officialSocialProfiles: URL[];
  structuredDataPresent: boolean;
}

export interface ContentQualityScore {
  totalScore: number; // 0-100
  originalityScore: number; // 0-100
  primaryInformation: PrimaryInformationMetrics;
  citationsAndSources: CitationMetrics;
  freshness: FreshnessMetrics;
}

export interface PrimaryInformationMetrics {
  score: number; // 0-100
  uniqueDataPoints: number;
  originalResearch: boolean;
  surveysOrInterviews: boolean;
  exclusiveInsights: boolean;
}

export interface CitationMetrics {
  score: number; // 0-100
  externalLinksCount: number;
  authoritySourcesCount: number;
  citationFormat: 'inline' | 'footnotes' | 'bibliography' | 'none';
}

export interface FreshnessMetrics {
  score: number; // 0-100
  lastUpdated?: ISODateTime;
  regularlyUpdated: boolean;
  timelyContent: boolean;
}

// =======================
// Layer 2: 構造最適化 (30%加重)
// =======================

export interface Layer2Results {
  totalScore: number; // 0-100
  weight: 0.3;
  aiFormatScore: AIFormatScore;
  documentStructureScore: DocumentStructureScore;
  clarityScore: ClarityScore;
}

export interface AIFormatScore {
  totalScore: number; // 0-100
  faqFormat: FAQFormatMetrics;
  listUsage: ListUsageMetrics;
  definitionStatements: DefinitionMetrics;
  contentChunking: ChunkingMetrics;
}

export interface FAQFormatMetrics {
  score: number; // 0-100
  faqSectionExists: boolean;
  questionFormatHeadings: number;
  questionAnswerPairs: number;
}

export interface ListUsageMetrics {
  score: number; // 0-100
  orderedLists: number;
  unorderedLists: number;
  tablesCount: number;
  comparisonTables: number;
}

export interface DefinitionMetrics {
  score: number; // 0-100
  clearDefinitions: number;
  summaryBoxes: number;
  keyTakeaways: number;
}

export interface ChunkingMetrics {
  score: number; // 0-100
  selfContainedSections: number;
  logicalBreaks: boolean;
  informationHierarchy: number; // 1-5 (depth)
}

export interface DocumentStructureScore {
  totalScore: number; // 0-100
  headingStructure: HeadingStructureMetrics;
  semanticHTML: SemanticHTMLMetrics;
  outlineQuality: OutlineQualityMetrics;
}

export interface HeadingStructureMetrics {
  score: number; // 0-100
  h1Count: number;
  hierarchyValid: boolean;
  skippedLevels: number;
  maxDepth: number;
}

export interface SemanticHTMLMetrics {
  score: number; // 0-100
  articleTag: boolean;
  sectionTags: number;
  asideTags: number;
  navTag: boolean;
  figureTagsCount: number;
  genericDivRatio: number; // 0-1
}

export interface OutlineQualityMetrics {
  score: number; // 0-100
  descriptiveHeadings: number;
  logicalFlow: boolean;
  contentfulHeadings: number;
}

export interface ClarityScore {
  totalScore: number; // 0-100
  readabilityScore: number; // Flesch-Kincaid
  writingStyle: WritingStyleMetrics;
  ambiguityCheck: AmbiguityMetrics;
}

export interface WritingStyleMetrics {
  score: number; // 0-100
  conclusionFirst: boolean;
  paragraphLength: number; // average
  sentenceLength: number; // average
  passiveVoiceRatio: number; // 0-1
}

export interface AmbiguityMetrics {
  score: number; // 0-100
  vagueExpressions: number;
  promotionalLanguage: number;
  factualStatements: number;
}

// =======================
// Layer 3: 技術実装 (20%加重)
// =======================

export interface Layer3Results {
  totalScore: number; // 0-100
  weight: 0.2;
  structuredDataScore: StructuredDataScore;
  technicalHealthScore: TechnicalHealthScore;
  llmsTxtScore: LLMSTxtScore;
}

export interface StructuredDataScore {
  totalScore: number; // 0-100
  jsonLdPresent: boolean;
  validationScore: number; // 0-100
  schemaTypes: SchemaTypeMetrics;
}

export interface SchemaTypeMetrics {
  organization: SchemaValidation;
  person: SchemaValidation;
  article: SchemaValidation;
  faqPage: SchemaValidation;
  product: SchemaValidation;
  howTo: SchemaValidation;
}

export interface SchemaValidation {
  present: boolean;
  valid: boolean;
  completeness: number; // 0-100 (主要プロパティの網羅率)
  errors: string[];
}

export interface TechnicalHealthScore {
  totalScore: number; // 0-100
  crawlability: CrawlabilityMetrics;
  pageExperience: PageExperienceMetrics;
  security: SecurityMetrics;
}

export interface CrawlabilityMetrics {
  score: number; // 0-100
  robotsTxtValid: boolean;
  aiCrawlersBlocked: boolean;
  xmlSitemapExists: boolean;
  canonicalTagValid: boolean;
}

export interface PageExperienceMetrics {
  score: number; // 0-100
  coreWebVitals: CoreWebVitals;
  mobileOptimized: boolean;
  httpsEnabled: boolean;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint (seconds)
  inp: number; // Interaction to Next Paint (milliseconds)
  cls: number; // Cumulative Layout Shift
  overallScore: number; // 0-100
}

export interface SecurityMetrics {
  score: number; // 0-100
  httpsGrade: string; // A+, A, B, C, D, F
  certificateValid: boolean;
  mixedContentIssues: number;
}

export interface LLMSTxtScore {
  totalScore: number; // 0-100 (現在は投機的なため常に低い重み)
  fileExists: boolean;
  noindexSet: boolean;
  validFormat: boolean;
  note: 'speculative-standard'; // 投機的な規格であることを示す
}

// =======================
// 改善提案
// =======================

export interface ImprovementSuggestion {
  id: UUID;
  priority: SuggestionPriority;
  category: SuggestionCategory;
  title: string;
  description: string;
  actionItems: ActionItem[];
  impactEstimate: ImpactEstimate;
  implementationDifficulty: ImplementationDifficulty;
  relatedMetrics: string[];
}

export type SuggestionPriority = 
  | 'critical'    // 最優先 (Layer 1未達)
  | 'high'        // 高優先度 (Layer 2未達) 
  | 'medium'      // 中優先度 (Layer 3未達)
  | 'low';        // 低優先度 (最適化)

export type SuggestionCategory = 
  | 'e-e-a-t'
  | 'entity'
  | 'content-quality'
  | 'ai-format'
  | 'document-structure'
  | 'clarity'
  | 'structured-data'
  | 'technical-health'
  | 'speculative';

export interface ActionItem {
  step: number;
  description: string;
  example?: string;
  resources?: URL[];
}

export interface ImpactEstimate {
  scoreImprovement: number; // 予想される改善点数 (0-100)
  confidenceLevel: number; // 予想の信頼度 (0-1)
  timeToSeeResults: string; // '1-2 weeks', '1-3 months', etc.
}

export type ImplementationDifficulty = 
  | 'easy'        // 1-2時間
  | 'moderate'    // 1-2日
  | 'difficult'   // 1週間以上
  | 'expert';     // 専門知識必要

// =======================
// ベンチマーク比較
// =======================

export interface BenchmarkComparison {
  industry?: string;
  averageScore: number;
  topPercentile: number; // 90th percentile
  percentileRank: number; // このサイトの順位 (0-100)
  comparisonData: BenchmarkData[];
}

export interface BenchmarkData {
  category: string;
  yourScore: number;
  industryAverage: number;
  topPerformer: number;
}

// =======================
// APIエンドポイント共通型
// =======================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: ISODateTime;
    version: string;
    requestId: UUID;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =======================
// WebSocket メッセージ
// =======================

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
  timestamp: ISODateTime;
}

export type WebSocketMessageType = 
  | 'progress'
  | 'stage-update'
  | 'result'
  | 'error'
  | 'ping'
  | 'pong';

export interface ProgressMessage {
  diagnosticId: UUID;
  progress: DiagnosticProgress;
}

export interface StageUpdateMessage {
  diagnosticId: UUID;
  stage: string;
  details?: string;
}

export interface ResultMessage {
  diagnosticId: UUID;
  results: DiagnosticResults;
}

// =======================
// レポート生成（PDF要求時の個人情報取得）
// =======================

export interface ReportOptions {
  format: 'html' | 'pdf' | 'json';
  language: SupportedLanguage;
  includeBenchmark: boolean;
  includeDetails: boolean;
  template: 'standard' | 'executive' | 'technical';
}

export interface PDFRequest {
  id: UUID;
  diagnosticId: UUID;
  companyName: string;        // PDF要求時のみ取得
  email: string;              // PDF要求時のみ取得
  consentMarketing: boolean;  // マーケティング同意
  options: ReportOptions;
  downloadUrl?: URL;
  expiresAt: ISODateTime;
  generatedAt: ISODateTime;
}

export interface GeneratedReport {
  id: UUID;
  diagnosticId: UUID;
  options: ReportOptions;
  downloadUrl: URL;
  expiresAt: ISODateTime;
  generatedAt: ISODateTime;
}

// =======================
// 管理用インターフェース
// =======================

export interface SystemStatus {
  healthy: boolean;
  services: ServiceStatus[];
  statistics: SystemStatistics;
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  lastChecked: ISODateTime;
  error?: string;
}

export interface SystemStatistics {
  totalDiagnostics: number;
  diagnosticsToday: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  queueLength: number;
}

// =======================
// Supabase データベース型定義
// =======================

export interface Database {
  public: {
    Tables: {
      diagnostics: {
        Row: {
          id: UUID;
          url: string;
          url_normalized: string;
          status: DiagnosticStatus;
          language: SupportedLanguage;
          deep_analysis: boolean;
          layers: string[];
          skip_external_apis: boolean;
          started_at: ISODateTime;
          completed_at?: ISODateTime;
          processing_time_seconds?: number;
          total_score?: number;
          url_after_redirects?: string;
          response_code?: number;
          page_size_bytes?: number;
          load_time_ms?: number;
          error_code?: string;
          error_message?: string;
          error_details?: Record<string, unknown>;
          created_at: ISODateTime;
          updated_at: ISODateTime;
        };
        Insert: Omit<Database['public']['Tables']['diagnostics']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['diagnostics']['Insert']>;
      };
      pdf_requests: {
        Row: {
          id: UUID;
          diagnostic_id: UUID;
          company_name: string;
          email: string;
          consent_marketing: boolean;
          format: 'pdf';
          language: SupportedLanguage;
          template: 'standard' | 'executive' | 'technical';
          options: Record<string, unknown>;
          storage_bucket: string;
          storage_path?: string;
          file_size_bytes?: number;
          download_url?: string;
          generated_at: ISODateTime;
          expires_at: ISODateTime;
          downloaded_count: number;
          created_at: ISODateTime;
        };
        Insert: Omit<Database['public']['Tables']['pdf_requests']['Row'], 'id' | 'created_at' | 'generated_at'>;
        Update: Partial<Database['public']['Tables']['pdf_requests']['Insert']>;
      };
      diagnostic_progress: {
        Row: {
          id: UUID;
          diagnostic_id: UUID;
          percentage: number;
          current_stage: string;
          stage_details?: string;
          estimated_time_remaining?: number;
          updated_at: ISODateTime;
        };
        Insert: Omit<Database['public']['Tables']['diagnostic_progress']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['diagnostic_progress']['Insert']>;
      };
    };
    Views: {
      v_diagnostic_summary: {
        Row: {
          id: UUID;
          url: string;
          status: DiagnosticStatus;
          total_score?: number;
          started_at: ISODateTime;
          completed_at?: ISODateTime;
          processing_time_seconds?: number;
          layer1_score?: number;
          layer2_score?: number;
          layer3_score?: number;
          suggestion_count: number;
          critical_suggestions: number;
          high_suggestions: number;
        };
      };
    };
  };
}

// =======================
// 設定・構成
// =======================

export interface AppConfig {
  api: APIConfig;
  features: FeatureFlags;
  limits: SystemLimits;
}

export interface APIConfig {
  baseUrl: URL;
  timeout: number;
  retries: number;
  rateLimit: RateLimitConfig;
}

export interface RateLimitConfig {
  diagnose: {
    requests: number;
    window: number; // seconds
  };
  pdf_request: {
    requests: number;
    window: number;
  };
}

export interface FeatureFlags {
  deepAnalysis: boolean;
  benchmarkComparison: boolean;
  realtimeProgress: boolean;
  pdfReports: boolean;
  apiAccess: boolean;
}

export interface SystemLimits {
  maxUrlLength: number;
  maxProcessingTime: number; // seconds
  maxConcurrentJobs: number;
  cacheRetention: number; // hours
}