# LLMO診断ツール アーキテクチャ設計

## システム概要

LLMO診断ツールは、WebサイトのAI検索エンジン最適化度を自動診断するWebアプリケーションです。URL入力のみで包括的な診断を実行し、E-E-A-Tを中心とした3層評価フレームワークに基づいて、優先順位付きの改善提案を提供します。

## アーキテクチャパターン

- **パターン**: マイクロサービスアーキテクチャ + イベント駆動型処理
- **理由**: 
  - 各評価層（信頼性、構造、技術）を独立したサービスとして実装可能
  - 負荷の高い処理（外部API呼び出し、DOM解析等）を並列実行
  - 将来的な機能拡張が容易（新評価項目の追加等）
  - 障害の局所化とサービスごとのスケーリングが可能

## コンポーネント構成

### フロントエンド

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript 5.x
- **UIライブラリ**: React 18 + Tailwind CSS
- **状態管理**: Zustand（軽量で学習コストが低い）
- **国際化**: next-i18next（日本語/英語対応）
- **グラフ表示**: Chart.js（スコア可視化）
- **主要機能**:
  - URL入力フォーム
  - リアルタイム診断進捗表示
  - スコアダッシュボード
  - 優先順位付き改善提案表示
  - レポートのPDFエクスポート

### API Gateway

- **フレームワーク**: Express.js + TypeScript
- **認証**: レート制限（express-rate-limit）
- **バリデーション**: Joi
- **ドキュメント**: OpenAPI 3.0 (Swagger)
- **主要機能**:
  - リクエストルーティング
  - レスポンス集約
  - エラーハンドリング
  - レート制限（無料版: 10回/日）

### バックエンド（診断エンジン）

#### Core Service（オーケストレーター）
- **フレームワーク**: Node.js + Express
- **メッセージキュー**: Bull (Redis-based)
- **主要機能**:
  - 診断ジョブの管理
  - 各評価サービスの呼び出し
  - スコア集計と加重計算
  - 改善提案の生成

#### Layer 1 Service（信頼性評価）
- **言語**: Node.js
- **主要機能**:
  - E-E-A-T分析
  - エンティティ検証
  - コンテンツ品質評価
- **外部API統合**:
  - Google Knowledge Graph API
  - Plagiarism Checker API
  - Ahrefs/SEMrush API（被リンク分析）

#### Layer 2 Service（構造評価）
- **言語**: Node.js
- **主要機能**:
  - DOM解析（Puppeteer）
  - セマンティックHTML評価
  - 可読性分析
- **ライブラリ**:
  - Cheerio（HTML解析）
  - text-readability（可読性スコア）

#### Layer 3 Service（技術評価）
- **言語**: Node.js
- **主要機能**:
  - Schema.org検証
  - Core Web Vitals測定
  - robots.txt/sitemap.xml解析
- **外部API統合**:
  - PageSpeed Insights API
  - Schema Validator API

### データストレージ

#### プライマリデータベース
- **DBMS**: PostgreSQL 15
- **ORM**: Prisma
- **用途**:
  - 診断履歴の保存
  - ベンチマークデータの管理
  - 改善提案テンプレート

#### キャッシュレイヤー
- **システム**: Redis 7
- **用途**:
  - 24時間診断結果キャッシュ
  - セッション管理
  - ジョブキュー（Bull）
  - API応答キャッシュ

#### オブジェクトストレージ
- **サービス**: AWS S3 / MinIO（自己ホスト）
- **用途**:
  - PDFレポートの保存
  - スクリーンショット保存
  - ログアーカイブ

### インフラストラクチャ

#### コンテナ化
- **Docker**: 全サービスをコンテナ化
- **Docker Compose**: ローカル開発環境
- **Kubernetes**: 本番環境（オプション）

#### モニタリング
- **APM**: OpenTelemetry
- **ログ**: Winston + ELK Stack
- **メトリクス**: Prometheus + Grafana
- **アラート**: PagerDuty / Slack

#### CI/CD
- **パイプライン**: GitHub Actions
- **テスト**: Jest（単体）、Playwright（E2E）
- **デプロイ**: 
  - ステージング: Vercel（フロントエンド）、Railway（バックエンド）
  - 本番: AWS ECS / Google Cloud Run

## セキュリティ設計

### データ保護
- **転送時**: TLS 1.3による暗号化
- **保存時**: PostgreSQLの透過的データ暗号化
- **個人情報**: 収集しない設計（GDPR準拠）

### アクセス制御
- **CORS**: 適切なオリジン制限
- **CSP**: Content Security Policy設定
- **XSS対策**: 入力値のサニタイゼーション

### API保護
- **レート制限**: IPベース、段階的制限
- **入力検証**: スキーマベースバリデーション
- **DDoS対策**: Cloudflare（本番環境）

## スケーラビリティ設計

### 水平スケーリング
- 各マイクロサービスを独立してスケール
- Kubernetesによる自動スケーリング（HPA）
- データベースのリードレプリカ

### パフォーマンス最適化
- CDNによる静的アセット配信
- データベースクエリの最適化
- 非同期処理による応答性向上

### 負荷分散
- ロードバランサー（NGINX/ALB）
- サービスメッシュ（Istio - オプション）

## 災害復旧計画

### バックアップ戦略
- データベース: 日次バックアップ、7日間保持
- 設定ファイル: Gitによるバージョン管理
- ログ: 30日間のローテーション

### 可用性目標
- **RTO (Recovery Time Objective)**: 4時間
- **RPO (Recovery Point Objective)**: 24時間
- **SLA**: 99.9%のアップタイム

## 開発環境

### ローカル開発
```bash
# Docker Composeによる全サービス起動
docker-compose up -d

# フロントエンド開発サーバー
npm run dev:frontend

# バックエンド開発サーバー
npm run dev:backend
```

### テスト環境
- **単体テスト**: Jest + Testing Library
- **統合テスト**: Supertest
- **E2Eテスト**: Playwright
- **負荷テスト**: k6

## 技術選定の根拠

| 技術 | 選定理由 |
|-----|---------|
| Next.js | SEO対応、SSR/SSG、開発生産性 |
| TypeScript | 型安全性、保守性、開発体験 |
| PostgreSQL | ACID準拠、JSON対応、拡張性 |
| Redis | 高速キャッシュ、ジョブキュー対応 |
| Docker | 環境の一貫性、デプロイの容易さ |
| Puppeteer | JavaScript実行後のDOM解析 |

## 今後の拡張性

- **プラグインアーキテクチャ**: 新評価項目の追加が容易
- **Webhook対応**: 診断完了時の通知
- **バッチ処理**: 複数URL一括診断
- **GraphQL API**: より柔軟なデータ取得
- **機械学習統合**: 改善提案の自動最適化