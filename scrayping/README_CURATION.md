# 情報キュレーション方法の使用方法

このディレクトリには、シューズレビューサイト向けの複数の情報キュレーション方法が実装されています。

## 既存のキュレーション方法

### 1. Web記事スクレイピング (`crawl.py`)
- Google検索APIでレビュー記事を検索
- LLMで構造化して情報を抽出

### 2. YouTube動画要約 (`youtube_summarizer.py`)
- YouTube動画から音声をダウンロード
- Whisperで文字起こし
- Geminiで要約生成

## 新しく追加されたキュレーション方法

### 1. Redditレビュー収集 (`reddit_curator.py`)

**概要**: Redditのコミュニティから実際のユーザーレビューを収集

**セットアップ**:
```bash
pip install praw python-dotenv
```

**環境変数の設定**:
```env
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=shoe-review-bot/1.0
```

**使用方法**:
```bash
python scrayping/reddit_curator.py
```

**Reddit APIの取得方法**:
1. https://www.reddit.com/prefs/apps にアクセス
2. "create app" または "create another app" をクリック
3. アプリ情報を入力:
   - **name**: アプリ名（例: "shoe-review-bot"）
   - **app type**: **"script"** を選択（推奨）
   - **description**: 説明（任意）
   - **about url**: 空白でOK
   - **redirect uri**: **`http://localhost`** を入力（必須フィールドの場合）
4. "create app" をクリック
5. 作成されたアプリの情報から以下を取得:
   - **Client ID**: アプリ名の下に表示される文字列（例: "abc123def456"）
   - **Secret**: "secret" の横に表示される文字列

**重要**: 
- アプリタイプは **"script"** を選択してください
- リダイレクトURIが必須フィールドの場合は、**`http://localhost`** を入力してください（実際には使用されません）
- 他の選択肢: `http://localhost:8080` や `urn:ietf:wg:oauth:2.0:oob` も使用可能です

**機能**:
- 複数のサブレディットから投稿を検索
- コメントスレッドも含めて収集
- シューズ情報の自動抽出
- JSON形式で結果を保存

---

### 2. 価格追跡システム (`price_tracker.py`)

**概要**: 複数のECサイトで価格変動を追跡し、最安値情報を提供

**セットアップ**:
```bash
pip install requests beautifulsoup4 python-dotenv
```

**使用方法**:
```bash
python scrayping/price_tracker.py
```

**設定**:
`price_tracker.py` の `MONITORED_SHOES` リストに監視対象のシューズを追加:
```python
MONITORED_SHOES = [
    {
        'brand': 'Nike',
        'model': 'Pegasus 41',
        'search_urls': [
            'https://www.nike.com/jp/t/air-zoom-pegasus-41-running-shoes',
        ]
    },
]
```

**機能**:
- 定期的な価格チェック
- 価格履歴の保存
- 価格変動の検出
- 最安値の特定

**注意事項**:
- 各ECサイトのHTML構造に応じて価格抽出ロジックを調整する必要があります
- 過度なリクエストは避け、適切な間隔を設けてください

---

### 3. 新製品リリース情報収集 (`release_tracker.py`)

**概要**: ブランド公式サイトやニュースサイトから新製品情報を自動収集

**セットアップ**:
```bash
pip install feedparser requests beautifulsoup4 python-dotenv
```

**環境変数の設定**（オプション）:
```env
GOOGLE_SEARCH_API_KEY=your_api_key
GOOGLE_SEARCH_ENGINE_ID=your_engine_id
```

**使用方法**:
```bash
python scrayping/release_tracker.py
```

**設定**:
`release_tracker.py` の `RSS_FEEDS` と `BRAND_RELEASE_PAGES` リストを編集して監視対象を追加

**機能**:
- RSSフィードの監視
- ブランド公式サイトのスクレイピング
- Google検索による新製品情報の収集
- シューズ情報の自動抽出

---

### 4. X（Twitter）情報収集 (`x_twitter_curator.py`)

**概要**: X（Twitter）からシューズ関連の投稿やレビューを収集

**セットアップ**:
```bash
pip install tweepy python-dotenv
```

**環境変数の設定**:
```env
# API v2用（推奨）
TWITTER_BEARER_TOKEN=your_bearer_token

# または OAuth1.0a用
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

**使用方法**:
```bash
python scrayping/x_twitter_curator.py
```

**X（Twitter）APIの取得方法**:
1. https://developer.twitter.com/ にアクセス
2. Developer Portalでアプリを作成
3. Bearer Tokenを取得（API v2用、推奨）
4. または、OAuth1.0aの認証情報を取得

**機能**:
- キーワード検索によるツイート収集
- ハッシュタグ検索によるツイート収集
- エンゲージメント（いいね、RT数）の取得
- シューズ情報の自動抽出
- レビュー関連ツイートの識別
- ページネーション対応

**設定**:
`x_twitter_curator.py` の `SEARCH_KEYWORDS` と `HASHTAGS` リストを編集して検索対象を追加

**注意事項**:
- X（Twitter）APIの利用規約を遵守してください
- レート制限があるため、`wait_on_rate_limit=True` が設定されています
- 無料プランでは取得件数に制限があります

---

## 統合使用方法

すべてのキュレーション方法を統合して実行するスクリプト (`integrate_curation.py`) が用意されています:

```bash
# RedditとX（Twitter）を実行（デフォルト）
python scrayping/integrate_curation.py

# 特定の方法のみ実行
python scrayping/integrate_curation.py --methods reddit,x_twitter

# 他の方法も含める
python scrayping/integrate_curation.py --methods reddit,x_twitter,price,release
```

**利用可能なメソッド**:
- `reddit`: Redditレビュー収集（推奨）
- `x_twitter`: X（Twitter）情報収集（推奨）
- `price`: 価格追跡
- `release`: 新製品リリース情報収集

**推奨設定**:
RedditとX（Twitter）の組み合わせが最も効果的です。両方とも実際のユーザーの生の声を収集でき、リアルタイムな情報も取得できます。

---

## 定期実行の設定

### Windows (Task Scheduler)
1. タスクスケジューラを開く
2. 基本タスクの作成
3. トリガーを「毎日」または「週次」に設定
4. 操作でPythonスクリプトを実行するアクションを追加

### Linux/Mac (cron)
```bash
# 毎日午前2時に実行
0 2 * * * /usr/bin/python3 /path/to/scrayping/reddit_curator.py

# 毎週月曜日の午前3時に実行
0 3 * * 1 /usr/bin/python3 /path/to/scrayping/price_tracker.py
```

---

## データの統合

収集したデータは、既存の `consolidate_json_to_csv.py` と同様の方法で統合できます。

各キュレーション方法の出力形式を統一し、共通のデータベースやCSVファイルに保存することを推奨します。

---

## 注意事項

1. **API制限**: 各APIにはレート制限があります。適切な間隔を設けてリクエストしてください。

2. **利用規約**: 各サイトの利用規約を確認し、遵守してください。

3. **エラーハンドリング**: ネットワークエラーやAPIエラーに対応する適切なエラーハンドリングを実装してください。

4. **データの保存**: 収集したデータは定期的にバックアップを取ることを推奨します。

5. **プライバシー**: 個人情報が含まれる可能性があるデータは適切に処理してください。

---

## 非推奨のキュレーション方法

### ECサイトレビュー収集 (`ec_review_curator.py`)
**注意**: ECサイトのスクレイピングは利用規約に違反する可能性が高いため、現在は非推奨です。
代わりに、RedditやX（Twitter）からの情報収集を推奨します。

---

## 今後の拡張

以下のキュレーション方法も実装可能です（`curation_methods.md` を参照）:

- 多言語レビューの翻訳統合
- 時系列データ分析
- 競合比較の自動生成
- 画像解析による特徴抽出
- Instagram情報収集

