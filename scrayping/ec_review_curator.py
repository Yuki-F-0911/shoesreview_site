"""
ECサイトレビュー収集スクリプト
Amazon、楽天、YahooショッピングなどのECサイトから商品レビューを収集

必要なライブラリ:
    pip install requests beautifulsoup4 python-dotenv

環境変数:
    AMAZON_ASSOCIATE_TAG: Amazonアソシエイトタグ（オプション）
    RAKUTEN_APPLICATION_ID: 楽天APIアプリケーションID（オプション）
    RAKUTEN_AFFILIATE_ID: 楽天アフィリエイトID（オプション）

注意事項:
    - ECサイトの利用規約を確認し、遵守してください
    - 過度なリクエストは避け、適切な間隔を設けてください
    - スクレイピングは各サイトの利用規約に違反する可能性があります
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
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("[!] 必要なライブラリがインストールされていません。pip install requests beautifulsoup4 を実行してください")
    requests = None
    BeautifulSoup = None

# .envファイルから環境変数を読み込む
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# API設定（オプション）
AMAZON_ASSOCIATE_TAG = os.getenv('AMAZON_ASSOCIATE_TAG')
RAKUTEN_APPLICATION_ID = os.getenv('RAKUTEN_APPLICATION_ID')
RAKUTEN_AFFILIATE_ID = os.getenv('RAKUTEN_AFFILIATE_ID')

# レビュー履歴ファイル
REVIEW_HISTORY_FILE = Path(__file__).parent / 'ec_review_history.json'


class ECReviewCurator:
    """ECサイトレビュー収集クラス"""
    
    def __init__(self):
        self.session = requests.Session() if requests else None
        if self.session:
            self.session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })
        self.review_history = self.load_review_history()
    
    def load_review_history(self) -> Dict:
        """レビュー履歴を読み込む"""
        if REVIEW_HISTORY_FILE.exists():
            try:
                with open(REVIEW_HISTORY_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[!] レビュー履歴の読み込みエラー: {e}")
        return {}
    
    def save_review_history(self):
        """レビュー履歴を保存"""
        try:
            with open(REVIEW_HISTORY_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.review_history, f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            print(f"[!] レビュー履歴の保存エラー: {e}")
    
    def extract_amazon_reviews(self, product_url: str, max_reviews: int = 50) -> List[Dict]:
        """
        Amazon商品ページからレビューを抽出
        
        Args:
            product_url: Amazon商品ページのURL
            max_reviews: 取得する最大レビュー数
            
        Returns:
            レビュー情報のリスト
        """
        if not self.session or not BeautifulSoup:
            return []
        
        try:
            # 商品ページからASINを抽出
            asin_match = re.search(r'/dp/([A-Z0-9]{10})', product_url)
            if not asin_match:
                asin_match = re.search(r'/product/([A-Z0-9]{10})', product_url)
            if not asin_match:
                print(f"[!] ASINが見つかりません: {product_url}")
                return []
            
            asin = asin_match.group(1)
            print(f"[*] ASIN: {asin}")
            
            # レビューページのURL
            review_url = f"https://www.amazon.co.jp/product-reviews/{asin}/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews"
            
            reviews = []
            page = 1
            
            while len(reviews) < max_reviews:
                # ページネーション対応
                if page > 1:
                    review_url = f"https://www.amazon.co.jp/product-reviews/{asin}/ref=cm_cr_arp_d_paging_btm_{page}?ie=UTF8&reviewerType=all_reviews&pageNumber={page}"
                
                print(f"  [*] レビューページ {page} を取得中...")
                
                response = self.session.get(review_url, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # レビュー要素を探す
                review_elements = soup.find_all('div', {'data-hook': 'review'})
                
                if not review_elements:
                    # 別のセレクタを試す
                    review_elements = soup.find_all('div', class_=re.compile('review', re.I))
                
                if not review_elements:
                    print(f"  [!] レビューが見つかりませんでした（ページ {page}）")
                    break
                
                for review_elem in review_elements:
                    if len(reviews) >= max_reviews:
                        break
                    
                    try:
                        # レビュータイトル
                        title_elem = review_elem.find('a', {'data-hook': 'review-title'})
                        if not title_elem:
                            title_elem = review_elem.find('span', class_=re.compile('review-title', re.I))
                        title = title_elem.get_text(strip=True) if title_elem else ''
                        
                        # レビュー本文
                        body_elem = review_elem.find('span', {'data-hook': 'review-body'})
                        if not body_elem:
                            body_elem = review_elem.find('div', class_=re.compile('review-text', re.I))
                        body = body_elem.get_text(strip=True) if body_elem else ''
                        
                        # 評価（星の数）
                        rating_elem = review_elem.find('i', {'data-hook': 'review-star-rating'})
                        if not rating_elem:
                            rating_elem = review_elem.find('span', class_=re.compile('rating', re.I))
                        
                        rating = None
                        if rating_elem:
                            rating_text = rating_elem.get_text(strip=True)
                            rating_match = re.search(r'(\d+)', rating_text)
                            if rating_match:
                                rating = int(rating_match.group(1))
                        
                        # レビュアー名
                        reviewer_elem = review_elem.find('span', class_=re.compile('profile-name', re.I))
                        reviewer = reviewer_elem.get_text(strip=True) if reviewer_elem else '匿名'
                        
                        # レビュー日
                        date_elem = review_elem.find('span', {'data-hook': 'review-date'})
                        if not date_elem:
                            date_elem = review_elem.find('span', class_=re.compile('review-date', re.I))
                        review_date = date_elem.get_text(strip=True) if date_elem else ''
                        
                        # 役に立った数
                        helpful_elem = review_elem.find('span', {'data-hook': 'helpful-vote-statement'})
                        helpful_count = 0
                        if helpful_elem:
                            helpful_text = helpful_elem.get_text(strip=True)
                            helpful_match = re.search(r'(\d+)', helpful_text)
                            if helpful_match:
                                helpful_count = int(helpful_match.group(1))
                        
                        if title or body:  # タイトルまたは本文がある場合のみ追加
                            review_data = {
                                'asin': asin,
                                'title': title,
                                'body': body,
                                'rating': rating,
                                'reviewer': reviewer,
                                'date': review_date,
                                'helpful_count': helpful_count,
                                'source': 'amazon',
                                'product_url': product_url,
                                'collected_at': datetime.now().isoformat(),
                            }
                            reviews.append(review_data)
                    
                    except Exception as e:
                        print(f"  [!] レビュー抽出エラー: {e}")
                        continue
                
                # 次のページがあるかチェック
                next_page = soup.find('li', class_=re.compile('a-last', re.I))
                if not next_page or 'a-disabled' in next_page.get('class', []):
                    break
                
                page += 1
                time.sleep(2)  # リクエスト間隔
            
            print(f"  [✓] {len(reviews)} 件のレビューを取得しました")
            return reviews
            
        except Exception as e:
            print(f"[!] Amazonレビュー取得エラー ({product_url}): {e}")
            return []
    
    def extract_rakuten_reviews(self, product_url: str, max_reviews: int = 50) -> List[Dict]:
        """
        楽天市場の商品ページからレビューを抽出
        
        Args:
            product_url: 楽天商品ページのURL
            max_reviews: 取得する最大レビュー数
            
        Returns:
            レビュー情報のリスト
        """
        if not self.session or not BeautifulSoup:
            return []
        
        try:
            # 商品コードを抽出
            item_code_match = re.search(r'/product/([^/?]+)', product_url)
            if not item_code_match:
                print(f"[!] 商品コードが見つかりません: {product_url}")
                return []
            
            item_code = item_code_match.group(1)
            print(f"[*] 商品コード: {item_code}")
            
            # レビューページのURL
            review_url = f"{product_url}#review"
            
            reviews = []
            page = 1
            
            while len(reviews) < max_reviews:
                if page > 1:
                    review_url = f"{product_url}?page={page}#review"
                
                print(f"  [*] レビューページ {page} を取得中...")
                
                response = self.session.get(review_url, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # レビュー要素を探す
                review_elements = soup.find_all('div', class_=re.compile('review', re.I))
                
                if not review_elements:
                    print(f"  [!] レビューが見つかりませんでした（ページ {page}）")
                    break
                
                for review_elem in review_elements:
                    if len(reviews) >= max_reviews:
                        break
                    
                    try:
                        # レビュー本文
                        body_elem = review_elem.find('p', class_=re.compile('review', re.I))
                        body = body_elem.get_text(strip=True) if body_elem else ''
                        
                        # 評価（星の数）
                        rating_elem = review_elem.find('span', class_=re.compile('rating', re.I))
                        rating = None
                        if rating_elem:
                            rating_text = rating_elem.get_text(strip=True)
                            rating_match = re.search(r'(\d+)', rating_text)
                            if rating_match:
                                rating = int(rating_match.group(1))
                        
                        # レビュアー名
                        reviewer_elem = review_elem.find('span', class_=re.compile('reviewer', re.I))
                        reviewer = reviewer_elem.get_text(strip=True) if reviewer_elem else '匿名'
                        
                        # レビュー日
                        date_elem = review_elem.find('time')
                        review_date = date_elem.get('datetime', '') if date_elem else ''
                        
                        if body:  # 本文がある場合のみ追加
                            review_data = {
                                'item_code': item_code,
                                'body': body,
                                'rating': rating,
                                'reviewer': reviewer,
                                'date': review_date,
                                'source': 'rakuten',
                                'product_url': product_url,
                                'collected_at': datetime.now().isoformat(),
                            }
                            reviews.append(review_data)
                    
                    except Exception as e:
                        print(f"  [!] レビュー抽出エラー: {e}")
                        continue
                
                # 次のページがあるかチェック
                next_page = soup.find('a', class_=re.compile('next', re.I))
                if not next_page:
                    break
                
                page += 1
                time.sleep(2)
            
            print(f"  [✓] {len(reviews)} 件のレビューを取得しました")
            return reviews
            
        except Exception as e:
            print(f"[!] 楽天レビュー取得エラー ({product_url}): {e}")
            return []
    
    def extract_yahoo_reviews(self, product_url: str, max_reviews: int = 50) -> List[Dict]:
        """
        Yahooショッピングの商品ページからレビューを抽出
        
        Args:
            product_url: Yahooショッピング商品ページのURL
            max_reviews: 取得する最大レビュー数
            
        Returns:
            レビュー情報のリスト
        """
        if not self.session or not BeautifulSoup:
            return []
        
        try:
            # 商品コードを抽出
            item_code_match = re.search(r'/p/([^/?]+)', product_url)
            if not item_code_match:
                print(f"[!] 商品コードが見つかりません: {product_url}")
                return []
            
            item_code = item_code_match.group(1)
            print(f"[*] 商品コード: {item_code}")
            
            # レビューページのURL
            review_url = f"{product_url}#review"
            
            reviews = []
            page = 1
            
            while len(reviews) < max_reviews:
                if page > 1:
                    review_url = f"{product_url}?page={page}#review"
                
                print(f"  [*] レビューページ {page} を取得中...")
                
                response = self.session.get(review_url, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # レビュー要素を探す
                review_elements = soup.find_all('div', class_=re.compile('review', re.I))
                
                if not review_elements:
                    print(f"  [!] レビューが見つかりませんでした（ページ {page}）")
                    break
                
                for review_elem in review_elements:
                    if len(reviews) >= max_reviews:
                        break
                    
                    try:
                        # レビュー本文
                        body_elem = review_elem.find('p', class_=re.compile('review', re.I))
                        body = body_elem.get_text(strip=True) if body_elem else ''
                        
                        # 評価（星の数）
                        rating_elem = review_elem.find('span', class_=re.compile('rating', re.I))
                        rating = None
                        if rating_elem:
                            rating_text = rating_elem.get_text(strip=True)
                            rating_match = re.search(r'(\d+)', rating_text)
                            if rating_match:
                                rating = int(rating_match.group(1))
                        
                        # レビュアー名
                        reviewer_elem = review_elem.find('span', class_=re.compile('reviewer', re.I))
                        reviewer = reviewer_elem.get_text(strip=True) if reviewer_elem else '匿名'
                        
                        # レビュー日
                        date_elem = review_elem.find('time')
                        review_date = date_elem.get('datetime', '') if date_elem else ''
                        
                        if body:
                            review_data = {
                                'item_code': item_code,
                                'body': body,
                                'rating': rating,
                                'reviewer': reviewer,
                                'date': review_date,
                                'source': 'yahoo',
                                'product_url': product_url,
                                'collected_at': datetime.now().isoformat(),
                            }
                            reviews.append(review_data)
                    
                    except Exception as e:
                        print(f"  [!] レビュー抽出エラー: {e}")
                        continue
                
                # 次のページがあるかチェック
                next_page = soup.find('a', class_=re.compile('next', re.I))
                if not next_page:
                    break
                
                page += 1
                time.sleep(2)
            
            print(f"  [✓] {len(reviews)} 件のレビューを取得しました")
            return reviews
            
        except Exception as e:
            print(f"[!] Yahooレビュー取得エラー ({product_url}): {e}")
            return []
    
    def extract_shoe_info_from_review(self, review_text: str) -> Optional[Dict]:
        """
        レビューテキストからシューズ情報を抽出
        
        Args:
            review_text: レビューのテキスト
            
        Returns:
            シューズ情報の辞書
        """
        # ブランド名を検出
        brands = ['Nike', 'Adidas', 'ASICS', 'Saucony', 'Brooks', 
                  'New Balance', 'Mizuno', 'Hoka', 'On', 'ナイキ', 'アディダス', 'アシックス']
        
        detected_brand = None
        for brand in brands:
            if brand.lower() in review_text.lower():
                detected_brand = brand
                break
        
        # モデル名を検出
        model_patterns = [
            r'(\w+\s+\d+)',  # "Pegasus 41" のようなパターン
            r'([A-Z][a-z]+\s+[A-Z][a-z]+)',  # "Air Zoom" のようなパターン
        ]
        
        detected_model = None
        for pattern in model_patterns:
            matches = re.findall(pattern, review_text)
            if matches:
                detected_model = matches[0]
                break
        
        if detected_brand or detected_model:
            return {
                'brand': detected_brand,
                'model': detected_model,
                'confidence': 'medium'
            }
        
        return None
    
    def collect_reviews(self, product_urls: List[Dict]) -> List[Dict]:
        """
        複数の商品URLからレビューを収集
        
        Args:
            product_urls: 商品URLのリスト（各要素は {'url': str, 'site': str} の形式）
            
        Returns:
            収集したレビューのリスト
        """
        all_reviews = []
        
        for product_info in product_urls:
            url = product_info.get('url', '')
            site = product_info.get('site', 'auto')  # auto, amazon, rakuten, yahoo
            
            print(f"\n[*] レビュー収集中: {url}")
            
            # サイトを自動判定
            if site == 'auto':
                if 'amazon.co.jp' in url or 'amazon.com' in url:
                    site = 'amazon'
                elif 'rakuten.co.jp' in url:
                    site = 'rakuten'
                elif 'shopping.yahoo.co.jp' in url:
                    site = 'yahoo'
                else:
                    print(f"  [!] 未対応のサイトです: {url}")
                    continue
            
            # サイトに応じてレビューを取得
            reviews = []
            if site == 'amazon':
                reviews = self.extract_amazon_reviews(url, max_reviews=50)
            elif site == 'rakuten':
                reviews = self.extract_rakuten_reviews(url, max_reviews=50)
            elif site == 'yahoo':
                reviews = self.extract_yahoo_reviews(url, max_reviews=50)
            
            # シューズ情報を抽出
            for review in reviews:
                review_text = f"{review.get('title', '')} {review.get('body', '')}"
                shoe_info = self.extract_shoe_info_from_review(review_text)
                review['shoe_info'] = shoe_info
            
            all_reviews.extend(reviews)
            
            # リクエスト間隔
            time.sleep(3)
        
        return all_reviews
    
    def save_results(self, reviews: List[Dict], filename: str = 'ec_reviews.json'):
        """結果をJSONファイルに保存"""
        output_path = Path(__file__).parent / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(reviews, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n[*] 結果を {output_path} に保存しました ({len(reviews)} 件)")


def main():
    """メイン関数"""
    if not requests or not BeautifulSoup:
        print("[!] 必要なライブラリがインストールされていません")
        return
    
    print("=" * 60)
    print("ECサイトレビュー収集スクリプト")
    print("=" * 60)
    print("\n注意: ECサイトの利用規約を確認し、遵守してください")
    print("過度なリクエストは避け、適切な間隔を設けてください\n")
    
    curator = ECReviewCurator()
    
    # 監視対象の商品URL（例）
    product_urls = [
        {
            'url': 'https://www.amazon.co.jp/dp/B0C1234567',  # 例: Nike Pegasus 41
            'site': 'amazon'
        },
        # 他の商品URLも追加可能
        # {
        #     'url': 'https://item.rakuten.co.jp/...',
        #     'site': 'rakuten'
        # },
    ]
    
    # コマンドライン引数からURLを取得する場合
    import sys
    if len(sys.argv) > 1:
        product_urls = [{'url': url, 'site': 'auto'} for url in sys.argv[1:]]
    
    if not product_urls:
        print("[!] 商品URLが指定されていません")
        print("\n使用方法:")
        print("  python ec_review_curator.py <商品URL1> <商品URL2> ...")
        print("\nまたは、スクリプト内の product_urls リストを編集してください")
        return
    
    # レビューを収集
    reviews = curator.collect_reviews(product_urls)
    
    # 結果を保存
    if reviews:
        curator.save_results(reviews)
        
        # サマリーを表示
        print(f"\n収集結果:")
        print(f"  総レビュー数: {len(reviews)}")
        
        # サイト別の集計
        site_counts = {}
        rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        for review in reviews:
            source = review.get('source', 'unknown')
            site_counts[source] = site_counts.get(source, 0) + 1
            
            rating = review.get('rating')
            if rating and 1 <= rating <= 5:
                rating_distribution[rating] = rating_distribution.get(rating, 0) + 1
        
        print(f"\nサイト別:")
        for site, count in site_counts.items():
            print(f"  {site}: {count} 件")
        
        print(f"\n評価分布:")
        for rating in range(1, 6):
            count = rating_distribution.get(rating, 0)
            percentage = (count / len(reviews) * 100) if reviews else 0
            print(f"  {rating}星: {count} 件 ({percentage:.1f}%)")
        
        # シューズ情報が抽出できたものの数
        shoe_info_count = sum(1 for r in reviews if r.get('shoe_info'))
        print(f"\nシューズ情報抽出成功: {shoe_info_count} / {len(reviews)}")
        
        # 最新5件を表示
        print(f"\n最新5件のレビュー:")
        for idx, review in enumerate(reviews[:5], 1):
            print(f"\n  {idx}. {review.get('title', 'N/A')}")
            if review.get('rating'):
                print(f"     評価: {'★' * review['rating']} ({review['rating']}/5)")
            print(f"     レビュアー: {review.get('reviewer', 'N/A')}")
            print(f"     日付: {review.get('date', 'N/A')}")
            body = review.get('body', '')
            if body:
                print(f"     本文: {body[:100]}..." if len(body) > 100 else f"     本文: {body}")
    else:
        print("\n[!] レビューが収集できませんでした")


if __name__ == "__main__":
    main()



