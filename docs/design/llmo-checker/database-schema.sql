-- LLMO無料診断 データベーススキーマ
-- Supabase PostgreSQL用

-- ===========================
-- テーブル作成
-- ===========================

-- 評価基準マスタテーブル
CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- 評価項目名（日本語）
    category TEXT NOT NULL CHECK (category IN (
        'e_e_a_t', 'entity', 'quality', 'ai_friendly', 
        'document_hierarchy', 'language_clarity', 'technical'
    )),
    impact TEXT NOT NULL CHECK (impact IN ('critical', 'important', 'moderate', 'low')),
    description TEXT NOT NULL, -- 項目説明
    llmo_reason TEXT NOT NULL, -- LLMO重要性の理由
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.00 CHECK (weight >= 0 AND weight <= 1), -- 重み付け
    display_order INTEGER NOT NULL, -- 表示順序
    is_active BOOLEAN NOT NULL DEFAULT true, -- 有効/無効
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 診断テーブル（メイン）
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL, -- 診断対象URL
    url_hash TEXT NOT NULL, -- URL正規化後のハッシュ値（キャッシュキー）
    total_score INTEGER CHECK (total_score >= 0 AND total_score <= 100), -- 総合スコア
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'analyzing', 'crawling', 'evaluating', 
        'ai_analyzing', 'completed', 'failed', 'partial'
    )),
    error_message TEXT, -- エラー時のメッセージ
    meta_data JSONB, -- サイトメタデータ（title, description等）
    technical_info JSONB, -- 技術情報（HTTPS、パフォーマンス等）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE -- 診断完了日時
);

-- 評価結果テーブル
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id UUID NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100), -- 項目別スコア
    status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'needs_improvement')),
    reason TEXT NOT NULL, -- 評価理由
    ai_analysis TEXT, -- Gemini による詳細分析
    evidence JSONB, -- 評価根拠データ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(diagnosis_id, criteria_id) -- 同一診断・項目の重複防止
);

-- 改善提案テーブル
CREATE TABLE improvements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id UUID NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES evaluation_criteria(id), -- 対応する評価項目（任意）
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    title TEXT NOT NULL, -- 改善提案タイトル
    description TEXT NOT NULL, -- 改善提案詳細
    action_items JSONB NOT NULL DEFAULT '[]', -- 具体的なアクション項目（配列）
    implementation_example TEXT, -- 実装例
    estimated_impact INTEGER CHECK (estimated_impact >= 0 AND estimated_impact <= 100), -- 予想改善効果
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 診断進捗テーブル（リアルタイム更新用）
CREATE TABLE diagnosis_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id UUID NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
    percentage INTEGER NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
    current_stage TEXT NOT NULL,
    stage_description TEXT NOT NULL,
    estimated_remaining_seconds INTEGER,
    completed_evaluations INTEGER DEFAULT 0,
    total_evaluations INTEGER DEFAULT 18,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(diagnosis_id) -- 1診断につき1進捗記録
);

-- ===========================
-- インデックス作成
-- ===========================

-- 診断テーブル用インデックス
CREATE INDEX idx_diagnoses_url_hash ON diagnoses(url_hash);
CREATE INDEX idx_diagnoses_status ON diagnoses(status);
CREATE INDEX idx_diagnoses_created_at ON diagnoses(created_at DESC);
CREATE INDEX idx_diagnoses_url_created ON diagnoses(url, created_at DESC); -- URL別最新取得用

-- 評価結果テーブル用インデックス
CREATE INDEX idx_evaluations_diagnosis_id ON evaluations(diagnosis_id);
CREATE INDEX idx_evaluations_criteria_id ON evaluations(criteria_id);
CREATE INDEX idx_evaluations_status ON evaluations(status);

-- 改善提案テーブル用インデックス
CREATE INDEX idx_improvements_diagnosis_id ON improvements(diagnosis_id);
CREATE INDEX idx_improvements_priority ON improvements(priority);

-- 評価基準マスタ用インデックス
CREATE INDEX idx_evaluation_criteria_category ON evaluation_criteria(category);
CREATE INDEX idx_evaluation_criteria_active_order ON evaluation_criteria(is_active, display_order);

-- ===========================
-- RLS (Row Level Security) 設定
-- ===========================

-- RLS有効化
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_progress ENABLE ROW LEVEL SECURITY;

-- 読み取り専用ポリシー（全データ読み取り可能）
CREATE POLICY "Public read access for diagnoses" ON diagnoses FOR SELECT USING (true);
CREATE POLICY "Public read access for evaluations" ON evaluations FOR SELECT USING (true);
CREATE POLICY "Public read access for improvements" ON improvements FOR SELECT USING (true);
CREATE POLICY "Public read access for diagnosis_progress" ON diagnosis_progress FOR SELECT USING (true);
CREATE POLICY "Public read access for evaluation_criteria" ON evaluation_criteria FOR SELECT USING (is_active = true);

-- 書き込みはサーバーサイド（Edge Functions）のみ
CREATE POLICY "Service role insert for diagnoses" ON diagnoses FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role update for diagnoses" ON diagnoses FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role insert for evaluations" ON evaluations FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role insert for improvements" ON improvements FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role all for diagnosis_progress" ON diagnosis_progress FOR ALL USING (auth.role() = 'service_role');

-- ===========================
-- 初期データ投入（評価基準マスタ）
-- ===========================

INSERT INTO evaluation_criteria (name, category, impact, description, llmo_reason, weight, display_order) VALUES
-- E-E-A-T（最重要カテゴリ）
('経験（Experience）の明示', 'e_e_a_t', 'critical', '一次情報や実体験に基づくコンテンツの有無を評価', '一次情報や実体験に基づくコンテンツである', 1.00, 1),
('専門性（Expertise）の証明', 'e_e_a_t', 'critical', '著者や監修者の専門資格の明記を確認', '著者や監修者の専門資格が明記されている', 1.00, 2),
('権威性（Authoritativeness）の構築', 'e_e_a_t', 'critical', '第三者からの言及の有無を確認', '第三者からの言及がある、権威あるサイトからの被リンクがある', 1.00, 3),
('信頼性（Trustworthiness）の確保', 'e_e_a_t', 'critical', 'HTTPS化、運営者情報、引用元の正確性をチェック', 'サイトがHTTPSになっている、運営者情報が明記されている、情報の引用元が正確である', 1.00, 4),

-- エンティティ（最重要カテゴリ）
('ナレッジグラフでの存在感', 'entity', 'critical', 'Googleナレッジパネルへの登録状況を確認', 'Googleナレッジパネル等に登録されている', 1.00, 5),
('NAP情報の一貫性', 'entity', 'critical', '企業名、住所、電話番号の一貫性を評価', '企業名、住所、電話番号が一貫している', 1.00, 6),

-- 品質と独創性（最重要カテゴリ）
('コンテンツの独創性', 'quality', 'critical', '独自調査や一次情報の含有を評価', '独自調査や一次情報を含んでいる', 1.00, 7),
('情報の正確性と検証可能性', 'quality', 'critical', '信頼できる情報源への引用を確認', '信頼できる情報源への引用がある、出典が明記されている', 1.00, 8),

-- AIフレンドリーなフォーマット（重要カテゴリ）
('Q&Aフォーマットの活用', 'ai_friendly', 'important', '質問と回答形式のコンテンツを評価', '質問と回答の形式で記載されている', 0.80, 9),
('リスト・表形式の活用', 'ai_friendly', 'important', '構造化されたリストや比較表の使用を確認', '構造化されたリストや比較表が含まれている', 0.80, 10),
('要約・定義文の提示', 'ai_friendly', 'important', '簡潔な定義文や要約の含有を評価', '簡潔な定義文や要約が含まれている', 0.80, 11),

-- 文書階層（重要カテゴリ）
('論理的な見出し構造（H1-H6）', 'document_hierarchy', 'important', '見出しタグの階層構造を評価', '見出しタグが論理的な階層構造になっている', 0.80, 12),
('セマンティックHTMLの活用', 'document_hierarchy', 'important', 'article、sectionタグの適切な使用を確認', '<article>や<section>などのタグが適切に使われている', 0.80, 13),

-- 言語の明確性（重要カテゴリ）
('結論ファーストの文章構成', 'language_clarity', 'important', '結論が先に述べられているかを評価', '結論が先に述べられており、その後に詳細が説明されている', 0.80, 14),

-- 技術的シグナル（中程度カテゴリ）
('構造化データ（Schema.org）', 'technical', 'moderate', 'Organization、Person、FAQPageスキーマの実装を確認', 'Organization、Person、FAQPageなどのスキーマが実装されている', 0.60, 15),
('クロール容易性', 'technical', 'moderate', 'robots.txtの適切な設定、XMLサイトマップの設置を確認', 'robots.txtが適切に設定されている、XMLサイトマップが設置されている', 0.60, 16),
('ページエクスペリエンス', 'technical', 'moderate', 'サイトの表示速度、モバイルフレンドリー性を評価', 'サイトの表示速度が高速である、モバイルフレンドリーである', 0.60, 17),
('llms.txtの設置', 'technical', 'low', 'llms.txtファイルの存在を確認', 'llms.txtが設置されている', 0.40, 18);

-- ===========================
-- ビュー作成
-- ===========================

-- 診断結果詳細ビュー（よく使用される結合を事前定義）
CREATE VIEW diagnosis_details AS
SELECT 
    d.id,
    d.url,
    d.url_hash,
    d.total_score,
    d.status,
    d.created_at,
    d.completed_at,
    d.meta_data,
    COUNT(e.id) as total_evaluations,
    COUNT(CASE WHEN e.status = 'pass' THEN 1 END) as passed_evaluations,
    COUNT(CASE WHEN e.status = 'fail' THEN 1 END) as failed_evaluations,
    COUNT(CASE WHEN e.status = 'needs_improvement' THEN 1 END) as needs_improvement_evaluations,
    COUNT(i.id) as total_improvements,
    COUNT(CASE WHEN i.priority = 'high' THEN 1 END) as high_priority_improvements
FROM diagnoses d
LEFT JOIN evaluations e ON d.id = e.diagnosis_id
LEFT JOIN improvements i ON d.id = i.diagnosis_id
GROUP BY d.id, d.url, d.url_hash, d.total_score, d.status, d.created_at, d.completed_at, d.meta_data;

-- カテゴリ別スコア集計ビュー
CREATE VIEW category_scores AS
SELECT 
    e.diagnosis_id,
    ec.category,
    ec.category as category_name,
    ROUND(AVG(e.score * ec.weight) / AVG(ec.weight)) as weighted_average_score,
    COUNT(e.id) as evaluation_count,
    COUNT(CASE WHEN e.status = 'pass' THEN 1 END) as passed_count
FROM evaluations e
JOIN evaluation_criteria ec ON e.criteria_id = ec.id
WHERE ec.is_active = true
GROUP BY e.diagnosis_id, ec.category;

-- ===========================
-- 関数作成
-- ===========================

-- URL正規化関数
CREATE OR REPLACE FUNCTION normalize_url(input_url TEXT)
RETURNS TEXT AS $$
BEGIN
    -- 基本的なURL正規化（トレイリングスラッシュ削除、小文字化）
    RETURN LOWER(TRIM(TRAILING '/' FROM input_url));
END;
$$ LANGUAGE plpgsql;

-- URLハッシュ生成関数
CREATE OR REPLACE FUNCTION generate_url_hash(input_url TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(normalize_url(input_url), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 総合スコア計算関数
CREATE OR REPLACE FUNCTION calculate_total_score(diagnosis_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_score INTEGER;
BEGIN
    SELECT ROUND(
        SUM(e.score * ec.weight) / SUM(ec.weight)
    )::INTEGER INTO total_score
    FROM evaluations e
    JOIN evaluation_criteria ec ON e.criteria_id = ec.id
    WHERE e.diagnosis_id = diagnosis_uuid AND ec.is_active = true;
    
    RETURN COALESCE(total_score, 0);
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- トリガー作成
-- ===========================

-- updated_at自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにupdated_atトリガーを設定
CREATE TRIGGER update_diagnoses_updated_at
    BEFORE UPDATE ON diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_criteria_updated_at
    BEFORE UPDATE ON evaluation_criteria
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnosis_progress_updated_at
    BEFORE UPDATE ON diagnosis_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 診断完了時のtotal_score自動計算トリガー
CREATE OR REPLACE FUNCTION auto_calculate_total_score()
RETURNS TRIGGER AS $$
BEGIN
    -- ステータスがcompletedまたはpartialに変更された場合
    IF NEW.status IN ('completed', 'partial') AND OLD.status != NEW.status THEN
        NEW.total_score = calculate_total_score(NEW.id);
        NEW.completed_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER diagnoses_auto_score_trigger
    BEFORE UPDATE ON diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_total_score();

-- ===========================
-- 自動削除ジョブ（定期メンテナンス）
-- ===========================

-- 古い診断データ削除関数（30日以上前）
CREATE OR REPLACE FUNCTION cleanup_old_diagnoses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM diagnoses 
        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- パフォーマンス最適化
-- ===========================

-- パーティショニング（将来的なデータ増加に備えて）
-- 診断データを月ごとにパーティショニング（データ量が増えた場合の準備）

-- 分析用関数（利用統計）
CREATE OR REPLACE FUNCTION get_diagnosis_stats(days INTEGER DEFAULT 30)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'total_diagnoses', COUNT(*),
            'completed_diagnoses', COUNT(CASE WHEN status = 'completed' THEN 1 END),
            'average_score', ROUND(AVG(total_score)),
            'unique_domains', COUNT(DISTINCT regexp_replace(url, '^https?://([^/]+).*', '\1')),
            'daily_average', ROUND(COUNT(*)::decimal / days, 1)
        )
        FROM diagnoses
        WHERE created_at >= CURRENT_TIMESTAMP - (days || ' days')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql;