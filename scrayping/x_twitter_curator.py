"""
X（Twitter）情報収集スクリプト
X（Twitter）からシューズ関連の投稿やレビューを収集

必要なライブラリ:
    pip install tweepy python-dotenv

環境変数:
    TWITTER_BEARER_TOKEN: X（Twitter）API v2 Bearer Token
    TWITTER_API_KEY: X（Twitter）API Key（オプション、OAuth1.0a用）
    TWITTER_API_SECRET: X（Twitter）API Secret（OAuth1.0a用）
    TWITTER_ACCESS_TOKEN: X（Twitter）Access Token（OAuth1.0a用）
    TWITTER_ACCESS_TOKEN_SECRET: X（Twitter）Access Token Secret（OAuth1.0a用）

X（Twitter）APIの取得方法:
    1. https://developer.twitter.com/ にアクセス
    2. Developer Portalでアプリを作成
    3. Bearer Tokenを取得（API v2用）
    4. または、OAuth1.0aの認証情報を取得
"""

import os
import json
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path
from dotenv import load_dotenv

try:
    import tweepy
except ImportError:
    print("[!] tweepyライブラリがインストールされていません。pip install tweepy を実行してください")
    tweepy = None

# .envファイルから環境変数を読み込む
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# X（Twitter）API設定
TWITTER_BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN')
TWITTER_API_KEY = os.getenv('TWITTER_API_KEY')
TWITTER_API_SECRET = os.getenv('TWITTER_API_SECRET')
TWITTER_ACCESS_TOKEN = os.getenv('TWITTER_ACCESS_TOKEN')
TWITTER_ACCESS_TOKEN_SECRET = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')

# 検索キーワード
SEARCH_KEYWORDS = [
    'Nike running shoes',
    'Adidas running shoes',
    'ASICS running shoes',
    'running shoe review',
    'ランニングシューズ レビュー',
    'Nike Pegasus',
    'Vaporfly review',
    'Alphafly review',
]

# ハッシュタグ
HASHTAGS = [
    'RunningShoes',
    'RunningShoeReview',
    'ランニングシューズ',
    'NikeRunning',
    'AdidasRunning',
]


class XTwitterCurator:
    """X（Twitter）情報収集クラス"""
    
    def __init__(self, bearer_token: str = None, use_oauth: bool = False):
        """
        Args:
            bearer_token: Bearer Token（API v2用）
            use_oauth: OAuth1.0aを使用するか（Trueの場合、API Key等が必要）
        """
        if not tweepy:
            raise ImportError("tweepyライブラリがインストールされていません")
        
        self.use_oauth = use_oauth
        
        if use_oauth:
            # OAuth1.0a認証
            if not all([TWITTER_API_KEY, TWITTER_API_SECRET, 
                       TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET]):
                raise ValueError("OAuth1.0aを使用する場合、すべての認証情報が必要です")
            
            auth = tweepy.OAuth1UserHandler(
                TWITTER_API_KEY,
                TWITTER_API_SECRET,
                TWITTER_ACCESS_TOKEN,
                TWITTER_ACCESS_TOKEN_SECRET
            )
            self.api = tweepy.API(auth, wait_on_rate_limit=True)
            self.client = None
        else:
            # Bearer Token認証（API v2）
            if not bearer_token:
                bearer_token = TWITTER_BEARER_TOKEN
            
            if not bearer_token:
                raise ValueError("Bearer Tokenが設定されていません")
            
            self.client = tweepy.Client(
                bearer_token=bearer_token,
                wait_on_rate_limit=True
            )
            self.api = None
    
    def search_tweets(self, query: str, max_results: int = 100, 
                     since_days: int = 7) -> List[Dict]:
        """
        ツイートを検索（API v2）
        
        Args:
            query: 検索クエリ
            max_results: 取得する最大ツイート数（10-100）
            since_days: 何日前からのツイートを取得するか
            
        Returns:
            ツイート情報のリスト
        """
        if not self.client:
            print("[!] API v2クライアントが初期化されていません")
            return []
        
        try:
            # 日付範囲を設定
            start_time = datetime.now() - timedelta(days=since_days)
            start_time_str = start_time.strftime('%Y-%m-%dT%H:%M:%SZ')
            
            print(f"[*] 検索クエリ: {query}")
            print(f"[*] 期間: 過去{since_days}日間")
            
            tweets = []
            next_token = None
            
            # ページネーション対応
            while len(tweets) < max_results:
                remaining = max_results - len(tweets)
                current_max = min(remaining, 100)  # API v2の最大値は100
                
                try:
                    response = self.client.search_recent_tweets(
                        query=query,
                        max_results=current_max,
                        start_time=start_time_str,
                        tweet_fields=['created_at', 'author_id', 'public_metrics', 
                                    'lang', 'entities'],
                        user_fields=['username', 'name', 'verified'],
                        expansions=['author_id'],
                        next_token=next_token
                    )
                    
                    if not response.data:
                        break
                    
                    # ユーザー情報をマッピング
                    users = {}
                    if response.includes and 'users' in response.includes:
                        for user in response.includes['users']:
                            users[user.id] = user
                    
                    # ツイート情報を整形
                    for tweet in response.data:
                        author = users.get(tweet.author_id)
                        
                        tweet_data = {
                            'id': tweet.id,
                            'text': tweet.text,
                            'author_id': tweet.author_id,
                            'author_username': author.username if author else None,
                            'author_name': author.name if author else None,
                            'author_verified': author.verified if author else False,
                            'created_at': tweet.created_at.isoformat() if tweet.created_at else None,
                            'like_count': tweet.public_metrics.get('like_count', 0) if tweet.public_metrics else 0,
                            'retweet_count': tweet.public_metrics.get('retweet_count', 0) if tweet.public_metrics else 0,
                            'reply_count': tweet.public_metrics.get('reply_count', 0) if tweet.public_metrics else 0,
                            'quote_count': tweet.public_metrics.get('quote_count', 0) if tweet.public_metrics else 0,
                            'lang': tweet.lang,
                            'query': query,
                            'collected_at': datetime.now().isoformat(),
                        }
                        
                        # エンティティ（ハッシュタグ、メンション、URL）を追加
                        if tweet.entities:
                            tweet_data['hashtags'] = [tag['tag'] for tag in tweet.entities.get('hashtags', [])]
                            tweet_data['mentions'] = [mention['username'] for mention in tweet.entities.get('mentions', [])]
                            tweet_data['urls'] = [url['expanded_url'] for url in tweet.entities.get('urls', [])]
                        
                        tweets.append(tweet_data)
                    
                    # 次のページがあるかチェック
                    if hasattr(response, 'meta') and response.meta.get('next_token'):
                        next_token = response.meta['next_token']
                    else:
                        break
                    
                    # レート制限対策
                    time.sleep(1)
                    
                except tweepy.TooManyRequests:
                    print("[!] レート制限に達しました。待機中...")
                    time.sleep(900)  # 15分待機
                    continue
                except Exception as e:
                    print(f"[!] ツイート検索エラー: {e}")
                    break
            
            print(f"  [✓] {len(tweets)} 件のツイートを取得しました")
            return tweets
            
        except Exception as e:
            print(f"[!] ツイート検索エラー: {e}")
            return []
    
    def search_tweets_legacy(self, query: str, max_results: int = 100) -> List[Dict]:
        """
        ツイートを検索（API v1.1 - レガシー、OAuth1.0a用）
        
        Args:
            query: 検索クエリ
            max_results: 取得する最大ツイート数
            
        Returns:
            ツイート情報のリスト
        """
        if not self.api:
            print("[!] API v1.1クライアントが初期化されていません")
            return []
        
        try:
            print(f"[*] 検索クエリ: {query}")
            
            tweets = []
            for tweet in tweepy.Cursor(
                self.api.search_tweets,
                q=query,
                lang='ja,en',
                result_type='recent',
                tweet_mode='extended'
            ).items(max_results):
                
                tweet_data = {
                    'id': tweet.id,
                    'text': tweet.full_text if hasattr(tweet, 'full_text') else tweet.text,
                    'author_username': tweet.user.screen_name,
                    'author_name': tweet.user.name,
                    'author_verified': tweet.user.verified,
                    'created_at': tweet.created_at.isoformat() if tweet.created_at else None,
                    'like_count': tweet.favorite_count,
                    'retweet_count': tweet.retweet_count,
                    'reply_count': 0,  # API v1.1では取得不可
                    'quote_count': 0,  # API v1.1では取得不可
                    'lang': tweet.lang,
                    'query': query,
                    'collected_at': datetime.now().isoformat(),
                }
                
                # エンティティ情報
                if tweet.entities:
                    tweet_data['hashtags'] = [tag['text'] for tag in tweet.entities.get('hashtags', [])]
                    tweet_data['mentions'] = [mention['screen_name'] for mention in tweet.entities.get('user_mentions', [])]
                    tweet_data['urls'] = [url['expanded_url'] for url in tweet.entities.get('urls', [])]
                
                tweets.append(tweet_data)
            
            print(f"  [✓] {len(tweets)} 件のツイートを取得しました")
            return tweets
            
        except Exception as e:
            print(f"[!] ツイート検索エラー: {e}")
            return []
    
    def search_by_hashtag(self, hashtag: str, max_results: int = 100, 
                         since_days: int = 7) -> List[Dict]:
        """
        ハッシュタグでツイートを検索
        
        Args:
            hashtag: ハッシュタグ（#は不要）
            max_results: 取得する最大ツイート数
            since_days: 何日前からのツイートを取得するか
            
        Returns:
            ツイート情報のリスト
        """
        query = f"#{hashtag}"
        
        if self.client:
            return self.search_tweets(query, max_results, since_days)
        elif self.api:
            return self.search_tweets_legacy(query, max_results)
        else:
            return []
    
    def extract_shoe_info(self, text: str) -> Optional[Dict]:
        """
        ツイートテキストからシューズ情報を抽出
        
        Args:
            text: ツイートのテキスト
            
        Returns:
            シューズ情報の辞書
        """
        # ブランド名を検出
        brands = ['Nike', 'Adidas', 'ASICS', 'Saucony', 'Brooks', 
                  'New Balance', 'Mizuno', 'Hoka', 'On', 'ナイキ', 'アディダス', 'アシックス']
        
        detected_brand = None
        for brand in brands:
            if brand.lower() in text.lower():
                detected_brand = brand
                break
        
        # モデル名を検出
        model_patterns = [
            r'(\w+\s+\d+)',  # "Pegasus 41" のようなパターン
            r'([A-Z][a-z]+\s+[A-Z][a-z]+)',  # "Air Zoom" のようなパターン
            r'(Vaporfly|Alphafly|Ultraboost|Novablast|Endorphin|Ghost|Glycerin)',
        ]
        
        detected_model = None
        for pattern in model_patterns:
            matches = re.findall(pattern, text)
            if matches:
                detected_model = matches[0]
                break
        
        # レビュー関連のキーワードを検出
        review_keywords = ['review', 'レビュー', '感想', '評価', 'おすすめ', 'recommend']
        is_review = any(keyword.lower() in text.lower() for keyword in review_keywords)
        
        if detected_brand or detected_model or is_review:
            return {
                'brand': detected_brand,
                'model': detected_model,
                'is_review': is_review,
                'confidence': 'medium'
            }
        
        return None
    
    def collect_tweets(self, keywords: List[str] = None, hashtags: List[str] = None,
                      max_results_per_query: int = 50, since_days: int = 7) -> List[Dict]:
        """
        複数のキーワードとハッシュタグからツイートを収集
        
        Args:
            keywords: 検索キーワードのリスト
            hashtags: ハッシュタグのリスト
            max_results_per_query: クエリあたりの最大取得数
            since_days: 何日前からのツイートを取得するか
            
        Returns:
            収集したツイートのリスト
        """
        if keywords is None:
            keywords = SEARCH_KEYWORDS
        if hashtags is None:
            hashtags = HASHTAGS
        
        all_tweets = []
        seen_tweet_ids = set()  # 重複チェック用
        
        # キーワードで検索
        print("\n[*] キーワードで検索中...")
        for keyword in keywords:
            if self.client:
                tweets = self.search_tweets(keyword, max_results_per_query, since_days)
            elif self.api:
                tweets = self.search_tweets_legacy(keyword, max_results_per_query)
            else:
                tweets = []
            
            for tweet in tweets:
                tweet_id = tweet.get('id')
                if tweet_id and tweet_id not in seen_tweet_ids:
                    seen_tweet_ids.add(tweet_id)
                    all_tweets.append(tweet)
            
            time.sleep(2)  # リクエスト間隔
        
        # ハッシュタグで検索
        print("\n[*] ハッシュタグで検索中...")
        for hashtag in hashtags:
            tweets = self.search_by_hashtag(hashtag, max_results_per_query, since_days)
            
            for tweet in tweets:
                tweet_id = tweet.get('id')
                if tweet_id and tweet_id not in seen_tweet_ids:
                    seen_tweet_ids.add(tweet_id)
                    all_tweets.append(tweet)
            
            time.sleep(2)
        
        # シューズ情報を抽出
        print("\n[*] シューズ情報を抽出中...")
        for tweet in all_tweets:
            text = tweet.get('text', '')
            shoe_info = self.extract_shoe_info(text)
            tweet['shoe_info'] = shoe_info
        
        return all_tweets
    
    def save_results(self, tweets: List[Dict], filename: str = 'x_twitter_tweets.json'):
        """結果をJSONファイルに保存"""
        output_path = Path(__file__).parent / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(tweets, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n[*] 結果を {output_path} に保存しました ({len(tweets)} 件)")


def main():
    """メイン関数"""
    if not tweepy:
        print("[!] tweepyライブラリがインストールされていません")
        return
    
    # 環境変数の確認
    use_oauth = False
    
    if TWITTER_BEARER_TOKEN:
        print("[*] Bearer Tokenを使用します（API v2）")
    elif all([TWITTER_API_KEY, TWITTER_API_SECRET, 
              TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET]):
        print("[*] OAuth1.0aを使用します（API v1.1）")
        use_oauth = True
    else:
        print("[!] エラー: X（Twitter）APIの認証情報が設定されていません")
        print("\n設定方法:")
        print("1. https://developer.twitter.com/ でアプリを作成")
        print("2. .envファイルに以下を追加:")
        print("   # API v2用（推奨）")
        print("   TWITTER_BEARER_TOKEN=your_bearer_token")
        print("   # または OAuth1.0a用")
        print("   TWITTER_API_KEY=your_api_key")
        print("   TWITTER_API_SECRET=your_api_secret")
        print("   TWITTER_ACCESS_TOKEN=your_access_token")
        print("   TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret")
        return
    
    print("=" * 60)
    print("X（Twitter）情報収集スクリプト")
    print("=" * 60)
    
    try:
        curator = XTwitterCurator(use_oauth=use_oauth)
        
        # ツイートを収集
        tweets = curator.collect_tweets(
            keywords=SEARCH_KEYWORDS[:5],  # テスト用に5つのキーワードのみ
            hashtags=HASHTAGS[:3],  # テスト用に3つのハッシュタグのみ
            max_results_per_query=20,  # テスト用に少なめに
            since_days=7
        )
        
        # 結果を保存
        if tweets:
            curator.save_results(tweets)
            
            # サマリーを表示
            print(f"\n収集結果:")
            print(f"  総ツイート数: {len(tweets)}")
            
            # 言語別の集計
            lang_counts = {}
            for tweet in tweets:
                lang = tweet.get('lang', 'unknown')
                lang_counts[lang] = lang_counts.get(lang, 0) + 1
            
            print(f"\n言語別:")
            for lang, count in lang_counts.items():
                print(f"  {lang}: {count} 件")
            
            # シューズ情報が抽出できたものの数
            shoe_info_count = sum(1 for t in tweets if t.get('shoe_info'))
            review_count = sum(1 for t in tweets if t.get('shoe_info', {}).get('is_review'))
            
            print(f"\nシューズ情報抽出成功: {shoe_info_count} / {len(tweets)}")
            print(f"レビュー関連ツイート: {review_count} 件")
            
            # エンゲージメントの高いツイート（上位5件）
            sorted_tweets = sorted(
                tweets,
                key=lambda x: x.get('like_count', 0) + x.get('retweet_count', 0),
                reverse=True
            )
            
            print(f"\nエンゲージメントの高いツイート（上位5件）:")
            for idx, tweet in enumerate(sorted_tweets[:5], 1):
                print(f"\n  {idx}. @{tweet.get('author_username', 'N/A')}")
                print(f"     いいね: {tweet.get('like_count', 0)}, RT: {tweet.get('retweet_count', 0)}")
                text = tweet.get('text', '')
                print(f"     内容: {text[:100]}..." if len(text) > 100 else f"     内容: {text}")
                if tweet.get('shoe_info'):
                    shoe_info = tweet['shoe_info']
                    if shoe_info.get('brand'):
                        print(f"     ブランド: {shoe_info['brand']}")
                    if shoe_info.get('model'):
                        print(f"     モデル: {shoe_info['model']}")
        else:
            print("\n[!] ツイートが収集できませんでした")
    
    except Exception as e:
        print(f"\n[!] エラー: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

