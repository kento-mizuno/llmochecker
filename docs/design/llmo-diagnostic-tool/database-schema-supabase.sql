-- =====================================================
-- LLMO診断ツール Supabase Pro データベーススキーマ
-- DBMS: Supabase PostgreSQL (v15) with Extensions
-- 作成日: 2025-08-09
-- 統合先: https://dailyup.co.jp/
-- =====================================================

-- Supabaseの拡張機能確認・有効化
-- これらはSupabase Proで利用可能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. 診断関連テーブル（Supabase最適化）
-- =====================================================

-- 診断メインテーブル
CREATE TABLE public.diagnostics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    url_normalized TEXT NOT NULL, -- 正規化されたURL（キャッシュキー）
    status TEXT NOT NULL DEFAULT 'pending',
    language TEXT NOT NULL DEFAULT 'ja',
    
    -- 診断オプション
    deep_analysis BOOLEAN DEFAULT false,
    layers TEXT[] DEFAULT ARRAY['layer1', 'layer2', 'layer3'],
    skip_external_apis BOOLEAN DEFAULT false,
    
    -- タイミング
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    processing_time_seconds INTEGER,
    
    -- 総合スコア
    total_score DECIMAL(5,2), -- 0.00-100.00
    
    -- 技術的メタデータのみ（個人情報なし）
    url_after_redirects TEXT,
    response_code INTEGER,
    page_size_bytes BIGINT,
    load_time_ms INTEGER,
    
    -- エラー情報
    error_code TEXT,
    error_message TEXT,
    error_details JSONB,
    
    -- Supabase標準フィールド
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 完全匿名診断のため認証連携なし
    
    CONSTRAINT diagnostics_status_check 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'timeout', 'partial')),
    CONSTRAINT diagnostics_language_check 
        CHECK (language IN ('ja', 'en')),
    CONSTRAINT diagnostics_total_score_check 
        CHECK (total_score IS NULL OR (total_score >= 0 AND total_score <= 100))
);

-- Row Level Security (RLS) 設定
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- 現在は全ての診断結果を公開（将来的にユーザー認証時に制限）
CREATE POLICY "Allow read access to all diagnostics" ON public.diagnostics
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for all users" ON public.diagnostics
    FOR INSERT WITH CHECK (true);

-- 完全匿名診断のため更新は内部処理のみ
CREATE POLICY "Allow update diagnostics" ON public.diagnostics
    FOR UPDATE USING (true);

-- Layer 1 結果テーブル（信頼性の基礎）
CREATE TABLE public.layer1_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagnostic_id UUID NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
    
    -- 総合スコア
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    weight DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    
    -- E-E-A-T スコア詳細
    eeat_scores JSONB NOT NULL DEFAULT '{
        "total": 0,
        "experience": {
            "score": 0,
            "first_person_expressions": 0,
            "original_images": 0,
            "case_studies": 0,
            "testing_evidence": false
        },
        "expertise": {
            "score": 0,
            "author_info_exists": false,
            "qualifications": [],
            "linkedin_profile": null,
            "professional_background": [],
            "ymyl_specialist_required": false,
            "ymyl_specialist_present": false
        },
        "authoritativeness": {
            "score": 0,
            "backlinks_count": 0,
            "authoritative_backlinks": 0,
            "media_mentions": 0,
            "industry_recognition": [],
            "wikipedia_presence": false
        },
        "trustworthiness": {
            "score": 0,
            "https_enabled": false,
            "contact_info_present": false,
            "privacy_policy_exists": false,
            "external_citations_count": 0
        }
    }'::jsonb,
    
    -- エンティティスコア詳細
    entity_scores JSONB NOT NULL DEFAULT '{
        "total": 0,
        "knowledge_graph_presence": false,
        "nap_consistency": {
            "score": 0,
            "name_variations": [],
            "address_variations": [],
            "phone_variations": [],
            "consistency_rate": 0
        },
        "entity_disambiguation": {
            "score": 0,
            "same_as_properties": [],
            "official_social_profiles": [],
            "structured_data_present": false
        }
    }'::jsonb,
    
    -- コンテンツ品質スコア詳細
    content_quality_scores JSONB NOT NULL DEFAULT '{
        "total": 0,
        "originality_score": 0,
        "primary_information": {
            "score": 0,
            "unique_data_points": 0,
            "original_research": false,
            "surveys_or_interviews": false,
            "exclusive_insights": false
        },
        "citations": {
            "score": 0,
            "external_links_count": 0,
            "authority_sources_count": 0,
            "citation_format": "none"
        },
        "freshness": {
            "score": 0,
            "last_updated": null,
            "regularly_updated": false,
            "timely_content": false
        }
    }'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT layer1_scores_range 
        CHECK (total_score >= 0 AND total_score <= 100)
);

-- Layer 2 結果テーブル（構造最適化）
CREATE TABLE public.layer2_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagnostic_id UUID NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
    
    -- 総合スコア
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    weight DECIMAL(3,2) NOT NULL DEFAULT 0.3,
    
    -- AIフォーマットスコア詳細
    ai_format_scores JSONB NOT NULL DEFAULT '{
        "total": 0,
        "faq_format": {
            "score": 0,
            "faq_section_exists": false,
            "question_format_headings": 0,
            "question_answer_pairs": 0
        },
        "list_usage": {
            "score": 0,
            "ordered_lists": 0,
            "unordered_lists": 0,
            "tables_count": 0,
            "comparison_tables": 0
        },
        "definitions": {
            "score": 0,
            "clear_definitions": 0,
            "summary_boxes": 0,
            "key_takeaways": 0
        },
        "chunking": {
            "score": 0,
            "self_contained_sections": 0,
            "logical_breaks": false,
            "information_hierarchy": 1
        }
    }'::jsonb,
    
    -- 文書構造スコア詳細
    document_structure_scores JSONB NOT NULL DEFAULT '{
        "total": 0,
        "heading_structure": {
            "score": 0,
            "h1_count": 0,
            "hierarchy_valid": false,
            "skipped_levels": 0,
            "max_depth": 0
        },
        "semantic_html": {
            "score": 0,
            "article_tag": false,
            "section_tags": 0,
            "aside_tags": 0,
            "nav_tag": false,
            "figure_tags": 0,
            "generic_div_ratio": 0
        },
        "outline_quality": {
            "score": 0,
            "descriptive_headings": 0,
            "logical_flow": false,
            "contentful_headings": 0
        }
    }'::jsonb,
    
    -- 明確性スコア詳細
    clarity_scores JSONB NOT NULL DEFAULT '{
        "total": 0,
        "readability_score": 0,
        "writing_style": {
            "score": 0,
            "conclusion_first": false,
            "avg_paragraph_length": 0,
            "avg_sentence_length": 0,
            "passive_voice_ratio": 0
        },
        "ambiguity": {
            "score": 0,
            "vague_expressions": 0,
            "promotional_language": 0,
            "factual_statements": 0
        }
    }'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT layer2_scores_range 
        CHECK (total_score >= 0 AND total_score <= 100)
);

-- Layer 3 結果テーブル（技術実装）
CREATE TABLE public.layer3_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagnostic_id UUID NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
    
    -- 総合スコア
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    weight DECIMAL(3,2) NOT NULL DEFAULT 0.2,
    
    -- 構造化データスコア詳細
    structured_data_scores JSONB NOT NULL DEFAULT '{
        "total": 0,
        "json_ld_present": false,
        "validation_score": 0,
        "schema_types": {
            "organization": {"present": false, "valid": false, "completeness": 0},
            "person": {"present": false, "valid": false, "completeness": 0},
            "article": {"present": false, "valid": false, "completeness": 0},
            "faq_page": {"present": false, "valid": false, "completeness": 0},
            "product": {"present": false, "valid": false, "completeness": 0},
            "how_to": {"present": false, "valid": false, "completeness": 0}
        }
    }'::jsonb,
    
    -- 技術的健全性スコア詳細
    technical_health_scores JSONB NOT NULL DEFAULT '{
        "total": 0,
        "crawlability": {
            "score": 0,
            "robots_txt_valid": false,
            "ai_crawlers_blocked": false,
            "xml_sitemap_exists": false,
            "canonical_tag_valid": false
        },
        "page_experience": {
            "score": 0,
            "mobile_optimized": false,
            "core_web_vitals": {
                "lcp": null,
                "inp": null,
                "cls": null,
                "overall_score": 0
            }
        },
        "security": {
            "score": 0,
            "https_grade": null,
            "certificate_valid": false,
            "mixed_content_issues": 0
        }
    }'::jsonb,
    
    -- LLMS.txt（投機的）
    llms_txt_scores JSONB NOT NULL DEFAULT '{
        "total": 0,
        "file_exists": false,
        "noindex_set": false,
        "valid_format": false,
        "note": "speculative-standard"
    }'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT layer3_scores_range 
        CHECK (total_score >= 0 AND total_score <= 100)
);

-- 改善提案テーブル
CREATE TABLE public.improvement_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagnostic_id UUID NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
    
    priority TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- アクション項目（配列として格納）
    action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- 影響度推定
    impact_estimate JSONB NOT NULL DEFAULT '{
        "score_improvement": 0,
        "confidence_level": 0,
        "time_to_see_results": null
    }'::jsonb,
    
    implementation_difficulty TEXT NOT NULL,
    related_metrics TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT suggestions_priority_check 
        CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    CONSTRAINT suggestions_category_check 
        CHECK (category IN ('e-e-a-t', 'entity', 'content-quality', 
                           'ai-format', 'document-structure', 'clarity', 
                           'structured-data', 'technical-health', 'speculative')),
    CONSTRAINT suggestions_difficulty_check 
        CHECK (implementation_difficulty IN ('easy', 'moderate', 'difficult', 'expert'))
);

-- =====================================================
-- 2. Supabaseキャッシュ・リアルタイム対応
-- =====================================================

-- 診断結果キャッシュテーブル（Supabaseリアルタイム対応）
CREATE TABLE public.diagnostic_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_normalized TEXT NOT NULL UNIQUE,
    diagnostic_id UUID NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
    
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    
    -- リアルタイム更新用
    last_update TIMESTAMPTZ DEFAULT NOW()
);

-- Supabaseリアルタイム有効化
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_cache;

-- 診断進捗テーブル（リアルタイム進捗表示用）
CREATE TABLE public.diagnostic_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagnostic_id UUID NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
    
    percentage INTEGER NOT NULL DEFAULT 0, -- 0-100
    current_stage TEXT NOT NULL DEFAULT 'initializing',
    stage_details TEXT,
    estimated_time_remaining INTEGER, -- 秒
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT progress_percentage_check 
        CHECK (percentage >= 0 AND percentage <= 100),
    
    -- 診断IDごとに進捗レコードは1つのみ
    UNIQUE(diagnostic_id)
);

-- 進捗テーブルもリアルタイム対応
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_progress;

-- ベンチマークデータテーブル
CREATE TABLE public.benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    industry TEXT, -- NULL = 全業界
    category TEXT NOT NULL, -- 'total', 'layer1', 'layer2', 'layer3', etc.
    
    -- 統計データ
    statistics JSONB NOT NULL DEFAULT '{
        "sample_size": 0,
        "average_score": 0,
        "median_score": 0,
        "percentile_90": 0,
        "percentile_75": 0,
        "percentile_25": 0,
        "percentile_10": 0
    }'::jsonb,
    
    -- メタデータ
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    data_source TEXT DEFAULT 'llmocheck.ai',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(industry, category)
);

-- =====================================================
-- 3. Supabase Storage統合用テーブル
-- =====================================================

-- PDFリクエストテーブル（個人情報取得はPDF要求時のみ）
CREATE TABLE public.pdf_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagnostic_id UUID NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
    
    -- PDF要求時のみ取得する個人情報
    company_name TEXT NOT NULL,
    email TEXT NOT NULL,
    consent_marketing BOOLEAN DEFAULT false,
    
    -- レポート設定
    format TEXT NOT NULL DEFAULT 'pdf',
    language TEXT NOT NULL DEFAULT 'ja',
    template TEXT NOT NULL DEFAULT 'standard',
    
    options JSONB NOT NULL DEFAULT '{
        "include_benchmark": true,
        "include_details": true
    }'::jsonb,
    
    -- Supabase Storage情報
    storage_bucket TEXT DEFAULT 'reports',
    storage_path TEXT, -- バケット内のパス
    file_size_bytes BIGINT,
    download_url TEXT, -- Supabaseの署名付きURL
    
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    downloaded_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT pdf_format_check 
        CHECK (format IN ('pdf')),
    CONSTRAINT pdf_template_check 
        CHECK (template IN ('standard', 'executive', 'technical'))
);

-- =====================================================
-- 4. Supabase Analytics & Admin
-- =====================================================

-- システム統計テーブル
CREATE TABLE public.system_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    
    daily_stats JSONB NOT NULL DEFAULT '{
        "total_diagnostics": 0,
        "completed_diagnostics": 0,
        "failed_diagnostics": 0,
        "avg_processing_time": 0,
        "cache_hit_rate": 0,
        "unique_domains": 0,
        "layer1_avg_score": 0,
        "layer2_avg_score": 0,
        "layer3_avg_score": 0
    }'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API使用状況テーブル（匿名統計のみ）
CREATE TABLE public.api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 匿名化されたリクエスト情報
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    -- 個人情報は一切記録しない
    
    -- レスポンス情報
    response_status INTEGER,
    processing_time_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. Supabase最適化インデックス
-- =====================================================

-- 診断テーブルのインデックス
CREATE INDEX idx_diagnostics_url_normalized ON public.diagnostics(url_normalized);
CREATE INDEX idx_diagnostics_status ON public.diagnostics(status);
CREATE INDEX idx_diagnostics_created_at ON public.diagnostics(created_at DESC);
-- 匿名診断のためユーザーIDインデックス不要

-- JSONB フィールド用 GIN インデックス
CREATE INDEX idx_layer1_eeat_gin ON public.layer1_results USING GIN (eeat_scores);
CREATE INDEX idx_layer2_ai_format_gin ON public.layer2_results USING GIN (ai_format_scores);
CREATE INDEX idx_layer3_structured_gin ON public.layer3_results USING GIN (structured_data_scores);

-- Layer結果テーブルのインデックス
CREATE INDEX idx_layer1_diagnostic_id ON public.layer1_results(diagnostic_id);
CREATE INDEX idx_layer2_diagnostic_id ON public.layer2_results(diagnostic_id);
CREATE INDEX idx_layer3_diagnostic_id ON public.layer3_results(diagnostic_id);

-- 改善提案テーブルのインデックス
CREATE INDEX idx_suggestions_diagnostic_id ON public.improvement_suggestions(diagnostic_id);
CREATE INDEX idx_suggestions_priority ON public.improvement_suggestions(priority);

-- キャッシュテーブルのインデックス
CREATE INDEX idx_cache_url_normalized ON public.diagnostic_cache(url_normalized);
CREATE INDEX idx_cache_expires_at ON public.diagnostic_cache(expires_at);

-- 進捗テーブルのインデックス
CREATE INDEX idx_progress_diagnostic_id ON public.diagnostic_progress(diagnostic_id);

-- PDF要求テーブルのインデックス
CREATE INDEX idx_pdf_requests_diagnostic_id ON public.pdf_requests(diagnostic_id);
CREATE INDEX idx_pdf_requests_email ON public.pdf_requests(email);
CREATE INDEX idx_pdf_requests_created_at ON public.pdf_requests(created_at DESC);

-- システム統計・分析用インデックス（匿名統計のみ）
CREATE INDEX idx_statistics_date ON public.system_statistics(date DESC);
CREATE INDEX idx_api_usage_created_at ON public.api_usage(created_at DESC);
CREATE INDEX idx_api_usage_endpoint ON public.api_usage(endpoint);

-- 全文検索インデックス（改善提案検索用）
CREATE INDEX idx_suggestions_search ON public.improvement_suggestions 
USING gin(to_tsvector('japanese', title || ' ' || description));

-- =====================================================
-- 6. Supabase Real-time Triggers
-- =====================================================

-- 診断進捗更新トリガー
CREATE OR REPLACE FUNCTION update_diagnostic_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- 診断ステータス変更時に進捗を更新
    IF OLD.status != NEW.status THEN
        INSERT INTO public.diagnostic_progress (diagnostic_id, current_stage, percentage)
        VALUES (
            NEW.id,
            CASE NEW.status
                WHEN 'processing' THEN 'analyzing_content'
                WHEN 'completed' THEN 'finished'
                WHEN 'failed' THEN 'error_occurred'
                ELSE 'initializing'
            END,
            CASE NEW.status
                WHEN 'processing' THEN 10
                WHEN 'completed' THEN 100
                WHEN 'failed' THEN 0
                ELSE 0
            END
        )
        ON CONFLICT (diagnostic_id) DO UPDATE SET
            current_stage = EXCLUDED.current_stage,
            percentage = EXCLUDED.percentage,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_diagnostic_progress
    AFTER UPDATE ON public.diagnostics
    FOR EACH ROW EXECUTE FUNCTION update_diagnostic_progress();

-- updated_at自動更新関数（Supabase標準）
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- diagnosticsテーブルのupdated_atトリガー
CREATE TRIGGER handle_diagnostics_updated_at 
    BEFORE UPDATE ON public.diagnostics 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- 7. Supabase Edge Functions用ヘルパー関数
-- =====================================================

-- 診断結果の集計関数
CREATE OR REPLACE FUNCTION get_diagnostic_summary(diagnostic_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'diagnostic', d.*,
        'layer1', l1.*,
        'layer2', l2.*,
        'layer3', l3.*,
        'suggestions', (
            SELECT jsonb_agg(s.*) 
            FROM public.improvement_suggestions s 
            WHERE s.diagnostic_id = diagnostic_uuid
        )
    )
    INTO result
    FROM public.diagnostics d
    LEFT JOIN public.layer1_results l1 ON d.id = l1.diagnostic_id
    LEFT JOIN public.layer2_results l2 ON d.id = l2.diagnostic_id
    LEFT JOIN public.layer3_results l3 ON d.id = l3.diagnostic_id
    WHERE d.id = diagnostic_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- キャッシュクリーンアップ関数（Supabase Cron対応）
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    cache_deleted INTEGER;
    reports_deleted INTEGER;
    logs_deleted INTEGER;
BEGIN
    -- 期限切れキャッシュ削除
    DELETE FROM public.diagnostic_cache 
    WHERE expires_at < NOW();
    GET DIAGNOSTICS cache_deleted = ROW_COUNT;
    
    -- 期限切れPDFリクエスト削除
    DELETE FROM public.pdf_requests 
    WHERE expires_at < NOW();
    GET DIAGNOSTICS reports_deleted = ROW_COUNT;
    
    -- 30日以上前のAPIログ削除
    DELETE FROM public.api_usage 
    WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS logs_deleted = ROW_COUNT;
    
    deleted_count := cache_deleted + reports_deleted + logs_deleted;
    
    -- 統計に記録
    INSERT INTO public.system_statistics (date, daily_stats)
    VALUES (CURRENT_DATE, jsonb_build_object(
        'cleanup_performed', true,
        'records_deleted', deleted_count,
        'cache_deleted', cache_deleted,
        'reports_deleted', reports_deleted,
        'logs_deleted', logs_deleted
    ))
    ON CONFLICT (date) DO UPDATE SET
        daily_stats = public.system_statistics.daily_stats || EXCLUDED.daily_stats;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. Supabase RLS ポリシー追加設定
-- =====================================================

-- Layer結果テーブルのRLS
ALTER TABLE public.layer1_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layer2_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layer3_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to layer results" ON public.layer1_results FOR SELECT USING (true);
CREATE POLICY "Allow read access to layer results" ON public.layer2_results FOR SELECT USING (true);
CREATE POLICY "Allow read access to layer results" ON public.layer3_results FOR SELECT USING (true);

CREATE POLICY "Allow insert layer results" ON public.layer1_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert layer results" ON public.layer2_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert layer results" ON public.layer3_results FOR INSERT WITH CHECK (true);

-- 改善提案のRLS
ALTER TABLE public.improvement_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read suggestions" ON public.improvement_suggestions FOR SELECT USING (true);
CREATE POLICY "Allow insert suggestions" ON public.improvement_suggestions FOR INSERT WITH CHECK (true);

-- キャッシュテーブルのRLS
ALTER TABLE public.diagnostic_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read cache" ON public.diagnostic_cache FOR SELECT USING (true);
CREATE POLICY "Allow insert cache" ON public.diagnostic_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update cache" ON public.diagnostic_cache FOR UPDATE USING (true);

-- 進捗テーブルのRLS
ALTER TABLE public.diagnostic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read progress" ON public.diagnostic_progress FOR SELECT USING (true);
CREATE POLICY "Allow insert progress" ON public.diagnostic_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update progress" ON public.diagnostic_progress FOR UPDATE USING (true);

-- =====================================================
-- 9. 初期データ（Supabase向け調整）
-- =====================================================

-- ベンチマークデータの初期値
INSERT INTO public.benchmarks (industry, category, statistics, data_source) VALUES
('general', 'total', '{
    "sample_size": 1000,
    "average_score": 65.5,
    "median_score": 68.2,
    "percentile_90": 89.1,
    "percentile_75": 78.3,
    "percentile_25": 52.1,
    "percentile_10": 31.4
}'::jsonb, 'llmocheck.ai'),

('general', 'layer1', '{
    "sample_size": 1000,
    "average_score": 58.2,
    "median_score": 60.1,
    "percentile_90": 85.3,
    "percentile_75": 74.2,
    "percentile_25": 45.8,
    "percentile_10": 28.9
}'::jsonb, 'llmocheck.ai'),

('general', 'layer2', '{
    "sample_size": 1000,
    "average_score": 72.1,
    "median_score": 74.5,
    "percentile_90": 91.2,
    "percentile_75": 82.7,
    "percentile_25": 63.4,
    "percentile_10": 41.2
}'::jsonb, 'llmocheck.ai'),

('general', 'layer3', '{
    "sample_size": 1000,
    "average_score": 69.8,
    "median_score": 71.3,
    "percentile_90": 88.7,
    "percentile_75": 79.5,
    "percentile_25": 58.9,
    "percentile_10": 38.7
}'::jsonb, 'llmocheck.ai');

-- システム統計の初期化
INSERT INTO public.system_statistics (date, daily_stats)
VALUES (CURRENT_DATE, '{
    "total_diagnostics": 0,
    "completed_diagnostics": 0,
    "failed_diagnostics": 0,
    "avg_processing_time": 0,
    "cache_hit_rate": 0,
    "unique_domains": 0,
    "layer1_avg_score": 0,
    "layer2_avg_score": 0,
    "layer3_avg_score": 0
}'::jsonb);

-- =====================================================
-- 10. Supabase Dashboard用ビュー
-- =====================================================

-- 診断サマリービュー（Supabase Dashboard表示用）
CREATE OR REPLACE VIEW public.v_diagnostic_summary AS
SELECT 
    d.id,
    d.url,
    d.status,
    d.total_score,
    d.started_at,
    d.completed_at,
    d.processing_time_seconds,
    
    l1.total_score as layer1_score,
    l2.total_score as layer2_score,
    l3.total_score as layer3_score,
    
    COUNT(s.id) as suggestion_count,
    COUNT(CASE WHEN s.priority = 'critical' THEN 1 END) as critical_suggestions,
    COUNT(CASE WHEN s.priority = 'high' THEN 1 END) as high_suggestions
    
FROM public.diagnostics d
LEFT JOIN public.layer1_results l1 ON d.id = l1.diagnostic_id
LEFT JOIN public.layer2_results l2 ON d.id = l2.diagnostic_id
LEFT JOIN public.layer3_results l3 ON d.id = l3.diagnostic_id
LEFT JOIN public.improvement_suggestions s ON d.id = s.diagnostic_id
GROUP BY d.id, l1.total_score, l2.total_score, l3.total_score
ORDER BY d.created_at DESC;

-- =====================================================
-- Supabase Pro スキーマ作成完了
-- =====================================================

-- 作成されたテーブルの確認
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE 'sql_%'
ORDER BY table_name;