# LLMO無料診断 API エンドポイント仕様

## ベースURL
- 開発環境: `http://localhost:3000`
- 本番環境: `https://dailyup.co.jp/llmochecker`

## 認証
- 本システムは無料診断ツールのため、認証は不要
- Supabase APIキーはサーバーサイド（Edge Functions）でのみ使用

## 共通レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": { /* 実際のデータ */ }
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ（日本語）",
    "details": { /* 詳細情報（任意） */ }
  }
}
```

## エンドポイント一覧

---

## 1. 診断開始

### POST /api/diagnosis/start

URLの診断を開始します。既に24時間以内に診断済みの場合はキャッシュされた結果を返します。

#### リクエスト
```json
{
  "url": "https://example.com",
  "force_refresh": false // オプション: キャッシュを無視して再診断
}
```

#### バリデーション
- `url`: 必須、有効なURL形式、HTTPSまたはHTTP
- `force_refresh`: オプション、boolean

#### レスポンス（新規診断）
```json
{
  "success": true,
  "data": {
    "diagnosis_id": "uuid-here",
    "status": "analyzing",
    "estimated_duration": 180,
    "is_cached": false
  }
}
```

#### レスポンス（キャッシュヒット）
```json
{
  "success": true,
  "data": {
    "diagnosis_id": "uuid-here",
    "status": "completed",
    "estimated_duration": 0,
    "is_cached": true
  }
}
```

#### エラーレスポンス例
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "有効なURLを入力してください"
  }
}
```

---

## 2. 診断進捗取得

### GET /api/diagnosis/{diagnosis_id}/progress

診断の進捗状況を取得します。

#### パスパラメータ
- `diagnosis_id`: 診断ID（UUID）

#### レスポンス
```json
{
  "success": true,
  "data": {
    "diagnosis_id": "uuid-here",
    "percentage": 60,
    "current_stage": "ai_analyzing",
    "stage_description": "AI分析を実行中です...",
    "estimated_remaining_seconds": 72,
    "completed_evaluations": 12,
    "total_evaluations": 18
  }
}
```

---

## 3. 診断結果取得

### GET /api/diagnosis/{diagnosis_id}/result

完了した診断の詳細結果を取得します。

#### パスパラメータ
- `diagnosis_id`: 診断ID（UUID）

#### レスポンス
```json
{
  "success": true,
  "data": {
    "diagnosis": {
      "id": "uuid-here",
      "url": "https://example.com",
      "url_hash": "hash-value",
      "total_score": 78,
      "status": "completed",
      "created_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T10:33:15Z",
      "meta_data": {
        "title": "サイトタイトル",
        "description": "サイト説明"
      }
    },
    "evaluations": [
      {
        "id": "eval-uuid",
        "diagnosis_id": "uuid-here",
        "criteria_id": "criteria-uuid",
        "score": 85,
        "status": "pass",
        "reason": "HTTPSが正しく設定されており、証明書も有効です",
        "ai_analysis": "Geminiによる詳細分析結果...",
        "created_at": "2024-01-15T10:32:00Z",
        "criteria": {
          "id": "criteria-uuid",
          "name": "信頼性（Trustworthiness）の確保",
          "category": "e_e_a_t",
          "impact": "critical",
          "description": "HTTPS化、運営者情報、引用元の正確性をチェック",
          "llmo_reason": "サイトがHTTPSになっている、運営者情報が明記されている...",
          "weight": 1.00,
          "order": 4
        }
      }
    ],
    "improvements": [
      {
        "id": "improvement-uuid",
        "diagnosis_id": "uuid-here",
        "criteria_id": "criteria-uuid",
        "priority": "high",
        "title": "構造化データの実装",
        "description": "Organization スキーマを実装してサイトの信頼性を向上させましょう",
        "action_items": [
          "JSON-LD形式でOrganizationスキーマを作成",
          "企業名、住所、連絡先を含める",
          "headタグ内に設置"
        ],
        "implementation_example": "<script type=\"application/ld+json\">...</script>",
        "estimated_impact": 15,
        "created_at": "2024-01-15T10:32:30Z"
      }
    ],
    "category_scores": [
      {
        "category": "e_e_a_t",
        "category_name": "E-E-A-T",
        "score": 72,
        "max_possible_score": 100,
        "evaluation_count": 4,
        "passed_count": 3
      }
    ],
    "benchmark_comparison": {
      "industry_average": 65,
      "percentile": 75,
      "better_than_percentage": 75
    }
  }
}
```

---

## 4. 診断履歴取得

### GET /api/diagnosis/history

過去の診断履歴を取得します（セッション管理用）。

#### クエリパラメータ
- `limit`: 取得件数（デフォルト: 10、最大: 50）
- `page`: ページ番号（デフォルト: 1）

#### レスポンス
```json
{
  "success": true,
  "data": {
    "diagnoses": [
      {
        "id": "uuid-here",
        "url": "https://example.com",
        "total_score": 78,
        "status": "completed",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "total_pages": 3
    }
  }
}
```

---

## 5. 評価基準一覧取得

### GET /api/criteria

評価基準マスタデータを取得します。

#### レスポンス
```json
{
  "success": true,
  "data": [
    {
      "id": "criteria-uuid",
      "name": "経験（Experience）の明示",
      "category": "e_e_a_t",
      "impact": "critical",
      "description": "一次情報や実体験に基づくコンテンツの有無を評価",
      "llmo_reason": "一次情報や実体験に基づくコンテンツである",
      "weight": 1.00,
      "display_order": 1
    }
  ]
}
```

---

## 6. 診断キャンセル

### DELETE /api/diagnosis/{diagnosis_id}

実行中の診断をキャンセルします。

#### パスパラメータ
- `diagnosis_id`: 診断ID（UUID）

#### レスポンス
```json
{
  "success": true,
  "data": {
    "message": "診断がキャンセルされました"
  }
}
```

---

## 7. システム統計取得（管理用）

### GET /api/stats

システムの利用統計を取得します。

#### クエリパラメータ
- `days`: 集計対象日数（デフォルト: 30）

#### レスポンス
```json
{
  "success": true,
  "data": {
    "total_diagnoses": 1250,
    "completed_diagnoses": 1180,
    "average_score": 68,
    "unique_domains": 450,
    "daily_average": 41.7
  }
}
```

---

## Supabase Edge Functions 実装

各APIエンドポイントは Supabase Edge Functions として実装されます：

### Edge Function 構成

1. **start-diagnosis**
   - URL: `/functions/v1/start-diagnosis`
   - 機能: 診断開始処理、キャッシュチェック

2. **get-diagnosis-progress**
   - URL: `/functions/v1/get-diagnosis-progress`
   - 機能: 進捗状況取得

3. **get-diagnosis-result**
   - URL: `/functions/v1/get-diagnosis-result`
   - 機能: 診断結果取得

4. **crawl-and-evaluate**
   - URL: `/functions/v1/crawl-and-evaluate`
   - 機能: 内部処理（クローリングと評価実行）

5. **analyze-with-gemini**
   - URL: `/functions/v1/analyze-with-gemini`
   - 機能: Gemini APIによるコンテンツ分析

### リアルタイム更新

Supabase Realtime を使用した進捗更新：

```javascript
// フロントエンド側の実装例
const supabase = createClient(url, anonKey);

const channel = supabase.channel('diagnosis-progress')
  .on('broadcast', { event: 'progress' }, (payload) => {
    console.log('進捗更新:', payload);
    updateProgressBar(payload.percentage);
  })
  .subscribe();

// Edge Function側での進捗通知
await supabase.channel('diagnosis-progress').send({
  type: 'broadcast',
  event: 'progress',
  payload: {
    diagnosis_id: diagnosisId,
    percentage: 60,
    stage: 'ai_analyzing'
  }
});
```

## エラーコード一覧

| コード | 説明 |
|--------|------|
| `INVALID_URL` | 無効なURL形式 |
| `URL_NOT_ACCESSIBLE` | URLにアクセスできない |
| `DIAGNOSIS_NOT_FOUND` | 診断が見つからない |
| `DIAGNOSIS_IN_PROGRESS` | 診断実行中 |
| `CRAWLING_BLOCKED` | robots.txtによりクローリング拒否 |
| `TIMEOUT_ERROR` | 3分のタイムアウト |
| `GEMINI_API_ERROR` | Gemini API呼び出しエラー |
| `DATABASE_ERROR` | データベースエラー |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 |
| `INTERNAL_ERROR` | 内部サーバーエラー |

## レート制限

- IP単位: 1分間に10リクエスト
- URL単位: 同一URLの診断は24時間に1回（force_refreshを除く）
- 同時診断: 1IP当たり最大3件まで

## CORS設定

```javascript
// Edge Function での CORS ヘッダー設定例
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
});
```