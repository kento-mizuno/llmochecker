# DaiLYUP × LLMO診断ツール統合仕様書

## プロジェクト概要

### 統合先サイト
- **ドメイン**: https://dailyup.co.jp/
- **技術スタック**: Next.js、React
- **テーマ**: "Dormant to Dynamic" - AI技術による変革支援
- **対象**: 日本企業のデジタル変革

### 統合目標・プライバシー方針
DaiLYUPの既存サービス「AIO（LLMO）対策」を補完する診断ツールとして、サイト内に統合。**完全匿名での診断提供**により、プライバシーを重視しながら潜在顧客の興味を喚起し、コンサルティングサービスへの導線とする。

#### プライバシーファースト設計
- **診断段階**: URLのみ取得、個人情報は一切不要
- **PDF要求段階**: 社名・メールアドレスのみ任意で取得
- **マーケティング同意**: 明示的なオプトイン方式

## 1. サイト構造統合

### URL構造
```
https://dailyup.co.jp/
├── （既存ページ）
├── llmo-diagnostic/              # 診断ツールトップ
│   ├── start                     # 診断開始
│   ├── processing/[id]           # 診断中（進捗表示）
│   ├── report/[id]               # 結果レポート
│   ├── benchmark                 # ベンチマーク比較
│   └── about                     # 診断ツールについて
└── （既存ページ）
```

### ナビゲーション統合
```typescript
// 既存のナビゲーションに追加
const navigationItems = [
  // 既存項目...
  {
    label: 'LLMO診断',
    href: '/llmo-diagnostic',
    description: 'AIに最適化されたサイトかチェック',
    icon: <AnalyticsIcon />
  }
];
```

## 2. デザインシステム統合

### カラーパレット（DaiLYUP準拠）
```css
:root {
  /* プライマリ */
  --primary-blue: #2563eb;
  --primary-blue-light: #60a5fa;
  --primary-blue-dark: #1d4ed8;
  
  /* アクセント */
  --accent-green: #10b981;
  --accent-orange: #f59e0b;
  --accent-red: #ef4444;
  
  /* ニュートラル */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-900: #111827;
  
  /* LLMO診断専用カラー */
  --llmo-score-excellent: var(--accent-green);
  --llmo-score-good: #84cc16;
  --llmo-score-average: var(--accent-orange);
  --llmo-score-poor: var(--accent-red);
}
```

### タイポグラフィ
```css
/* DaiLYUPの既存フォント設定を継承 */
.llmo-diagnostic {
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
}

.llmo-title {
  font-size: 2.25rem; /* 36px */
  font-weight: 700;
  line-height: 1.2;
  color: var(--gray-900);
}

.llmo-subtitle {
  font-size: 1.125rem; /* 18px */
  font-weight: 500;
  color: var(--gray-600);
}
```

### コンポーネントライブラリ
```typescript
// DaiLYUP共通コンポーネントを活用
import { 
  Button, 
  Card, 
  Input, 
  Badge,
  Progress,
  Modal 
} from '@/components/ui';

// LLMO専用コンポーネント
export const ScoreGauge = ({ score, label }: ScoreGaugeProps) => {
  const color = getScoreColor(score);
  return (
    <Card className="llmo-score-card">
      <div className="score-display" style={{ color }}>
        {score.toFixed(1)}
      </div>
      <p className="score-label">{label}</p>
    </Card>
  );
};
```

## 3. ページレイアウト設計

### 3.1 診断トップページ（/llmo-diagnostic）

```typescript
// pages/llmo-diagnostic/index.tsx
interface LLMODiagnosticHomeProps {
  benchmarkData: BenchmarkData;
}

export default function LLMODiagnosticHome({ benchmarkData }: LLMODiagnosticHomeProps) {
  return (
    <Layout>
      <SEOHead 
        title="LLMO診断 - AI検索最適化チェック | DaiLYUP" 
        description="あなたのWebサイトがAI検索エンジンに最適化されているかを無料で診断。ChatGPT、Claude、Gemini等での引用可能性をスコア化します。"
      />
      
      {/* ヒーローセクション */}
      <HeroSection>
        <div className="hero-content">
          <h1 className="llmo-title">
            あなたのサイトは<br />
            <span className="text-primary-blue">AIに選ばれますか？</span>
          </h1>
          <p className="llmo-subtitle mt-4">
            ChatGPT、Claude、Geminiなど主要AI検索エンジンでの
            引用・参照の可能性を無料で診断します
          </p>
          <URLInputForm className="mt-8" />
        </div>
        <div className="hero-visual">
          <LLMOIllustration />
        </div>
      </HeroSection>
      
      {/* 特徴セクション */}
      <FeaturesSection>
        <FeatureCard 
          icon={<ShieldCheckIcon />}
          title="信頼性の評価"
          description="E-E-A-T基準に基づく包括的な信頼性分析"
        />
        <FeatureCard 
          icon={<DocumentTextIcon />}
          title="構造最適化"
          description="AIが理解しやすいコンテンツ構造の診断"
        />
        <FeatureCard 
          icon={<CogIcon />}
          title="技術的健全性"
          description="Schema.orgやCore Web Vitalsの評価"
        />
      </FeaturesSection>
      
      {/* ベンチマーク情報 */}
      <BenchmarkSection data={benchmarkData} />
      
      {/* CTA：DaiLYUPサービスへの導線 */}
      <CTASection>
        <h2>さらに詳しい分析と改善提案をお求めの方へ</h2>
        <p>DaiLYUPの専門コンサルタントによる詳細なLLMO戦略策定サービス</p>
        <Button href="/contact" size="large">
          無料相談を申し込む
        </Button>
      </CTASection>
    </Layout>
  );
}
```

### 3.2 診断中ページ（/llmo-diagnostic/processing/[id]）

```typescript
// pages/llmo-diagnostic/processing/[id].tsx
export default function DiagnosticProcessing({ diagnosticId }: { diagnosticId: string }) {
  const progress = useDiagnosticProgress(diagnosticId);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResponse | null>(null);
  
  return (
    <Layout>
      <ProcessingContainer>
        <div className="processing-header">
          <h1>サイトを診断しています...</h1>
          <p className="text-gray-600">分析には約45秒程度かかります</p>
        </div>
        
        <ProgressCard>
          <Progress 
            value={progress?.percentage || 0} 
            className="mb-4"
          />
          <div className="progress-details">
            <p className="current-stage">
              {getStageLabel(progress?.currentStage)}
            </p>
            {progress?.estimatedTimeRemaining && (
              <p className="eta">残り約{progress.estimatedTimeRemaining}秒</p>
            )}
          </div>
        </ProgressCard>
        
        {/* 各層の処理状況 */}
        <ProcessingSteps>
          <StepItem 
            step={1}
            title="信頼性の分析"
            status={getStepStatus(progress, 'layer1')}
            description="E-E-A-T、エンティティ確認、コンテンツ品質"
          />
          <StepItem 
            step={2}
            title="構造の分析"
            status={getStepStatus(progress, 'layer2')}
            description="AI形式、文書構造、言語明確性"
          />
          <StepItem 
            step={3}
            title="技術的分析"
            status={getStepStatus(progress, 'layer3')}
            description="構造化データ、パフォーマンス、セキュリティ"
          />
        </ProcessingSteps>
      </ProcessingContainer>
    </Layout>
  );
}
```

### 3.3 結果レポートページ（/llmo-diagnostic/report/[id]）

```typescript
// pages/llmo-diagnostic/report/[id].tsx
export default function DiagnosticReport({ results }: { results: DiagnosticResults }) {
  return (
    <Layout>
      <ReportContainer>
        {/* スコアサマリー */}
        <ScoreSummarySection>
          <div className="main-score">
            <ScoreGauge 
              score={results.totalScore} 
              label="総合スコア"
              size="large"
            />
          </div>
          <div className="layer-scores">
            <ScoreGauge 
              score={results.layer1Results.totalScore} 
              label="信頼性"
              weight="50%"
            />
            <ScoreGauge 
              score={results.layer2Results.totalScore} 
              label="構造"
              weight="30%"
            />
            <ScoreGauge 
              score={results.layer3Results.totalScore} 
              label="技術"
              weight="20%"
            />
          </div>
        </ScoreSummarySection>
        
        {/* ベンチマーク比較 */}
        <BenchmarkComparisonSection 
          userScore={results.totalScore}
          benchmark={results.benchmarkComparison}
        />
        
        {/* 改善提案（優先順位別） */}
        <ImprovementSuggestionsSection>
          <SuggestionGroup 
            priority="critical"
            title="最優先の改善項目"
            suggestions={getCriticalSuggestions(results.improvementSuggestions)}
          />
          <SuggestionGroup 
            priority="high"
            title="重要な改善項目"
            suggestions={getHighPrioritySuggestions(results.improvementSuggestions)}
          />
          <SuggestionGroup 
            priority="medium"
            title="推奨改善項目"
            suggestions={getMediumPrioritySuggestions(results.improvementSuggestions)}
          />
        </ImprovementSuggestionsSection>
        
        {/* 詳細結果（展開可能） */}
        <DetailedResultsSection>
          <Accordion>
            <AccordionItem title="信頼性の詳細分析">
              <EEATBreakdown results={results.layer1Results.eeatScore} />
              <EntityAnalysis results={results.layer1Results.entityScore} />
              <ContentQualityAnalysis results={results.layer1Results.contentQualityScore} />
            </AccordionItem>
            <AccordionItem title="構造最適化の詳細分析">
              <AIFormatAnalysis results={results.layer2Results.aiFormatScore} />
              <DocumentStructureAnalysis results={results.layer2Results.documentStructureScore} />
              <ClarityAnalysis results={results.layer2Results.clarityScore} />
            </AccordionItem>
            <AccordionItem title="技術実装の詳細分析">
              <StructuredDataAnalysis results={results.layer3Results.structuredDataScore} />
              <TechnicalHealthAnalysis results={results.layer3Results.technicalHealthScore} />
            </AccordionItem>
          </Accordion>
        </DetailedResultsSection>
        
        {/* アクション（2段階プライバシー設計） */}
        <ActionSection>
          <div className="action-primary">
            {/* 匿名でアクセス可能なアクション */}
            <Button href="/llmo-diagnostic/start">
              別のサイトを診断
            </Button>
            <Button href="/contact" variant="primary" size="large">
              専門家に相談する
            </Button>
          </div>
          <div className="action-optional">
            {/* 個人情報提供が必要なアクション */}
            <PDFRequestForm diagnosticId={results.id} />
          </div>
        </ActionSection>
      </ReportContainer>
    </Layout>
  );
}
```

## 4. DaiLYUP既存サービスとの連携

### 4.1 AIOサービスページとの連携

既存のAIO対策サービスページに診断ツールへの導線を追加：

```typescript
// 既存のAIOサービスページに追加
const AIOServiceEnhancement = () => {
  return (
    <section className="aio-diagnostic-integration">
      <div className="integration-card">
        <h3>まずは現状を知ることから</h3>
        <p>LLMO診断ツールで、あなたのサイトのAI最適化度を無料でチェック</p>
        <Button href="/llmo-diagnostic" className="mt-4">
          無料診断を始める
        </Button>
      </div>
    </section>
  );
};
```

### 4.2 コンサルティング導線の設計

```typescript
// 診断結果に基づくパーソナライズされたCTA
const ConsultingCTA = ({ totalScore, criticalIssues }: CTAProps) => {
  const message = useMemo(() => {
    if (totalScore < 50) {
      return "スコアが低めです。専門家による詳細な分析と改善戦略の策定をお勧めします。";
    } else if (criticalIssues.length > 0) {
      return "いくつかの重要な課題が発見されました。優先度に応じた対策をご提案します。";
    } else {
      return "良好な状態です。さらなる最適化で競合優位性を高めませんか？";
    }
  }, [totalScore, criticalIssues]);
  
  return (
    <ConsultingCard>
      <h3>DaiLYUPの専門コンサルタントによる詳細分析</h3>
      <p>{message}</p>
      <ul className="consulting-benefits">
        <li>✓ 個別最適化戦略の策定</li>
        <li>✓ 実装支援とモニタリング</li>
        <li>✓ 継続的な効果測定</li>
      </ul>
      <Button href="/contact" size="large">
        無料相談を申し込む
      </Button>
    </ConsultingCard>
  );
};
```

### 4.3 リードジェネレーション機能

```typescript
// PDFレポート要求機能（個人情報は任意）
const PDFRequestForm = ({ diagnosticId }: { diagnosticId: string }) => {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // PDF生成要求（個人情報は任意で取得）
    const response = await fetch('/api/pdf-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnosticId,
        companyName,
        email,
        consentMarketing: marketingConsent,
        template: 'standard',
        options: {
          includeBenchmark: true,
          includeDetails: true
        }
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // ダウンロードURL提供 & 任意でメール送信
      window.open(result.data.downloadUrl);
      showSuccessMessage('PDFレポートを生成しました');
    }
  };
  
  return (
    <Card className="pdf-request-form">
      <h3>PDFレポートをダウンロード</h3>
      <p className="text-sm text-gray-600 mb-4">
        ※ PDF生成には社名とメールアドレスが必要です（任意）
      </p>
      <form onSubmit={handleSubmit}>
        <Input 
          type="text"
          placeholder="会社名"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <Input 
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Checkbox
          checked={marketingConsent}
          onChange={setMarketingConsent}
          label="DaiLYUPからのマーケティング情報の受取に同意します（任意）"
        />
        <Button type="submit">
          PDFレポートを生成
        </Button>
      </form>
    </Card>
  );
};
```

## 5. SEO・マーケティング統合

### 5.1 メタデータ設定

```typescript
// lib/seo-config.ts
export const llmoSEOConfig = {
  '/llmo-diagnostic': {
    title: 'LLMO診断 - AI検索最適化チェック | DaiLYUP',
    description: 'あなたのWebサイトがAI検索エンジンに最適化されているかを無料で診断。ChatGPT、Claude、Gemini等での引用可能性をスコア化します。',
    keywords: 'LLMO, AI検索最適化, ChatGPT, SEO, 診断ツール, DaiLYUP',
    ogImage: '/images/llmo-diagnostic-og.png'
  },
  '/llmo-diagnostic/report/[id]': {
    title: 'LLMO診断結果 | DaiLYUP',
    description: 'AI検索最適化診断の結果と改善提案。あなたのサイトのAI対応度をチェックしましょう。',
    robots: 'noindex' // 個別診断結果はインデックスしない
  }
};
```

### 5.2 構造化データ

```typescript
// components/StructuredData/LLMODiagnosticLD.tsx
const LLMODiagnosticStructuredData = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LLMO診断ツール',
    description: 'AI検索エンジン最適化診断ツール',
    url: 'https://dailyup.co.jp/llmo-diagnostic',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY'
    },
    provider: {
      '@type': 'Organization',
      name: 'DaiLYUP',
      url: 'https://dailyup.co.jp'
    }
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
```

### 5.3 Google Analytics統合

```typescript
// lib/analytics.ts
export const trackLLMOEvent = (action: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: 'LLMO_Diagnostic',
      ...data
    });
  }
};

// 使用例
const handleDiagnosticStart = (url: string) => {
  trackLLMOEvent('diagnostic_started', {
    url: url,
    source: 'home_page'
  });
};

const handleReportView = (score: number, diagnosticId: string) => {
  trackLLMOEvent('report_viewed', {
    score: score,
    diagnostic_id: diagnosticId
  });
};
```

## 6. モバイル最適化

### 6.1 レスポンシブデザイン

```css
/* DaiLYUPのブレークポイントに準拠 */
.llmo-diagnostic {
  @media (max-width: 768px) {
    .hero-content {
      text-align: center;
      padding: 1rem;
    }
    
    .llmo-title {
      font-size: 1.875rem; /* 30px */
    }
    
    .score-display-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .suggestion-card {
      margin-bottom: 1rem;
    }
  }
}
```

### 6.2 PWA対応（将来的な拡張）

```typescript
// next.config.js でPWA設定を追加
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24時間
        }
      }
    }
  ]
});
```

## 7. パフォーマンス最適化

### 7.1 Core Web Vitals対策

```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

const OptimizedLLMOImage = ({ src, alt, ...props }) => {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      quality={85}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      {...props}
    />
  );
};
```

### 7.2 コードスプリッティング

```typescript
// 診断結果ページの動的インポート
const DiagnosticResult = dynamic(
  () => import('@/components/llmo/DiagnosticResult'),
  { 
    loading: () => <DiagnosticResultSkeleton />,
    ssr: false
  }
);

const ReportPDFGenerator = dynamic(
  () => import('@/components/llmo/ReportPDFGenerator'),
  { ssr: false }
);
```

## 8. 多言語対応

### 8.1 国際化設定

```typescript
// next-i18next.config.js
module.exports = {
  i18n: {
    locales: ['ja', 'en'],
    defaultLocale: 'ja',
    localeDetection: false, // DaiLYUPのメイン言語は日本語
  },
  fallbackLng: {
    'en': ['ja'], // 英語で該当なしの場合は日本語を表示
  }
};
```

### 8.2 翻訳ファイル

```json
// locales/ja/llmo.json
{
  "title": "LLMO診断",
  "subtitle": "あなたのサイトはAIに選ばれますか？",
  "startDiagnosis": "診断を開始",
  "urlPlaceholder": "診断したいURLを入力",
  "processing": "診断中...",
  "score": {
    "total": "総合スコア",
    "trustworthiness": "信頼性",
    "structure": "構造",
    "technical": "技術"
  }
}
```

```json
// locales/en/llmo.json
{
  "title": "LLMO Diagnostic",
  "subtitle": "Is your site AI-ready?",
  "startDiagnosis": "Start Diagnosis",
  "urlPlaceholder": "Enter URL to diagnose",
  "processing": "Processing...",
  "score": {
    "total": "Overall Score",
    "trustworthiness": "Trustworthiness",
    "structure": "Structure",
    "technical": "Technical"
  }
}
```

## 9. デプロイメント

### 9.1 Vercel設定

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_key"
  },
  "regions": ["nrt1"], 
  "rewrites": [
    {
      "source": "/llmo-diagnostic/:path*",
      "destination": "/llmo-diagnostic/:path*"
    }
  ]
}
```

### 9.2 環境変数設定

```bash
# .env.local (ローカル開発用)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# 外部API設定
OPENAI_API_KEY=sk-...
GOOGLE_KNOWLEDGE_GRAPH_KEY=AIza...
PLAGIARISM_CHECKER_KEY=...

# 統計・分析
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## 10. 成功指標（KPI）

### 10.1 診断ツール利用指標

- **月間診断数**: 目標500件/月
- **診断完了率**: 目標85%以上
- **レポート閲覧率**: 目標90%以上
- **PDFダウンロード率**: 目標30%以上

### 10.2 ビジネス貢献指標

- **リード獲得数**: 診断からの問い合わせ 目標10件/月
- **コンバージョン率**: 診断→問い合わせ 目標2%
- **診断→受注率**: 目標20%
- **顧客単価**: 平均100万円（既存AIOサービス基準）

### 10.3 技術指標

- **ページ表示速度**: LCP < 2.5秒
- **可用性**: アップタイム 99.9%以上
- **エラー率**: < 1%
- **キャッシュヒット率**: > 70%

## 11. 実装フェーズ

### フェーズ1: 基本機能実装（4週間）
- [ ] URL入力・診断開始機能
- [ ] 基本的な診断アルゴリズム
- [ ] 結果表示画面
- [ ] DaiLYUPサイトデザイン統合

### フェーズ2: 高度化・最適化（3週間）
- [ ] リアルタイム進捗表示
- [ ] 詳細分析機能
- [ ] PDFレポート生成
- [ ] 外部API統合

### フェーズ3: マーケティング機能（2週間）
- [ ] リードジェネレーション機能
- [ ] メール配信機能
- [ ] GA4統合・分析ダッシュボード
- [ ] A/Bテスト機能

この統合仕様により、DaiLYUPのブランドイメージと一貫性を保ちながら、効果的なLLMO診断ツールを提供し、既存ビジネスとのシナジーを最大化できます。