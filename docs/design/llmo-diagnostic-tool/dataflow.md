# LLMO診断ツール データフロー図

## 1. システム全体のデータフロー

```mermaid
flowchart TB
    subgraph "Frontend Layer"
        UI[ユーザーインターフェース]
        URL[URL入力フォーム]
        DASH[ダッシュボード]
        REPORT[レポート表示]
    end
    
    subgraph "API Gateway"
        GW[API Gateway]
        AUTH[認証・レート制限]
        ROUTE[ルーティング]
    end
    
    subgraph "Processing Layer"
        CORE[Core Service<br/>オーケストレーター]
        L1[Layer 1 Service<br/>信頼性評価]
        L2[Layer 2 Service<br/>構造評価]
        L3[Layer 3 Service<br/>技術評価]
        QUEUE[Job Queue<br/>Bull/Redis]
    end
    
    subgraph "Data Layer"
        CACHE[(Redis Cache<br/>24時間)]
        DB[(PostgreSQL<br/>診断履歴)]
        S3[S3/MinIO<br/>レポート保存]
    end
    
    subgraph "External APIs"
        KG[Google Knowledge<br/>Graph API]
        PC[Plagiarism<br/>Checker API]
        PSI[PageSpeed<br/>Insights API]
        AHREFS[Ahrefs API]
    end
    
    UI --> URL
    URL --> GW
    GW --> AUTH
    AUTH --> ROUTE
    ROUTE --> CACHE
    CACHE -->|キャッシュヒット| GW
    CACHE -->|キャッシュミス| CORE
    CORE --> QUEUE
    QUEUE --> L1
    QUEUE --> L2
    QUEUE --> L3
    L1 --> KG
    L1 --> PC
    L1 --> AHREFS
    L3 --> PSI
    L1 --> DB
    L2 --> DB
    L3 --> DB
    CORE --> DB
    CORE --> S3
    DB --> DASH
    S3 --> REPORT
```

## 2. URL診断処理フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant G as API Gateway
    participant C as Cache(Redis)
    participant O as Core Service
    participant Q as Job Queue
    participant L1 as Layer 1 Service
    participant L2 as Layer 2 Service
    participant L3 as Layer 3 Service
    participant DB as PostgreSQL
    
    U->>F: URL入力
    F->>G: POST /api/diagnose
    G->>G: バリデーション
    G->>C: キャッシュ確認
    
    alt キャッシュヒット
        C-->>G: 診断結果返却
        G-->>F: キャッシュ済み結果
    else キャッシュミス
        G->>O: 新規診断開始
        O->>Q: ジョブ登録
        O-->>G: ジョブID返却
        G-->>F: 診断開始通知
        
        par 並列処理
            Q->>L1: 信頼性評価タスク
            L1->>L1: E-E-A-T分析
            L1->>L1: エンティティ検証
            L1->>L1: コンテンツ品質評価
            L1-->>DB: 結果保存
        and
            Q->>L2: 構造評価タスク
            L2->>L2: DOM解析
            L2->>L2: セマンティック評価
            L2->>L2: 可読性分析
            L2-->>DB: 結果保存
        and
            Q->>L3: 技術評価タスク
            L3->>L3: Schema.org検証
            L3->>L3: Core Web Vitals
            L3->>L3: クロール性確認
            L3-->>DB: 結果保存
        end
        
        O->>DB: 全結果取得
        O->>O: スコア集計・加重計算
        O->>O: 改善提案生成
        O->>C: キャッシュ保存(TTL:24h)
        O->>DB: 最終結果保存
        O-->>F: WebSocket経由で結果送信
    end
    
    F-->>U: 診断結果表示
```

## 3. 3層評価処理フロー

```mermaid
flowchart LR
    subgraph "Layer 1: 信頼性 (50%)"
        E1[E-E-A-T評価]
        E2[エンティティ検証]
        E3[コンテンツ品質]
        E1 --> S1[Layer1スコア]
        E2 --> S1
        E3 --> S1
    end
    
    subgraph "Layer 2: 構造 (30%)"
        F1[AIフレンドリー]
        F2[文書構造]
        F3[言語明確性]
        F1 --> S2[Layer2スコア]
        F2 --> S2
        F3 --> S2
    end
    
    subgraph "Layer 3: 技術 (20%)"
        T1[構造化データ]
        T2[技術的健全性]
        T3[llms.txt]
        T1 --> S3[Layer3スコア]
        T2 --> S3
        T3 --> S3
    end
    
    S1 --> |×0.5| FINAL[最終スコア]
    S2 --> |×0.3| FINAL
    S3 --> |×0.2| FINAL
    FINAL --> SUGGEST[改善提案生成]
    SUGGEST --> PRIORITY[優先順位付け]
```

## 4. キャッシュ戦略フロー

```mermaid
stateDiagram-v2
    [*] --> URLReceived: URL入力
    URLReceived --> CheckCache: キャッシュ確認
    
    CheckCache --> CacheHit: キャッシュ存在
    CheckCache --> CacheMiss: キャッシュなし
    
    CacheHit --> CheckTTL: TTL確認
    CheckTTL --> Valid: 24時間以内
    CheckTTL --> Expired: 24時間超過
    
    Valid --> ReturnCache: キャッシュ返却
    Expired --> Invalidate: キャッシュ無効化
    Invalidate --> CacheMiss
    
    CacheMiss --> StartDiagnosis: 診断開始
    StartDiagnosis --> Processing: 処理中
    Processing --> StoreCache: キャッシュ保存
    StoreCache --> ReturnResult: 結果返却
    
    ReturnCache --> [*]
    ReturnResult --> [*]
```

## 5. エラー処理フロー

```mermaid
flowchart TD
    START[診断開始] --> VALIDATE{URL検証}
    VALIDATE -->|無効| ERR1[エラー: 無効なURL]
    VALIDATE -->|有効| ACCESS{サイトアクセス}
    
    ACCESS -->|失敗| RETRY{リトライ}
    RETRY -->|3回失敗| ERR2[エラー: アクセス不可]
    RETRY -->|成功| PROCESS
    
    ACCESS -->|成功| PROCESS[診断処理]
    PROCESS --> TIMEOUT{タイムアウト確認}
    
    TIMEOUT -->|60秒超過| PARTIAL[部分結果生成]
    TIMEOUT -->|正常| COMPLETE[完全結果]
    
    PROCESS --> APIERR{外部APIエラー}
    APIERR -->|エラー| FALLBACK[フォールバック処理]
    APIERR -->|正常| COMPLETE
    
    ERR1 --> SUGGEST1[URL形式の例を表示]
    ERR2 --> SUGGEST2[再試行オプション提供]
    PARTIAL --> REPORT[レポート生成]
    FALLBACK --> REPORT
    COMPLETE --> REPORT
    
    REPORT --> END[診断完了]
```

## 6. リアルタイム進捗通知フロー

```mermaid
sequenceDiagram
    participant F as フロントエンド
    participant W as WebSocket Server
    participant C as Core Service
    participant L as Layer Services
    
    F->>W: WebSocket接続確立
    W-->>F: 接続確認
    
    F->>C: 診断開始
    C->>W: 進捗: 0% (開始)
    W-->>F: 進捗更新
    
    C->>L: Layer1評価開始
    L-->>C: Layer1進捗: 25%
    C->>W: 進捗: 25%
    W-->>F: 進捗更新
    
    L-->>C: Layer1完了
    C->>W: 進捗: 50%
    W-->>F: 進捗更新
    
    C->>L: Layer2評価開始
    L-->>C: Layer2完了
    C->>W: 進捗: 70%
    W-->>F: 進捗更新
    
    C->>L: Layer3評価開始
    L-->>C: Layer3完了
    C->>W: 進捗: 90%
    W-->>F: 進捗更新
    
    C->>C: スコア集計
    C->>W: 進捗: 100% (完了)
    W-->>F: 診断結果送信
    
    F->>W: WebSocket切断
```

## 7. 改善提案生成フロー

```mermaid
flowchart TB
    SCORES[評価スコア集計] --> ANALYZE[未達項目分析]
    
    ANALYZE --> L1CHECK{Layer1未達?}
    L1CHECK -->|Yes| CRITICAL[最優先提案]
    L1CHECK -->|No| L2CHECK{Layer2未達?}
    
    L2CHECK -->|Yes| HIGH[高優先度提案]
    L2CHECK -->|No| L3CHECK{Layer3未達?}
    
    L3CHECK -->|Yes| MEDIUM[中優先度提案]
    L3CHECK -->|No| LOW[低優先度提案]
    
    CRITICAL --> TEMPLATE1[E-E-A-Tテンプレート]
    HIGH --> TEMPLATE2[構造改善テンプレート]
    MEDIUM --> TEMPLATE3[技術改善テンプレート]
    LOW --> TEMPLATE4[最適化テンプレート]
    
    TEMPLATE1 --> CUSTOMIZE[カスタマイズ処理]
    TEMPLATE2 --> CUSTOMIZE
    TEMPLATE3 --> CUSTOMIZE
    TEMPLATE4 --> CUSTOMIZE
    
    CUSTOMIZE --> SORT[優先順位ソート]
    SORT --> OUTPUT[改善提案リスト出力]
```

## データフローの特徴

### 並列処理
- 3層の評価を独立して並列実行
- 外部API呼び出しの非同期処理
- ジョブキューによる負荷分散

### キャッシュ戦略
- 24時間のTTLで診断結果をキャッシュ
- URL正規化によるキャッシュヒット率向上
- 段階的なキャッシュ無効化

### エラーハンドリング
- グレースフルデグラデーション
- 部分的な結果返却
- フォールバック処理

### リアルタイム性
- WebSocketによる進捗通知
- Server-Sent Events (SSE) のフォールバック
- 非同期処理の可視化