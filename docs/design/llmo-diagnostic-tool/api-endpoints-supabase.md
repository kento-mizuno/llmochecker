# LLMO診断ツール Supabase Edge Functions API設計

## API概要

Supabase Edge Functionsを使用して、LLMO診断ツールのAPIエンドポイントを実装します。Edge Functionsは以下の特徴を活用します：

- **Deno Runtime**: TypeScriptネイティブサポート
- **グローバル展開**: 低レイテンシー
- **Supabase統合**: データベース、Storage、Auth、Real-timeへの直接アクセス
- **スケーラビリティ**: 自動スケーリング

## ベースURL

```
https://[PROJECT_ID].supabase.co/functions/v1/
```

## 共通仕様

### 認証
- 現在：認証なし（将来的にSupabase Authと連携）
- レート制限：URLベース（完全匿名診断のため）

### レスポンス形式
```typescript
interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string; // ISO 8601
    version: string;
    requestId: string;
  };
}
```

### エラーコード
| コード | 説明 | HTTPステータス |
|-------|------|----------------|
| INVALID_URL | 無効なURL形式 | 400 |
| URL_UNREACHABLE | URLにアクセスできない | 422 |
| PROCESSING_TIMEOUT | 処理タイムアウト | 408 |
| EXTERNAL_API_ERROR | 外部API呼び出しエラー | 502 |
| RATE_LIMIT_EXCEEDED | レート制限超過 | 429 |
| INTERNAL_ERROR | 内部エラー | 500 |

## API エンドポイント

### 1. 診断開始 - POST /diagnose

#### リクエスト
```typescript
POST /functions/v1/diagnose
Content-Type: application/json

{
  "url": "https://example.com",
  "language": "ja", // "ja" | "en"
  "options": {
    "deepAnalysis": false,
    "layers": ["layer1", "layer2", "layer3"],
    "skipExternalAPIs": false
  }
}
```

#### レスポンス
```typescript
{
  "success": true,
  "data": {
    "diagnosticId": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://example.com",
    "status": "pending",
    "estimatedCompletionTime": 45
  },
  "meta": {
    "timestamp": "2025-08-09T10:30:00Z",
    "version": "1.0",
    "requestId": "req_123456789"
  }
}
```

#### Edge Function実装
```typescript
// supabase/functions/diagnose/index.ts
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dailyup.co.jp',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { url, language = 'ja', options = {} } = await req.json();
    
    // URL正規化とバリデーション
    const normalizedUrl = normalizeUrl(url);
    
    // キャッシュチェック
    const { data: cached } = await supabase
      .from('diagnostic_cache')
      .select('diagnostic_id, expires_at')
      .eq('url_normalized', normalizedUrl)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      return Response.json({
        success: true,
        data: { 
          diagnosticId: cached.diagnostic_id,
          fromCache: true 
        }
      }, { headers: corsHeaders });
    }

    // URLベースのレート制限チェック
    const { data: recentDiagnostics } = await supabase
      .from('diagnostics')
      .select('created_at')
      .eq('url_normalized', normalizedUrl)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // 過去1時間
      .limit(10);

    if (recentDiagnostics && recentDiagnostics.length >= 5) {
      return Response.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'このURLの診断回数が制限に達しています。1時間後に再実行してください。'
        }
      }, { status: 429, headers: corsHeaders });
    }

    // 新規診断レコード作成（完全匿名）
    const { data: diagnostic, error } = await supabase
      .from('diagnostics')
      .insert({
        url,
        url_normalized: normalizedUrl,
        language,
        deep_analysis: options.deepAnalysis || false,
        layers: options.layers || ['layer1', 'layer2', 'layer3'],
        skip_external_apis: options.skipExternalAPIs || false
        // 個人情報（IP、User-Agent等）は一切取得しない
      })
      .select()
      .single();

    if (error) throw error;

    // バックグラウンド処理を開始（別のEdge Functionを呼び出し）
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-diagnostic`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ diagnosticId: diagnostic.id })
    });

    return Response.json({
      success: true,
      data: {
        diagnosticId: diagnostic.id,
        url: diagnostic.url,
        status: diagnostic.status,
        estimatedCompletionTime: 45
      }
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
```

### 2. 診断結果取得 - GET /diagnose/:id

#### リクエスト
```
GET /functions/v1/diagnose/550e8400-e29b-41d4-a716-446655440000
```

#### レスポンス
```typescript
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://example.com",
    "status": "completed",
    "totalScore": 78.5,
    "layer1Results": { /* Layer1Results */ },
    "layer2Results": { /* Layer2Results */ },
    "layer3Results": { /* Layer3Results */ },
    "improvementSuggestions": [
      {
        "id": "suggest_001",
        "priority": "critical",
        "title": "HTTPSの有効化",
        "description": "サイト全体でHTTPSを有効化してください",
        "actionItems": [
          {
            "step": 1,
            "description": "SSL証明書を取得する",
            "example": "Let's Encryptまたは有料SSL証明書"
          }
        ]
      }
    ],
    "benchmarkComparison": {
      "industryAverage": 65.5,
      "percentileRank": 85,
      "performanceTier": "top_25_percent"
    }
  }
}
```

### 3. 診断進捗取得 - GET /diagnose/:id/progress

#### リクエスト
```
GET /functions/v1/diagnose/550e8400-e29b-41d4-a716-446655440000/progress
```

#### レスポンス
```typescript
{
  "success": true,
  "data": {
    "diagnosticId": "550e8400-e29b-41d4-a716-446655440000",
    "progress": {
      "percentage": 65,
      "currentStage": "analyzing_layer2",
      "stageDetails": "セマンティック構造の分析中",
      "estimatedTimeRemaining": 15
    }
  }
}
```

### 4. PDFレポート要求 - POST /pdf-request

#### リクエスト
```typescript
POST /functions/v1/pdf-request
Content-Type: application/json

{
  "diagnosticId": "550e8400-e29b-41d4-a716-446655440000",
  "companyName": "株式会社例",
  "email": "test@example.com",
  "consentMarketing": false,
  "template": "standard", // "standard" | "executive" | "technical"
  "options": {
    "includeBenchmark": true,
    "includeDetails": true
  }
}
```

#### レスポンス
```typescript
{
  "success": true,
  "data": {
    "pdfRequestId": "pdf_req_123",
    "downloadUrl": "https://[PROJECT_ID].supabase.co/storage/v1/object/sign/reports/report_123.pdf?token=...",
    "expiresAt": "2025-08-16T10:30:00Z",
    "fileSizeBytes": 2048000,
    "note": "PDFが生成されました。7日間ダウンロード可能です"
  },
  "meta": {
    "timestamp": "2025-08-09T10:30:00Z",
    "version": "1.0",
    "requestId": "req_pdf_123456"
  }
}
```

### 5. PDF削除要求 - DELETE /pdf-request/:id

#### リクエスト
```
DELETE /functions/v1/pdf-request/pdf_req_123
```

#### レスポンス
```typescript
{
  "success": true,
  "data": {
    "message": "PDFレポートと個人情報を削除しました"
  },
  "meta": {
    "timestamp": "2025-08-09T10:30:00Z",
    "version": "1.0",
    "requestId": "req_delete_123456"
  }
}
```

### 6. ベンチマーク取得 - GET /benchmarks

#### リクエスト
```
GET /functions/v1/benchmarks?industry=general&category=total
```

#### レスポンス
```typescript
{
  "success": true,
  "data": {
    "industry": "general",
    "category": "total",
    "statistics": {
      "sampleSize": 1000,
      "averageScore": 65.5,
      "medianScore": 68.2,
      "percentile90": 89.1,
      "percentile75": 78.3,
      "percentile25": 52.1,
      "percentile10": 31.4
    },
    "lastUpdated": "2025-08-09T00:00:00Z"
  }
}
```

### 6. システム状態 - GET /health

#### リクエスト
```
GET /functions/v1/health
```

#### レスポンス
```typescript
{
  "success": true,
  "data": {
    "healthy": true,
    "services": [
      {
        "name": "database",
        "status": "healthy",
        "responseTime": 15,
        "lastChecked": "2025-08-09T10:30:00Z"
      },
      {
        "name": "storage",
        "status": "healthy",
        "responseTime": 8,
        "lastChecked": "2025-08-09T10:30:00Z"
      }
    ],
    "statistics": {
      "totalDiagnostics": 1250,
      "diagnosticsToday": 45,
      "averageProcessingTime": 42,
      "cacheHitRate": 0.65,
      "queueLength": 3
    }
  }
}
```

## バックグラウンド処理用Edge Functions

### 1. 診断処理 - POST /process-diagnostic

```typescript
// supabase/functions/process-diagnostic/index.ts
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

serve(async (req) => {
  try {
    const { diagnosticId } = await req.json();
    
    // 診断処理のオーケストレーション
    const processor = new DiagnosticProcessor(diagnosticId);
    
    // 各層を並列処理
    const results = await Promise.allSettled([
      processor.processLayer1(), // E-E-A-T, エンティティ, コンテンツ品質
      processor.processLayer2(), // AI形式, 文書構造, 明確性
      processor.processLayer3()  // 構造化データ, 技術健全性, llms.txt
    ]);
    
    // スコア集計と改善提案生成
    await processor.calculateFinalScore();
    await processor.generateSuggestions();
    
    // キャッシュに保存
    await processor.saveToCache();
    
    return new Response('OK');
    
  } catch (error) {
    console.error('Diagnostic processing failed:', error);
    return new Response('Error', { status: 500 });
  }
});
```

### 2. 外部API統合 - POST /external-apis

```typescript
// supabase/functions/external-apis/index.ts
// Google Knowledge Graph、Plagiarism Checker、PageSpeed Insights等
serve(async (req) => {
  const { type, params } = await req.json();
  
  switch (type) {
    case 'knowledge_graph':
      return await queryKnowledgeGraph(params.entity);
    case 'plagiarism_check':
      return await checkPlagiarism(params.content);
    case 'pagespeed':
      return await measurePageSpeed(params.url);
    case 'backlinks':
      return await analyzeBacklinks(params.url);
    default:
      return Response.json({ error: 'Unknown API type' }, { status: 400 });
  }
});
```

### 3. リアルタイム進捗更新 - POST /update-progress

```typescript
// supabase/functions/update-progress/index.ts
serve(async (req) => {
  const { diagnosticId, percentage, stage, details } = await req.json();
  
  const supabase = createClient(/* ... */);
  
  // 進捗をデータベースに保存（Real-time機能で自動配信）
  await supabase
    .from('diagnostic_progress')
    .upsert({
      diagnostic_id: diagnosticId,
      percentage,
      current_stage: stage,
      stage_details: details,
      estimated_time_remaining: calculateETA(percentage),
      updated_at: new Date().toISOString()
    });
    
  return new Response('OK');
});
```

## フロントエンド統合

### Supabaseクライアント設定

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Edge Functions用のクライアント
export const callEdgeFunction = async (
  functionName: string, 
  payload?: Record<string, unknown>
) => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload
  });
  
  if (error) throw error;
  return data;
};
```

### リアルタイム進捗監視

```typescript
// hooks/useDiagnosticProgress.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useDiagnosticProgress(diagnosticId: string) {
  const [progress, setProgress] = useState<DiagnosticProgress | null>(null);
  
  useEffect(() => {
    const channel = supabase
      .channel('diagnostic_progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'diagnostic_progress',
          filter: `diagnostic_id=eq.${diagnosticId}`
        },
        (payload) => {
          setProgress(payload.new as DiagnosticProgress);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [diagnosticId]);
  
  return progress;
}
```

### API呼び出し例

```typescript
// services/diagnostic.ts
import { callEdgeFunction } from '@/lib/supabase';
import type { DiagnosticRequest, DiagnosticResponse } from './types';

export class DiagnosticService {
  static async startDiagnosis(request: DiagnosticRequest): Promise<DiagnosticResponse> {
    return await callEdgeFunction('diagnose', request);
  }
  
  static async getResult(diagnosticId: string): Promise<DiagnosticResults> {
    return await callEdgeFunction('diagnose', { id: diagnosticId });
  }
  
  static async generateReport(diagnosticId: string, options: ReportOptions) {
    return await callEdgeFunction('reports', { diagnosticId, ...options });
  }
}
```

## セキュリティ・パフォーマンス

### Rate Limiting（Edge Functions）
```typescript
// URLベースレート制限の実装例（匿名診断のため）
const RATE_LIMITS = {
  diagnose: { requests: 5, window: 3600 },  // 同一URL: 1時間に5回
  pdf_request: { requests: 3, window: 3600 } // PDF生成: 1時間に3回
};

async function checkURLRateLimit(supabase: SupabaseClient, normalizedUrl: string, endpoint: string) {
  const limit = RATE_LIMITS[endpoint];
  const cutoffTime = new Date(Date.now() - (limit.window * 1000)).toISOString();
  
  // 正規化されたURLでの過去リクエスト数をチェック
  const { count } = await supabase
    .from(endpoint === 'diagnose' ? 'diagnostics' : 'pdf_requests')
    .select('*', { count: 'exact' })
    .eq('url_normalized', normalizedUrl)
    .gte('created_at', cutoffTime);
    
  return (count || 0) < limit.requests;
}
```

### CORS設定
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dailyup.co.jp',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};
```

### エラーハンドリング
```typescript
// 共通エラーハンドラー
function handleError(error: unknown, context: string) {
  console.error(`Error in ${context}:`, error);
  
  if (error instanceof ValidationError) {
    return Response.json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.message }
    }, { status: 400 });
  }
  
  return Response.json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
  }, { status: 500 });
}
```

## デプロイ・監視

### Edge Functions デプロイ
```bash
# 全関数をデプロイ
supabase functions deploy

# 特定の関数のみデプロイ
supabase functions deploy diagnose
supabase functions deploy process-diagnostic
```

### 監視・ログ
```bash
# ログの確認
supabase functions logs diagnose

# リアルタイムログ監視
supabase functions logs diagnose --follow
```

### 環境変数設定
```bash
# Supabase秘密の設定
supabase secrets set OPENAI_API_KEY=sk-xxx
supabase secrets set GOOGLE_KNOWLEDGE_GRAPH_KEY=xxx
supabase secrets set PLAGIARISM_CHECKER_KEY=xxx
```

このAPIアーキテクチャにより、DaiLYUPサイトに統合可能で、スケーラブルかつ高速なLLMO診断サービスを提供できます。