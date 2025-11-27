"""
新製品リリース情報収集スクリプト
ブランド公式サイトやニュースサイトから新製品情報を自動収集

必要なライブラリ:
    pip install feedparser requests beautifulsoup4 python-dotenv

環境変数:
    GOOGLE_SEARCH_API_KEY: Google Search APIキー（オプション）
    GOOGLE_SEARCH_ENGINE_ID: Google Search Engine ID（オプション）
"""

import os
import json
import time
import re
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path
from dotenv import load_dotenv

try:
    import feedparser
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("[!] 必要なライブラリがインストールされていません。pip install feedparser requests beautifulsoup4 を実行してください")
    feedparser = None
    requests = None
    BeautifulSoup = None

# .envファイルから環境変数を読み込む
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Google Search API設定（オプション）
GOOGLE_API_KEY = os.getenv('GOOGLE_SEARCH_API_KEY')
GOOGLE_CSE_ID = os.getenv('GOOGLE_SEARCH_ENGINE_ID')

# 監視対象のRSSフィード
RSS_FEEDS = [
    {
        'name': 'Runner\'s World',
        'url': 'https://www.runnersworld.com/feed/',
        'type': 'news'
    },
    {
        'name': 'Believe in the Run',
        'url': 'https://believeintherun.com/feed/',
        'type': 'review'
    },
    # 他のRSSフィードも追加可能
]

# ブランド公式サイトの新製品ページ
BRAND_RELEASE_PAGES = [
    {
        'brand': 'Nike',
        'url': 'https://www.nike.com/jp/launch',
        'type': 'official'
    },
    {
        'brand': 'Adidas',
        'url': 'https://www.adidas.co.jp/new-arrivals',
        'type': 'official'
    },
    {
        'brand': 'ASICS',
        'url': 'https://www.asics.com/jp/ja-jp/new-arrivals',
        'type': 'official'
    },
    # 他のブランドも追加可能
]

# 検索キーワード
RELEASE_KEYWORDS = [
    'new running shoes',
    'running shoe release',
    'new shoe launch',
    '最新ランニングシューズ',
    '新作ランニングシューズ',
]


class ReleaseTracker:
    """新製品リリース情報収集クラス"""
    
    def __init__(self):
        self.session = requests.Session() if requests else None
        if self.session:
            self.session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
        self.releases = []
    
    def parse_rss_feed(self, feed_url: str) -> List[Dict]:
        """
        RSSフィードをパースして新製品情報を抽出
        
        Args:
            feed_url: RSSフィードのURL
            
        Returns:
            新製品情報のリスト
        """
        if not feedparser:
            return []
        
        try:
            feed = feedparser.parse(feed_url)
            releases = []
            
            for entry in feed.entries[:20]:  # 最新20件まで
                # タイトルと本文からシューズ関連の情報を検出
                title = entry.get('title', '')
                summary = entry.get('summary', '')
                full_text = f"{title} {summary}"
                
                # シューズ関連のキーワードをチェック
                shoe_keywords = ['shoe', 'running', 'sneaker', 'シューズ', 'ランニング']
                if any(keyword.lower() in full_text.lower() for keyword in shoe_keywords):
                    release_info = {
                        'title': title,
                        'url': entry.get('link', ''),
                        'published': entry.get('published', ''),
                        'summary': summary[:500],  # 最初の500文字
                        'source': 'rss',
                        'source_url': feed_url,
                        'collected_at': datetime.now().isoformat(),
                    }
                    releases.append(release_info)
            
            return releases
            
        except Exception as e:
            print(f"[!] RSSフィード解析エラー ({feed_url}): {e}")
            return []
    
    def scrape_brand_page(self, brand: str, url: str) -> List[Dict]:
        """
        ブランド公式サイトの新製品ページをスクレイピング
        
        Args:
            brand: ブランド名
            url: 新製品ページのURL
            
        Returns:
            新製品情報のリスト
        """
        if not self.session or not BeautifulSoup:
            return []
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            releases = []
            
            # 商品リンクを探す（サイト構造に応じて調整が必要）
            product_links = soup.find_all('a', href=re.compile(r'/(shoe|product|running)', re.I))
            
            for link in product_links[:20]:  # 最新20件まで
                product_url = link.get('href', '')
                if not product_url.startswith('http'):
                    # 相対URLの場合は絶対URLに変換
                    from urllib.parse import urljoin
                    product_url = urljoin(url, product_url)
                
                title = link.get_text(strip=True)
                
                # タイトルが空の場合は、親要素から取得を試みる
                if not title:
                    parent = link.find_parent()
                    if parent:
                        title = parent.get_text(strip=True)
                
                if title and len(title) > 5:  # 短すぎるタイトルは除外
                    release_info = {
                        'brand': brand,
                        'title': title,
                        'url': product_url,
                        'source': 'official',
                        'source_url': url,
                        'collected_at': datetime.now().isoformat(),
                    }
                    releases.append(release_info)
            
            return releases
            
        except Exception as e:
            print(f"[!] ブランドページスクレイピングエラー ({brand}, {url}): {e}")
            return []
    
    def search_google_news(self, query: str, num_results: int = 10) -> List[Dict]:
        """
        Google検索APIを使用して新製品情報を検索
        
        Args:
            query: 検索クエリ
            num_results: 取得件数
            
        Returns:
            検索結果のリスト
        """
        if not GOOGLE_API_KEY or not GOOGLE_CSE_ID:
            print("[!] Google Search APIの設定がありません。RSSフィードとブランドページのみを使用します")
            return []
        
        if not self.session:
            return []
        
        try:
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                'key': GOOGLE_API_KEY,
                'cx': GOOGLE_CSE_ID,
                'q': query,
                'num': min(num_results, 10),
                'dateRestrict': 'm1',  # 過去1ヶ月以内
            }
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            releases = []
            for item in data.get('items', []):
                release_info = {
                    'title': item.get('title', ''),
                    'url': item.get('link', ''),
                    'snippet': item.get('snippet', ''),
                    'source': 'google_search',
                    'query': query,
                    'collected_at': datetime.now().isoformat(),
                }
                releases.append(release_info)
            
            return releases
            
        except Exception as e:
            print(f"[!] Google検索エラー ({query}): {e}")
            return []
    
    def extract_shoe_info(self, text: str) -> Optional[Dict]:
        """
        テキストからシューズ情報を抽出
        
        Args:
            text: 抽出対象のテキスト
            
        Returns:
            シューズ情報の辞書
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
        model_patterns = [
            r'(\w+\s+\d+)',  # "Pegasus 41" のようなパターン
            r'([A-Z][a-z]+\s+[A-Z][a-z]+)',  # "Air Zoom" のようなパターン
        ]
        
        detected_model = None
        for pattern in model_patterns:
            matches = re.findall(pattern, text)
            if matches:
                detected_model = matches[0]
                break
        
        # リリース日を検出
        date_patterns = [
            r'(\d{4}年\d{1,2}月\d{1,2}日)',
            r'(\d{4}/\d{1,2}/\d{1,2})',
            r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}',
        ]
        
        detected_date = None
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            if matches:
                detected_date = matches[0]
                break
        
        if detected_brand or detected_model:
            return {
                'brand': detected_brand,
                'model': detected_model,
                'release_date': detected_date,
                'confidence': 'medium'
            }
        
        return None
    
    def collect_all_releases(self) -> List[Dict]:
        """
        すべてのソースから新製品情報を収集
        
        Returns:
            新製品情報のリスト
        """
        all_releases = []
        
        # 1. RSSフィードから収集
        print("\n[*] RSSフィードから収集中...")
        for feed in RSS_FEEDS:
            print(f"  [*] {feed['name']}")
            releases = self.parse_rss_feed(feed['url'])
            all_releases.extend(releases)
            time.sleep(1)
        
        # 2. ブランド公式サイトから収集
        print("\n[*] ブランド公式サイトから収集中...")
        for brand_page in BRAND_RELEASE_PAGES:
            print(f"  [*] {brand_page['brand']}")
            releases = self.scrape_brand_page(brand_page['brand'], brand_page['url'])
            all_releases.extend(releases)
            time.sleep(2)
        
        # 3. Google検索から収集
        if GOOGLE_API_KEY and GOOGLE_CSE_ID:
            print("\n[*] Google検索から収集中...")
            for keyword in RELEASE_KEYWORDS[:3]:  # 最初の3つのキーワードのみ
                print(f"  [*] キーワード: {keyword}")
                releases = self.search_google_news(keyword, num_results=5)
                all_releases.extend(releases)
                time.sleep(1)
        
        # 4. シューズ情報を抽出
        print("\n[*] シューズ情報を抽出中...")
        for release in all_releases:
            full_text = f"{release.get('title', '')} {release.get('summary', '')} {release.get('snippet', '')}"
            shoe_info = self.extract_shoe_info(full_text)
            release['shoe_info'] = shoe_info
        
        return all_releases
    
    def save_results(self, releases: List[Dict], filename: str = 'releases.json'):
        """結果をJSONファイルに保存"""
        output_path = Path(__file__).parent / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(releases, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n[*] 結果を {output_path} に保存しました ({len(releases)} 件)")


def main():
    """メイン関数"""
    if not feedparser or not requests or not BeautifulSoup:
        print("[!] 必要なライブラリがインストールされていません")
        return
    
    print("=" * 60)
    print("新製品リリース情報収集スクリプト")
    print("=" * 60)
    
    tracker = ReleaseTracker()
    
    # 新製品情報を収集
    releases = tracker.collect_all_releases()
    
    # 結果を保存
    if releases:
        tracker.save_results(releases)
        
        # サマリーを表示
        print(f"\n収集結果:")
        print(f"  総リリース数: {len(releases)}")
        
        # ソース別の集計
        source_counts = {}
        for release in releases:
            source = release.get('source', 'unknown')
            source_counts[source] = source_counts.get(source, 0) + 1
        
        print(f"\nソース別:")
        for source, count in source_counts.items():
            print(f"  {source}: {count} 件")
        
        # シューズ情報が抽出できたものの数
        shoe_info_count = sum(1 for r in releases if r.get('shoe_info'))
        print(f"\nシューズ情報抽出成功: {shoe_info_count} / {len(releases)}")
        
        # 最新5件を表示
        print(f"\n最新5件:")
        for idx, release in enumerate(releases[:5], 1):
            print(f"  {idx}. {release.get('title', 'N/A')}")
            if release.get('shoe_info'):
                shoe_info = release['shoe_info']
                if shoe_info.get('brand'):
                    print(f"     ブランド: {shoe_info['brand']}")
                if shoe_info.get('model'):
                    print(f"     モデル: {shoe_info['model']}")
    else:
        print("\n[!] 新製品情報が収集できませんでした")


if __name__ == "__main__":
    main()



