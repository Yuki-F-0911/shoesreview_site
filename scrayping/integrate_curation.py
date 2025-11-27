"""
統合キュレーションスクリプト
複数のキュレーション方法を統合して実行

使用方法:
    python scrayping/integrate_curation.py [--methods reddit,x_twitter]
"""

import os
import sys
import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from scrayping.reddit_curator import RedditCurator
    REDDIT_AVAILABLE = True
except ImportError:
    REDDIT_AVAILABLE = False
    print("[!] reddit_curator.py が利用できません")

try:
    from scrayping.price_tracker import PriceTracker
    PRICE_TRACKER_AVAILABLE = True
except ImportError:
    PRICE_TRACKER_AVAILABLE = False
    print("[!] price_tracker.py が利用できません")

try:
    from scrayping.release_tracker import ReleaseTracker
    RELEASE_TRACKER_AVAILABLE = True
except ImportError:
    RELEASE_TRACKER_AVAILABLE = False
    print("[!] release_tracker.py が利用できません")

try:
    from scrayping.x_twitter_curator import XTwitterCurator
    X_TWITTER_CURATOR_AVAILABLE = True
except ImportError:
    X_TWITTER_CURATOR_AVAILABLE = False
    print("[!] x_twitter_curator.py が利用できません")


class IntegratedCurator:
    """統合キュレータークラス"""
    
    def __init__(self):
        self.results = {
            'reddit': [],
            'x_twitter': [],
            'price': [],
            'release': [],
            'collected_at': datetime.now().isoformat(),
        }
    
    def collect_reddit_reviews(self) -> List[Dict]:
        """Redditレビューを収集"""
        if not REDDIT_AVAILABLE:
            print("[!] Redditキュレーターが利用できません")
            return []
        
        try:
            from dotenv import load_dotenv
            import os
            
            env_path = Path(__file__).parent.parent / '.env'
            load_dotenv(env_path)
            
            client_id = os.getenv('REDDIT_CLIENT_ID')
            client_secret = os.getenv('REDDIT_CLIENT_SECRET')
            user_agent = os.getenv('REDDIT_USER_AGENT', 'shoe-review-bot/1.0')
            
            if not client_id or not client_secret:
                print("[!] Reddit APIの設定がありません")
                return []
            
            print("\n" + "=" * 60)
            print("Redditレビュー収集中...")
            print("=" * 60)
            
            curator = RedditCurator(client_id, client_secret, user_agent)
            reviews = curator.collect_reviews(
                subreddits=['RunningShoeGeeks', 'running'],
                keywords=['Nike', 'Adidas', 'ASICS'],
                posts_per_keyword=5
            )
            
            return reviews
            
        except Exception as e:
            print(f"[!] Redditレビュー収集エラー: {e}")
            return []
    
    def track_prices(self) -> List[Dict]:
        """価格を追跡"""
        if not PRICE_TRACKER_AVAILABLE:
            print("[!] 価格追跡システムが利用できません")
            return []
        
        try:
            print("\n" + "=" * 60)
            print("価格追跡中...")
            print("=" * 60)
            
            tracker = PriceTracker()
            
            # 監視対象のシューズ（簡易版）
            monitored_shoes = [
                {
                    'brand': 'Nike',
                    'model': 'Pegasus 41',
                    'search_urls': [
                        'https://www.nike.com/jp/t/air-zoom-pegasus-41-running-shoes',
                    ]
                },
            ]
            
            results = tracker.track_all_shoes(monitored_shoes)
            return results
            
        except Exception as e:
            print(f"[!] 価格追跡エラー: {e}")
            return []
    
    def collect_releases(self) -> List[Dict]:
        """新製品リリース情報を収集"""
        if not RELEASE_TRACKER_AVAILABLE:
            print("[!] リリース追跡システムが利用できません")
            return []
        
        try:
            print("\n" + "=" * 60)
            print("新製品リリース情報収集中...")
            print("=" * 60)
            
            tracker = ReleaseTracker()
            releases = tracker.collect_all_releases()
            return releases
            
        except Exception as e:
            print(f"[!] リリース情報収集エラー: {e}")
            return []
    
    def collect_x_twitter(self) -> List[Dict]:
        """X（Twitter）情報を収集"""
        if not X_TWITTER_CURATOR_AVAILABLE:
            print("[!] X（Twitter）情報収集システムが利用できません")
            return []
        
        try:
            from dotenv import load_dotenv
            import os
            
            env_path = Path(__file__).parent.parent / '.env'
            load_dotenv(env_path)
            
            bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
            use_oauth = False
            
            if not bearer_token:
                # OAuth1.0aを試す
                if all([os.getenv('TWITTER_API_KEY'), os.getenv('TWITTER_API_SECRET'),
                       os.getenv('TWITTER_ACCESS_TOKEN'), os.getenv('TWITTER_ACCESS_TOKEN_SECRET')]):
                    use_oauth = True
                else:
                    print("[!] X（Twitter）APIの設定がありません")
                    return []
            
            print("\n" + "=" * 60)
            print("X（Twitter）情報収集中...")
            print("=" * 60)
            
            curator = XTwitterCurator(bearer_token=bearer_token, use_oauth=use_oauth)
            tweets = curator.collect_tweets(
                keywords=['Nike running shoes', 'Adidas running shoes', 'ASICS running shoes'],
                hashtags=['RunningShoes', 'RunningShoeReview'],
                max_results_per_query=30,
                since_days=7
            )
            
            return tweets
            
        except Exception as e:
            print(f"[!] X（Twitter）情報収集エラー: {e}")
            return []
    
    def run_all(self, methods: List[str] = None):
        """
        すべてのキュレーション方法を実行
        
        Args:
            methods: 実行するメソッドのリスト（Noneの場合はRedditとX（Twitter）を実行）
        """
        if methods is None:
            methods = ['reddit', 'x_twitter']  # デフォルトはRedditとX（Twitter）
        
        print("=" * 60)
        print("統合キュレーションスクリプト")
        print("=" * 60)
        print(f"実行メソッド: {', '.join(methods)}")
        print(f"開始時刻: {datetime.now().isoformat()}")
        
        # Redditレビュー収集
        if 'reddit' in methods:
            self.results['reddit'] = self.collect_reddit_reviews()
        
        # X（Twitter）情報収集
        if 'x_twitter' in methods:
            self.results['x_twitter'] = self.collect_x_twitter()
        
        # 価格追跡
        if 'price' in methods:
            self.results['price'] = self.track_prices()
        
        # 新製品リリース情報収集
        if 'release' in methods:
            self.results['release'] = self.collect_releases()
        
        # 結果を保存
        self.save_results()
        
        # サマリーを表示
        self.print_summary()
    
    def save_results(self, filename: str = 'integrated_curation_results.json'):
        """結果をJSONファイルに保存"""
        output_path = Path(__file__).parent / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n[*] 結果を {output_path} に保存しました")
    
    def print_summary(self):
        """サマリーを表示"""
        print("\n" + "=" * 60)
        print("収集結果サマリー")
        print("=" * 60)
        
        # Redditレビュー
        reddit_count = len(self.results.get('reddit', []))
        print(f"\nRedditレビュー: {reddit_count} 件")
        
        # 価格情報
        price_count = len(self.results.get('price', []))
        print(f"価格情報: {price_count} 件")
        
        # X（Twitter）情報
        x_twitter_count = len(self.results.get('x_twitter', []))
        print(f"X（Twitter）情報: {x_twitter_count} 件")
        
        # 新製品リリース情報
        release_count = len(self.results.get('release', []))
        print(f"新製品リリース情報: {release_count} 件")
        
        # 合計
        total = reddit_count + x_twitter_count + price_count + release_count
        print(f"\n合計: {total} 件の情報を収集しました")


def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(description='統合キュレーションスクリプト')
    parser.add_argument(
        '--methods',
        type=str,
        default='reddit,x_twitter',
        help='実行するメソッド（カンマ区切り）: reddit,x_twitter,price,release'
    )
    
    args = parser.parse_args()
    
    # メソッドリストをパース
    methods = [m.strip() for m in args.methods.split(',')]
    
    # 利用可能なメソッドのみにフィルタリング
    available_methods = []
    if 'reddit' in methods and REDDIT_AVAILABLE:
        available_methods.append('reddit')
    if 'x_twitter' in methods and X_TWITTER_CURATOR_AVAILABLE:
        available_methods.append('x_twitter')
    if 'price' in methods and PRICE_TRACKER_AVAILABLE:
        available_methods.append('price')
    if 'release' in methods and RELEASE_TRACKER_AVAILABLE:
        available_methods.append('release')
    
    if not available_methods:
        print("[!] 利用可能なキュレーション方法がありません")
        print("\n利用可能な方法:")
        if REDDIT_AVAILABLE:
            print("  - reddit")
        if X_TWITTER_CURATOR_AVAILABLE:
            print("  - x_twitter")
        if PRICE_TRACKER_AVAILABLE:
            print("  - price")
        if RELEASE_TRACKER_AVAILABLE:
            print("  - release")
        return
    
    # 統合キュレーターを実行
    curator = IntegratedCurator()
    curator.run_all(methods=available_methods)


if __name__ == "__main__":
    main()

