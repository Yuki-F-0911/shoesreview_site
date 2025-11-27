# Reddit API セットアップガイド

このガイドでは、Reddit APIを使用するためのアプリケーション作成手順を詳しく説明します。

## アプリケーションタイプの選択

Reddit APIでは、以下の3つのアプリケーションタイプから選択できます：

1. **script**（推奨） - サーバーサイドスクリプト用
2. **web app** - Webアプリケーション用
3. **installed app** - デスクトップ/モバイルアプリ用

**このプロジェクトでは "script" タイプを使用します。**

## セットアップ手順

### ステップ1: Redditアカウントの準備

1. Redditアカウントにログインしていることを確認
2. アカウントにメールアドレスが登録されていることを確認（推奨）

### ステップ2: アプリケーションの作成

1. https://www.reddit.com/prefs/apps にアクセス
2. ページ下部の "create app" または "create another app" をクリック

### ステップ3: アプリケーション情報の入力

以下の情報を入力します：

| 項目 | 入力内容 | 説明 |
|------|---------|------|
| **name** | `shoe-review-bot`（任意の名前） | アプリケーションの名前 |
| **app type** | **`script`** | **必ず "script" を選択** |
| **description** | `シューズレビュー収集用ボット`（任意） | アプリの説明 |
| **about url** | 空白 | 空白でOK |
| **redirect uri** | **`http://localhost`** | **必須フィールドの場合は `http://localhost` を入力**（実際には使用されません） |

### ステップ4: アプリケーションの作成

1. すべての情報を入力したら "create app" をクリック
2. アプリケーションが作成されると、アプリ一覧に表示されます

### ステップ5: 認証情報の取得

作成されたアプリケーションの情報から、以下の2つを取得します：

1. **Client ID**
   - アプリ名の下に表示される文字列
   - 例: `abc123def456ghi789`
   - これは **公開情報** です

2. **Secret**
   - "secret" というラベルの横に表示される文字列
   - 例: `xyz789abc123def456`
   - これは **機密情報** です。他人に共有しないでください

### ステップ6: 環境変数の設定

プロジェクトルートの `.env` ファイルに以下を追加します：

```env
REDDIT_CLIENT_ID=abc123def456ghi789
REDDIT_CLIENT_SECRET=xyz789abc123def456
REDDIT_USER_AGENT=shoe-review-bot/1.0
```

**注意**: 
- `REDDIT_USER_AGENT` は、アプリ名とバージョンを組み合わせた文字列にしてください
- 例: `shoe-review-bot/1.0`、`my-app/0.1` など

## よくある質問

### Q: リダイレクトURIは何を入力すればいいですか？

**A: scriptタイプでも必須フィールドの場合は、以下のいずれかを入力してください：**

- **`http://localhost`** （推奨・最もシンプル）
- **`http://localhost:8080`**
- **`urn:ietf:wg:oauth:2.0:oob`** （デスクトップアプリ用）

**重要**: scriptタイプでは、このリダイレクトURIは実際には使用されません。フォームの必須フィールドを満たすために入力するだけです。

もし "web app" や "installed app" を選択した場合も、上記と同じ値を使用できます。

### Q: アプリタイプを間違えて選択してしまいました

**A: アプリを削除して再作成するか、新しいアプリを作成してください。**

Redditでは、既存のアプリのタイプを変更することはできません。

### Q: Client IDとSecretが見つかりません

**A: アプリ一覧でアプリ名をクリックすると、詳細情報が表示されます。**

または、アプリ一覧でアプリ名の下に小さく表示されている文字列がClient IDです。
"secret" というラベルの横にある "reveal" をクリックすると、Secretが表示されます。

### Q: レート制限について

**A: Reddit APIにはレート制限があります。**

- 認証なし: 1分間に60リクエスト
- 認証あり（OAuth2）: 1分間に60リクエスト（より安定）

このスクリプトでは、適切な間隔を設けてリクエストを送信するため、通常は問題ありません。

### Q: エラーが発生しました

**A: 以下を確認してください：**

1. Client IDとSecretが正しく設定されているか
2. User Agentが設定されているか（必須）
3. アプリタイプが "script" になっているか
4. インターネット接続が正常か

## トラブルシューティング

### エラー: "invalid_client"

- Client IDまたはSecretが間違っています
- `.env` ファイルの値が正しいか確認してください

### エラー: "User-Agent required"

- `REDDIT_USER_AGENT` 環境変数が設定されていません
- `.env` ファイルに追加してください

### エラー: "403 Forbidden"

- アプリタイプが "script" になっているか確認してください
- User Agentが設定されているか確認してください

## 参考リンク

- [Reddit API Documentation](https://www.reddit.com/dev/api/)
- [PRAW Documentation](https://praw.readthedocs.io/)
- [Reddit API OAuth2 Guide](https://github.com/reddit-archive/reddit/wiki/OAuth2)

