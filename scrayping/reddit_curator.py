"""
Redditレビュー収集スクリプト
Redditのr/RunningShoeGeeksなどのコミュニティから実際のユーザーレビューを収集

必要なライブラリ:
    pip install praw python-dotenv

環境変数:
    REDDIT_CLIENT_ID: Reddit API Client ID
    REDDIT_CLIENT_SECRET: Reddit API Client Secret
    REDDIT_USER_AGENT: Reddit API User Agent (例: "shoe-review-bot/1.0")
"""

import os
import json
import time
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

try:
    import praw
except ImportError:
    print("[!] prawライブラリがインストールされていません。pip install praw を実行してください")
    praw = None

# Reddit API設定
REDDIT_CLIENT_ID = os.getenv('REDDIT_CLIENT_ID')
REDDIT_CLIENT_SECRET = os.getenv('REDDIT_CLIENT_SECRET')
REDDIT_USER_AGENT = os.getenv('REDDIT_USER_AGENT', 'shoe-review-bot/1.0')

# 監視対象のサブレディット
TARGET_SUBREDDITS = [
    'RunningShoeGeeks',
    'running',
    'trailrunning',
    'AdvancedRunning',
]

# 検索キーワード（ブランド名やモデル名）
SEARCH_KEYWORDS = [
    'Nike', 'Adidas', 'ASICS', 'Saucony', 'Brooks', 
    'New Balance', 'Mizuno', 'Hoka', 'On',
    'Pegasus', 'Vaporfly', 'Alphafly', 'Ultraboost',
    'Novablast', 'Endorphin', 'Ghost', 'Glycerin',
]


class RedditCurator:
    """Redditからレビューを収集するクラス"""
    
    def __init__(self, client_id: str, client_secret: str, user_agent: str):
        """
        Args:
            client_id: Reddit API Client ID
            client_secret: Reddit API Client Secret
            user_agent: Reddit API User Agent
        """
        if not praw:
            raise ImportError("prawライブラリがインストールされていません")
        
        self.reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent=user_agent
        )
        
    def search_posts(self, subreddit_name: str, query: str, limit: int = 25, sort: str = 'relevance') -> List[Dict]:
        """
        サブレディット内で投稿を検索
        
        Args:
            subreddit_name: サブレディット名
            query: 検索クエリ
            limit: 取得件数
            sort: ソート方法 ('relevance', 'hot', 'top', 'new')
            
        Returns:
            投稿情報のリスト
        """
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            posts = []
            
            # 検索を実行
            search_results = subreddit.search(query, sort=sort, limit=limit, time_filter='all')
            
            for post in search_results:
                # スコアが低い投稿はスキップ（スパム対策）
                if post.score < 2:
                    continue
                
                post_data = {
                    'id': post.id,
                    'title': post.title,
                    'author': str(post.author) if post.author else '[deleted]',
                    'score': post.score,
                    'upvote_ratio': post.upvote_ratio,
                    'num_comments': post.num_comments,
                    'created_utc': datetime.fromtimestamp(post.created_utc).isoformat(),
                    'url': post.url,
                    'permalink': f"https://reddit.com{post.permalink}",
                    'selftext': post.selftext[:5000] if post.selftext else '',  # 長すぎる場合は切り詰め
                    'subreddit': subreddit_name,
                    'query': query,
                }
                posts.append(post_data)
            
            return posts
            
        except Exception as e:
            print(f"[!] サブレディット {subreddit_name} の検索エラー: {e}")
            return []
    
    def get_post_comments(self, post_id: str, limit: int = 50) -> List[Dict]:
        """
        投稿のコメントを取得
        
        Args:
            post_id: Reddit投稿ID
            limit: 取得件数
            
        Returns:
            コメント情報のリスト
        """
        try:
            submission = self.reddit.submission(id=post_id)
            submission.comments.replace_more(limit=0)  # "More comments"を展開
            
            comments = []
            for comment in submission.comments.list()[:limit]:
                # 削除されたコメントはスキップ
                if comment.body == '[deleted]' or comment.body == '[removed]':
                    continue
                
                # スコアが低いコメントはスキップ
                if comment.score < 1:
                    continue
                
                comment_data = {
                    'id': comment.id,
                    'author': str(comment.author) if comment.author else '[deleted]',
                    'score': comment.score,
                    'body': comment.body[:2000] if comment.body else '',  # 長すぎる場合は切り詰め
                    'created_utc': datetime.fromtimestamp(comment.created_utc).isoformat(),
                    'is_submitter': comment.is_submitter,
                }
                comments.append(comment_data)
            
            return comments
            
        except Exception as e:
            print(f"[!] コメント取得エラー (post_id: {post_id}): {e}")
            return []
    
    def extract_shoe_info(self, text: str) -> Optional[Dict]:
        """
        テキストからシューズ情報を抽出（簡易版）
        
        Args:
            text: 抽出対象のテキスト
            
        Returns:
            シューズ情報の辞書（ブランド名、モデル名など）
        """
        # ブランド名を検出
        brands = ['Nike', 'Adidas', 'ASICS', 'Saucony', 'Brooks', 
                  'New Balance', 'Mizuno', 'Hoka', 'On']
        
        detected_brand = None
        for brand in brands:
            if brand.lower() in text.lower():
                detected_brand = brand
                break
        
        # モデル名を検出（簡易的な方法）
        # 実際にはLLMを使用してより正確に抽出することを推奨
        models = ['Pegasus', 'Vaporfly', 'Alphafly', 'Ultraboost',
                  'Novablast', 'Endorphin', 'Ghost', 'Glycerin']
        
        detected_model = None
        for model in models:
            if model.lower() in text.lower():
                detected_model = model
                break
        
        if detected_brand:
            return {
                'brand': detected_brand,
                'model': detected_model,
                'confidence': 'medium'  # 簡易抽出のため信頼度は中程度
            }
        
        return None
    
    def collect_reviews(self, subreddits: List[str] = None, keywords: List[str] = None, 
                       posts_per_keyword: int = 10) -> List[Dict]:
        """
        複数のサブレディットとキーワードからレビューを収集
        
        Args:
            subreddits: 対象サブレディットのリスト（Noneの場合はデフォルト）
            keywords: 検索キーワードのリスト（Noneの場合はデフォルト）
            posts_per_keyword: キーワードあたりの取得投稿数
            
        Returns:
            収集したレビューのリスト
        """
        if subreddits is None:
            subreddits = TARGET_SUBREDDITS
        if keywords is None:
            keywords = SEARCH_KEYWORDS
        
        all_reviews = []
        
        for subreddit in subreddits:
            print(f"\n[*] サブレディット: r/{subreddit}")
            
            for keyword in keywords:
                print(f"  [*] キーワード検索: {keyword}")
                
                # 投稿を検索
                posts = self.search_posts(subreddit, keyword, limit=posts_per_keyword)
                
                for post in posts:
                    # コメントを取得
                    comments = self.get_post_comments(post['id'], limit=20)
                    
                    # シューズ情報を抽出
                    full_text = f"{post['title']} {post['selftext']}"
                    shoe_info = self.extract_shoe_info(full_text)
                    
                    review_data = {
                        'source': 'reddit',
                        'subreddit': subreddit,
                        'keyword': keyword,
                        'post': post,
                        'comments': comments,
                        'shoe_info': shoe_info,
                        'collected_at': datetime.now().isoformat(),
                    }
                    
                    all_reviews.append(review_data)
                
                # API制限対策の待機
                time.sleep(1)
            
            # サブレディット間の待機
            time.sleep(2)
        
        return all_reviews
    
    def save_results(self, reviews: List[Dict], filename: str = 'reddit_reviews.json'):
        """結果をJSONファイルに保存"""
        output_path = Path(__file__).parent / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(reviews, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n[*] 結果を {output_path} に保存しました ({len(reviews)} 件)")


def main():
    """メイン関数"""
    # 環境変数の確認
    if not REDDIT_CLIENT_ID or not REDDIT_CLIENT_SECRET:
        print("[!] エラー: REDDIT_CLIENT_ID と REDDIT_CLIENT_SECRET を設定してください")
        print("\n設定方法:")
        print("1. https://www.reddit.com/prefs/apps でアプリを作成")
        print("2. .envファイルに以下を追加:")
        print("   REDDIT_CLIENT_ID=your_client_id")
        print("   REDDIT_CLIENT_SECRET=your_client_secret")
        print("   REDDIT_USER_AGENT=shoe-review-bot/1.0")
        return
    
    # RedditCuratorのインスタンスを作成
    curator = RedditCurator(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT
    )
    
    print("=" * 60)
    print("Redditレビュー収集スクリプト")
    print("=" * 60)
    
    # レビューを収集
    reviews = curator.collect_reviews(
        subreddits=TARGET_SUBREDDITS[:2],  # テスト用に2つのサブレディットのみ
        keywords=SEARCH_KEYWORDS[:5],  # テスト用に5つのキーワードのみ
        posts_per_keyword=5  # テスト用に少なめに
    )
    
    # 結果を保存
    if reviews:
        curator.save_results(reviews)
        
        # サマリーを表示
        print(f"\n収集結果:")
        print(f"  総レビュー数: {len(reviews)}")
        
        # サブレディット別の集計
        subreddit_counts = {}
        for review in reviews:
            sub = review['subreddit']
            subreddit_counts[sub] = subreddit_counts.get(sub, 0) + 1
        
        print(f"\nサブレディット別:")
        for sub, count in subreddit_counts.items():
            print(f"  r/{sub}: {count} 件")
        
        # シューズ情報が抽出できたものの数
        shoe_info_count = sum(1 for r in reviews if r.get('shoe_info'))
        print(f"\nシューズ情報抽出成功: {shoe_info_count} / {len(reviews)}")
    else:
        print("\n[!] レビューが収集できませんでした")


if __name__ == "__main__":
    main()



