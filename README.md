# LLMO無料診断

URL を入力するだけで AI検索（LLMO: Large Language Model Optimization）における可視性を評価する無料診断ツール

## 🎯 概要

toBtoCサービスのウェブサイト担当者および経営者を対象とした、AI検索対策の充実度を多面的に診断するWebアプリケーションです。18項目のチェックリストに基づいて、サイトのLLMO対策状況を評価し、具体的な改善提案を提供します。

## 🔗 本番環境

https://dailyup.co.jp/llmochecker

## 🏗️ 技術スタック

- **フロントエンド**: Next.js 14, Tailwind CSS, shadcn/ui
- **バックエンド**: Supabase (Edge Functions, PostgreSQL, Realtime)
- **AI分析**: Google Gemini 2.0 Flash
- **ホスティング**: Vercel (Frontend) + Supabase (Backend)

## 📋 評価項目（18項目）

### E-E-A-T（最重要）
1. 経験（Experience）の明示
2. 専門性（Expertise）の証明  
3. 権威性（Authoritativeness）の構築
4. 信頼性（Trustworthiness）の確保

### エンティティ（最重要）
5. ナレッジグラフでの存在感
6. NAP情報の一貫性

### 品質と独創性（最重要）
7. コンテンツの独創性
8. 情報の正確性と検証可能性

### AIフレンドリーなフォーマット（重要）
9. Q&Aフォーマットの活用
10. リスト・表形式の活用
11. 要約・定義文の提示

### 文書階層（重要）
12. 論理的な見出し構造（H1-H6）
13. セマンティックHTMLの活用

### 言語の明確性（重要）
14. 結論ファーストの文章構成

### 技術的シグナル（中程度）
15. 構造化データ（Schema.org）
16. クロール容易性
17. ページエクスペリエンス
18. llms.txtの設置

## 📁 プロジェクト構成

```
docs/
├── spec/                      # 要件定義
│   └── llmo-checker-requirements.md
└── design/llmo-checker/       # 技術設計
    ├── architecture.md        # アーキテクチャ設計
    ├── dataflow.md           # データフロー図
    ├── interfaces.ts         # TypeScript型定義
    ├── database-schema.sql   # データベーススキーマ
    └── api-endpoints.md      # API仕様書
```

## 🚀 開発プロセス

1. **要件定義** ✅ - EARS記法による詳細要件
2. **技術設計** ✅ - アーキテクチャ・DB・API設計
3. **実装** - フロントエンド・バックエンド開発
4. **テスト** - 単体・統合・E2Eテスト
5. **デプロイ** - 本番環境リリース

## 📈 主要機能

- **URL診断**: 3分以内の高速分析
- **18項目評価**: カテゴリ別スコア表示
- **AI分析**: Gemini 2.0 Flashによる詳細解析
- **改善提案**: 優先順位付きアクションプラン
- **リアルタイム進捗**: 診断状況のライブ更新
- **診断履歴**: セッション内での過去結果表示

## 🔒 セキュリティ・プライバシー

- 個人情報は一切保存しない（URLと診断結果のみ）
- HTTPS通信の強制
- Supabase Row Level Security (RLS) 適用
- 診断データの自動削除（30日後）

## ⚡ パフォーマンス

- 診断時間: 3分以内
- 同時処理: 50ユーザー対応
- レスポンス時間: 95%タイルで5秒以内
- キャッシュ: 24時間の診断結果保持

## 🌐 対応ブラウザ

- Chrome (最新版)
- Firefox (最新版)  
- Safari (最新版)
- Edge (最新版)
- モバイルブラウザ対応

---

© 2024 LLMO無料診断 - Powered by Daily UP