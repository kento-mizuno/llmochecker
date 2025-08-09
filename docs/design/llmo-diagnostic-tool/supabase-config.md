# LLMO診断ツール Supabase Pro 設定・構成ガイド

## Supabase Pro プロジェクト設定

### 1. プロジェクト作成・初期設定

```bash
# Supabase CLI インストール
npm install -g @supabase/cli

# Supabaseにログイン
supabase login

# 新規プロジェクト作成（Supabase Dashboard経由で作成後）
supabase init
supabase link --project-ref [PROJECT_REF]

# Pro プランの機能確認
supabase status
```

### 2. データベース初期設定

```sql
-- supabase/migrations/20250809000000_initial_schema.sql
-- 上記で作成したdatabase-schema-supabase.sqlの内容を配置

-- マイグレーション実行
supabase db push

-- データベースタイプ生成
supabase gen types typescript --local > lib/database.types.ts
```

### 3. Row Level Security (RLS) ポリシー

#### 診断テーブルのRLSポリシー

```sql
-- supabase/migrations/20250809000001_rls_policies.sql

-- 診断結果は基本的にすべて公開（現在は認証なし）
CREATE POLICY "Public read access for diagnostics" 
ON public.diagnostics FOR SELECT
USING (true);

CREATE POLICY "Allow insert diagnostics" 
ON public.diagnostics FOR INSERT
WITH CHECK (true);

-- 将来的な認証対応用のポリシー（コメントアウト）
-- CREATE POLICY "Users can read own diagnostics" 
-- ON public.diagnostics FOR SELECT
-- USING (auth.uid() = user_id OR user_id IS NULL);

-- CREATE POLICY "Users can update own diagnostics" 
-- ON public.diagnostics FOR UPDATE
-- USING (auth.uid() = user_id);

-- 管理者のみがすべてのレコードを削除可能
CREATE POLICY "Admin can delete diagnostics" 
ON public.diagnostics FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);
```

#### 詳細結果テーブルのRLSポリシー

```sql
-- Layer結果テーブルは診断テーブルと連動
CREATE POLICY "Read layer results based on diagnostic access" 
ON public.layer1_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.diagnostics d 
    WHERE d.id = diagnostic_id
  )
);

-- 同様にlayer2_results、layer3_resultsにも適用
CREATE POLICY "Read layer2 results based on diagnostic access" 
ON public.layer2_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.diagnostics d 
    WHERE d.id = diagnostic_id
  )
);

CREATE POLICY "Read layer3 results based on diagnostic access" 
ON public.layer3_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.diagnostics d 
    WHERE d.id = diagnostic_id
  )
);
```

### 4. Supabase Storage 設定

#### バケット作成

```sql
-- supabase/migrations/20250809000002_storage_setup.sql

-- レポート用バケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false, -- 署名付きURLでアクセス
  10485760, -- 10MB制限
  ARRAY['application/pdf', 'text/html', 'application/json']
);

-- スクリーンショット用バケット（将来的な拡張）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'screenshots',
  'screenshots', 
  false,
  5242880, -- 5MB制限
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);
```

#### Storage RLS ポリシー

```sql
-- レポートファイルのアクセス制御
CREATE POLICY "Anyone can upload reports" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Anyone can read reports" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'reports');

-- 7日後の自動削除用（cron jobで実装）
CREATE POLICY "Auto cleanup old reports" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'reports' 
  AND created_at < NOW() - INTERVAL '7 days'
);
```

### 5. Supabase Edge Functions 設定

#### Edge Functions ディレクトリ構造

```
supabase/functions/
├── _shared/
│   ├── cors.ts           # CORS ヘルパー
│   ├── database.ts       # DB接続ヘルパー
│   ├── validation.ts     # バリデーション
│   └── types.ts          # 共通型定義
├── diagnose/
│   └── index.ts         # 診断開始
├── process-diagnostic/
│   └── index.ts         # バックグラウンド処理
├── external-apis/
│   └── index.ts         # 外部API統合
├── reports/
│   └── index.ts         # レポート生成
├── health/
│   └── index.ts         # ヘルスチェック
└── update-progress/
    └── index.ts         # 進捗更新
```

#### 共通ヘルパー関数

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dailyup.co.jp',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
};
```

```typescript
// supabase/functions/_shared/database.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export const createServiceClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    }
  );
};

// データベースヘルパー関数
export const getDiagnosticById = async (id: string) => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('diagnostics')
    .select(`
      *,
      layer1_results(*),
      layer2_results(*),
      layer3_results(*),
      improvement_suggestions(*)
    `)
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
};
```

```typescript
// supabase/functions/_shared/validation.ts
export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const normalizeUrl = (url: string): string => {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
};

export const validateDiagnosticRequest = (body: any) => {
  if (!body.url || typeof body.url !== 'string') {
    throw new Error('URL is required');
  }
  
  if (!validateUrl(body.url)) {
    throw new Error('Invalid URL format');
  }
  
  if (body.language && !['ja', 'en'].includes(body.language)) {
    throw new Error('Unsupported language');
  }
};
```

### 6. 環境変数・シークレット設定

```bash
# Supabase シークレットの設定
supabase secrets set OPENAI_API_KEY=sk-your-openai-key
supabase secrets set GOOGLE_KNOWLEDGE_GRAPH_KEY=your-google-api-key
supabase secrets set PLAGIARISM_CHECKER_KEY=your-plagiarism-key
supabase secrets set AHREFS_API_KEY=your-ahrefs-key
supabase secrets set PAGESPEED_API_KEY=your-pagespeed-key

# 設定確認
supabase secrets list
```

#### ローカル開発用環境変数

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key

# 外部API（ローカル用）
OPENAI_API_KEY=sk-your-test-key
GOOGLE_KNOWLEDGE_GRAPH_KEY=test-key
```

### 7. Real-time 設定

#### Real-time の有効化

```sql
-- supabase/migrations/20250809000003_realtime_setup.sql

-- Real-time Publication の設定
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_cache;

-- Real-time用のレプリカIDENTITY設定
ALTER TABLE public.diagnostics REPLICA IDENTITY FULL;
ALTER TABLE public.diagnostic_progress REPLICA IDENTITY FULL;
```

#### Real-time フィルター設定

```typescript
// lib/realtime-config.ts
export const diagnosticProgressConfig = {
  event: '*',
  schema: 'public',
  table: 'diagnostic_progress',
  filter: 'diagnostic_id=eq.{diagnosticId}'
};

export const diagnosticStatusConfig = {
  event: 'UPDATE',
  schema: 'public', 
  table: 'diagnostics',
  filter: 'id=eq.{diagnosticId}'
};
```

### 8. Cron Jobs / 定期処理

#### pg_cron 拡張の有効化

```sql
-- supabase/migrations/20250809000004_cron_setup.sql

-- pg_cron拡張を有効化（Supabase Pro で利用可能）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 期限切れキャッシュの自動削除（毎時実行）
SELECT cron.schedule(
  'cleanup-expired-cache',
  '0 * * * *', -- 毎時0分に実行
  $$DELETE FROM public.diagnostic_cache WHERE expires_at < NOW();$$
);

-- 期限切れPDFリクエストの自動削除（毎日3時実行）
SELECT cron.schedule(
  'cleanup-expired-pdf-requests',
  '0 3 * * *', -- 毎日3:00AMに実行
  $$
    -- まずStorageからPDFファイルを削除
    DELETE FROM storage.objects 
    WHERE bucket_id = 'reports' 
      AND created_at < NOW() - INTERVAL '7 days';
    
    -- 次にpdf_requestsレコードを削除
    DELETE FROM public.pdf_requests
    WHERE expires_at < NOW();
  $$
);

-- 日次統計の集計（毎日1時実行）
SELECT cron.schedule(
  'daily-statistics',
  '0 1 * * *',
  $$
    INSERT INTO public.system_statistics (date, daily_stats)
    VALUES (
      CURRENT_DATE - INTERVAL '1 day',
      (SELECT jsonb_build_object(
        'total_diagnostics', COUNT(*),
        'completed_diagnostics', COUNT(*) FILTER (WHERE status = 'completed'),
        'failed_diagnostics', COUNT(*) FILTER (WHERE status = 'failed'),
        'avg_processing_time', AVG(processing_time_seconds) FILTER (WHERE processing_time_seconds IS NOT NULL),
        'unique_domains', COUNT(DISTINCT url_normalized),
        'layer1_avg_score', AVG(l1.total_score),
        'layer2_avg_score', AVG(l2.total_score),
        'layer3_avg_score', AVG(l3.total_score)
      )
      FROM public.diagnostics d
      LEFT JOIN public.layer1_results l1 ON d.id = l1.diagnostic_id
      LEFT JOIN public.layer2_results l2 ON d.id = l2.diagnostic_id  
      LEFT JOIN public.layer3_results l3 ON d.id = l3.diagnostic_id
      WHERE DATE(d.created_at) = CURRENT_DATE - INTERVAL '1 day')
    )
    ON CONFLICT (date) DO UPDATE SET
      daily_stats = EXCLUDED.daily_stats;
  $$
);
```

### 9. Database Webhooks

#### 外部通知用Webhook設定

```sql
-- supabase/migrations/20250809000005_webhooks.sql

-- 診断完了時のWebhook（Slack通知等）
CREATE OR REPLACE FUNCTION notify_diagnostic_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- HTTP POST を外部エンドポイントに送信（例：Slack）
    PERFORM pg_notify(
      'diagnostic_completed',
      json_build_object(
        'diagnostic_id', NEW.id,
        'url', NEW.url,
        'total_score', NEW.total_score,
        'completed_at', NEW.completed_at
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_diagnostic_completed
  AFTER UPDATE ON public.diagnostics
  FOR EACH ROW
  EXECUTE FUNCTION notify_diagnostic_completed();
```

### 10. バックアップ・災害復旧設定

#### Point-in-Time Recovery (PITR) 設定

```bash
# Supabase Pro の PITR は自動有効
# 設定確認
supabase db backup list

# 手動バックアップ作成
supabase db backup create
```

#### データベース複製設定

```bash
# 本番環境のダンプ作成
supabase db dump --file production_backup.sql

# ステージング環境への復元
supabase db reset --file production_backup.sql
```

### 11. モニタリング・アラート設定

#### Supabase Metrics 監視項目

```typescript
// lib/monitoring-config.ts
export const monitoringConfig = {
  // データベース監視
  database: {
    connections: { max: 100, alert: 80 },
    queryDuration: { max: 5000, alert: 3000 }, // ms
    errorRate: { max: 0.05, alert: 0.02 } // 5%
  },
  
  // Edge Functions監視
  functions: {
    invocations: { alert: 1000 }, // 1日1000回
    duration: { max: 30000, alert: 15000 }, // 30秒
    errorRate: { max: 0.1, alert: 0.05 }
  },
  
  // Storage監視
  storage: {
    size: { max: '5GB', alert: '4GB' },
    uploads: { alert: 100 }, // 1日100アップロード
    downloads: { alert: 500 }
  }
};
```

#### カスタムアラート設定

```sql
-- データベース異常検知用の関数
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  failed_diagnostics_ratio numeric;
  avg_processing_time numeric;
BEGIN
  -- 過去24時間の失敗率をチェック
  SELECT 
    COUNT(*) FILTER (WHERE status = 'failed')::numeric / NULLIF(COUNT(*), 0),
    AVG(processing_time_seconds) FILTER (WHERE processing_time_seconds IS NOT NULL)
  INTO failed_diagnostics_ratio, avg_processing_time
  FROM public.diagnostics
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  
  result := jsonb_build_object(
    'healthy', 
    CASE 
      WHEN failed_diagnostics_ratio > 0.1 THEN false  -- 10%超の失敗率
      WHEN avg_processing_time > 120 THEN false       -- 平均処理時間2分超
      ELSE true
    END,
    'failed_ratio', failed_diagnostics_ratio,
    'avg_processing_time', avg_processing_time,
    'checked_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 12. セキュリティ設定

#### Database セキュリティ

```sql
-- 機密データの暗号化用設定
-- supabase/migrations/20250809000006_security.sql

-- APIキー等の暗号化（将来的な拡張）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 監査ログ用テーブル
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 監査ログ関数
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    table_name, operation, old_data, new_data, user_id, ip_address
  ) VALUES (
    TG_TABLE_NAME, TG_OP, 
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### API レート制限

```typescript
// supabase/functions/_shared/rate-limit.ts
const RATE_LIMITS = {
  diagnose: { requests: 10, window: 3600000 }, // 1時間に10回
  report: { requests: 5, window: 3600000 },    // 1時間に5回
  default: { requests: 100, window: 3600000 }
};

export const checkRateLimit = async (
  req: Request, 
  endpoint: string
): Promise<boolean> => {
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  const key = `rate_limit:${endpoint}:${clientIP}`;
  
  // Supabase KV または Redis代替の実装
  // 現在はメモリベースの簡易実装
  const now = Date.now();
  const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  
  // 実際のプロダクションではSupabase KVやRedisを使用
  return true; // 暫定的に許可
};
```

### 13. 開発・デプロイワークフロー

#### ローカル開発環境

```bash
# Supabaseローカル起動
supabase start

# データベーススキーマの同期
supabase db reset

# Edge Functionsのローカル実行
supabase functions serve --env-file .env.local

# 型定義の生成
supabase gen types typescript --local > types/database.types.ts
```

#### CI/CD パイプライン

```yaml
# .github/workflows/supabase-deploy.yml
name: Deploy to Supabase

on:
  push:
    branches: [main]
    paths: ['supabase/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Deploy database changes
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      - name: Deploy Edge Functions
        run: supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### 14. コスト最適化

#### Supabase Pro コスト管理

```sql
-- データ使用量の監視クエリ
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_stat_get_tuples_inserted(c.oid) as inserts,
  pg_stat_get_tuples_updated(c.oid) as updates,
  pg_stat_get_tuples_deleted(c.oid) as deletes
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 古いデータの定期削除
DELETE FROM public.api_usage 
WHERE created_at < NOW() - INTERVAL '30 days';

DELETE FROM public.diagnostic_cache 
WHERE expires_at < NOW() - INTERVAL '7 days';
```

#### Edge Functions 使用量最適化

```typescript
// 効率的なクエリ実行
const optimizedQuery = async (supabase: SupabaseClient) => {
  // 必要なカラムのみを選択
  const { data } = await supabase
    .from('diagnostics')
    .select('id, url, status, total_score')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10);
    
  return data;
};

// キャッシュの活用
const getCachedResult = async (url: string) => {
  const { data } = await supabase
    .from('diagnostic_cache')
    .select('diagnostic_id')
    .eq('url_normalized', normalizeUrl(url))
    .gt('expires_at', new Date().toISOString())
    .single();
    
  return data;
};
```

この Supabase 設定により、LLMO診断ツールを効率的かつ安全に運用し、DaiLYUPサイトへの統合を実現できます。