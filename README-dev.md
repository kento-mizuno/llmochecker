# LLMO無料診断 開発環境セットアップ

## 開発環境構築手順

### 1. 環境変数設定
```bash
cp .env.local.template .env.local
# .env.local にSupabaseとGeminiの設定を入力
```

### 2. 依存関係インストール
```bash
npm install
```

### 3. データベースセットアップ
```bash
npm run db:setup
```

### 4. 開発サーバー起動
```bash
npm run dev
```

## テスト実行

### 単体テスト
```bash
# テスト実行（watch mode）
npm run test

# テスト実行（1回のみ）
npm run test:run

# カバレッジ付きテスト
npm run test:coverage

# テストUI
npm run test:ui
```

### E2Eテスト
```bash
# E2Eテスト実行
npm run e2e

# E2EテストUI
npm run e2e:ui
```

### その他のチェック
```bash
# 型チェック
npm run type-check

# リント
npm run lint

# ビルドテスト
npm run build
```

## Docker開発環境

### 起動
```bash
npm run docker:dev
```

### 停止
```bash
npm run docker:down
```

## プロジェクト構造

```
llmochecker/
├── src/                    # ソースコード
│   ├── app/               # Next.js App Router
│   ├── components/        # React コンポーネント
│   └── __tests__/         # 単体テスト
├── e2e/                   # E2Eテスト
├── lib/                   # ユーティリティライブラリ
├── scripts/               # 実行スクリプト
├── docs/                  # ドキュメント
└── .github/workflows/     # CI/CD設定
```

## CI/CD

GitHub Actions で以下を自動実行：
- 型チェック
- リント
- 単体テスト
- ビルドテスト
- E2Eテスト

## 開発フロー

1. ブランチ作成
2. 機能実装
3. テスト作成・実行
4. プルリクエスト作成
5. CI通過確認
6. レビュー・マージ