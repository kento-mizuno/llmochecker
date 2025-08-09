# LLMO無料診断 アーキテクチャ設計

## システム概要

LLMO無料診断は、URLを入力するだけでWebサイトのAI検索最適化状況を診断するWebアプリケーションです。18項目の評価基準に基づいて、サイトのLLMO対策の充実度を多面的に評価し、具体的な改善提案を提供します。

## アーキテクチャパターン

- **パターン**: Supabaseベースのサーバーレスアーキテクチャ
- **理由**: 
  - Supabaseプロプランの活用による運用コスト最適化
  - Edge Functionsによるスケーラブルな処理
  - PostgreSQLによる診断結果の効率的な管理
  - Gemini 2.0 Flash（実験版）による高度なコンテンツ分析

## コンポーネント構成

### フロントエンド

- **フレームワーク**: Next.js 14 (App Router)
- **UIライブラリ**: Tailwind CSS + shadcn/ui
- **状態管理**: Zustand（診断状態の管理）
- **API通信**: Supabase JavaScript Client
- **グラフ/チャート**: Recharts
- **フォーム管理**: React Hook Form + Zod

#### 主要コンポーネント
- URL入力フォーム
- 診断進捗表示（リアルタイムプログレスバー）
- 評価結果ダッシュボード
- 詳細レポートビューア（カテゴリ別スコア表示）
- 改善提案カード（優先順位付き）
- 診断履歴表示（セッション内）

### バックエンド

- **インフラ**: Supabase
  - **Database**: PostgreSQL（診断ログ、URLキャッシュ）
  - **Edge Functions**: Deno（メイン処理）
  - **Storage**: 一時的なHTMLキャッシュ
  - **Realtime**: 診断進捗のリアルタイム更新

- **外部API連携**:
  - **Gemini 2.0 Flash（実験版）**: コンテンツ分析、E-E-A-T評価
  - **Puppeteer（Edge Function内）**: SPAサイトのレンダリング

#### 主要Edge Functions
1. `analyze-url`: URLバリデーションとメタ情報取得
2. `crawl-site`: サイトクローリングとHTML取得
3. `evaluate-llmo`: 18項目の評価実行
4. `generate-report`: レポート生成
5. `analyze-content`: Gemini APIによるコンテンツ分析

### データストレージ

#### Supabase PostgreSQL スキーマ
- **診断ログテーブル**: URLと診断日時のみ（プライバシー保護）
- **キャッシュテーブル**: 診断結果の一時キャッシュ（1時間）
- **評価基準マスタ**: 18項目の評価基準と重み付け

#### ブラウザストレージ
- **SessionStorage**: 診断履歴（セッション内のみ）
- **LocalStorage**: ユーザー設定（言語、テーマ）

## 技術スタック詳細

### 開発環境
- **言語**: TypeScript 5.x
- **パッケージマネージャー**: pnpm
- **リンター/フォーマッター**: ESLint + Prettier + Biome
- **テストフレームワーク**: Vitest + Playwright

### 本番環境
- **ホスティング**: Vercel（フロントエンド）
- **バックエンド**: Supabase（プロプラン）
- **LLM**: Google AI Studio（Gemini 2.0 Flash実験版）
- **監視**: Supabase Dashboard + Vercel Analytics

## Gemini 2.0 Flash 統合

### 活用用途
1. **E-E-A-T評価**
   - コンテンツの専門性分析
   - 著者情報の信頼性評価
   - 引用元の権威性チェック

2. **コンテンツ品質分析**
   - 独創性の評価
   - 情報の正確性検証
   - 結論ファーストの文章構成チェック

3. **改善提案生成**
   - 具体的な改善アクションの提案
   - 優先順位の判定
   - 実装例の提供

### API設計
```typescript
interface GeminiAnalysisRequest {
  url: string;
  htmlContent: string;
  evaluationCriteria: EvaluationCriteria[];
}

interface GeminiAnalysisResponse {
  eatScore: EATScore;
  contentQuality: ContentQualityScore;
  improvements: Improvement[];
}
```

## セキュリティ対策

### Supabase Row Level Security (RLS)
- 診断ログへの読み取り専用アクセス
- URLキャッシュの自動削除（1時間後）
- 個人情報フィールドの除外

### API セキュリティ
- Supabase APIキーの環境変数管理
- レート制限（Supabase標準機能）
- CORS設定の適切な管理

### 入力検証
- URL形式の厳密な検証（Zod スキーマ）
- SQLインジェクション対策（Supabase標準）
- XSS対策（React + Supabase標準）

## パフォーマンス最適化

### Edge Functions 最適化
- 並列処理による高速化
- ストリーミングレスポンス
- 部分的な結果の逐次返却

### データベース最適化
- インデックスの適切な設定
- 診断結果のキャッシュ（1時間）
- バッチ挿入による効率化

### Gemini API 最適化
- プロンプトキャッシング
- バッチリクエスト
- タイムアウト設定（30秒）

## リアルタイム機能

### Supabase Realtime
- 診断進捗のリアルタイム更新
- 各評価項目の完了通知
- エラー発生時の即座のフィードバック

```typescript
// リアルタイム進捗更新の例
const channel = supabase.channel('diagnosis-progress')
  .on('broadcast', { event: 'progress' }, ({ payload }) => {
    updateProgress(payload.percentage);
  })
  .subscribe();
```

## エラーハンドリング

### グレースフルデグレーション
- Gemini API失敗時は基本評価のみ実行
- 部分的な失敗時の継続評価
- タイムアウト時の部分結果提供

### ユーザーフィードバック
- 明確なエラーメッセージ（日本語）
- 進捗状況のリアルタイム表示
- 問題解決のためのガイダンス提供

## 制約事項

- 完全無料での提供
- 個人情報の非保持（URLと診断日時のみ）
- 診断時間3分以内の制約
- 日本語のみのサポート
- Gemini 2.0 Flash実験版のレート制限考慮