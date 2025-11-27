"""
価格追跡システム
複数のECサイトで価格変動を追跡し、最安値情報を提供

必要なライブラリ:
    pip install requests beautifulsoup4 python-dotenv

環境変数:
    (特になし - 公開APIを使用)
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

# 価格履歴ファイル
PRICE_HISTORY_FILE = Path(__file__).parent / 'price_history.json'

# 監視対象のシューズ（ブランド名、モデル名、検索URL）
MONITORED_SHOES = [
    {
        'brand': 'Nike',
        'model': 'Pegasus 41',
        'search_urls': [
            'https://www.nike.com/jp/t/air-zoom-pegasus-41-running-shoes',
            # 他のECサイトのURLも追加可能
        ]
    },
    {
        'brand': 'ASICS',
        'model': 'Novablast 5',
        'search_urls': [
            'https://www.asics.com/jp/ja-jp/novablast-5/p/1011B458-020.html',
        ]
    },
    # 他のシューズも追加可能
]


class PriceTracker:
    """価格追跡クラス"""
    
    def __init__(self):
        self.session = requests.Session() if requests else None
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.price_history = self.load_price_history()
    
    def load_price_history(self) -> Dict:
        """価格履歴を読み込む"""
        if PRICE_HISTORY_FILE.exists():
            try:
                with open(PRICE_HISTORY_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[!] 価格履歴の読み込みエラー: {e}")
        return {}
    
    def save_price_history(self):
        """価格履歴を保存"""
        try:
            with open(PRICE_HISTORY_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.price_history, f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            print(f"[!] 価格履歴の保存エラー: {e}")
    
    def extract_price_from_nike(self, url: str) -> Optional[Dict]:
        """
        Nike公式サイトから価格を抽出
        
        Args:
            url: 商品ページのURL
            
        Returns:
            価格情報の辞書
        """
        if not self.session:
            return None
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 価格要素を探す（Nikeサイトの構造に応じて調整が必要）
            price_element = soup.find('div', {'data-testid': 'product-price'})
            if not price_element:
                # 別のセレクタを試す
                price_element = soup.find('span', class_=re.compile('price', re.I))
            
            if price_element:
                price_text = price_element.get_text(strip=True)
                # 価格を数値に変換
                price_match = re.search(r'[\d,]+', price_text.replace(',', ''))
                if price_match:
                    price = int(price_match.group().replace(',', ''))
                    return {
                        'price': price,
                        'currency': 'JPY',
                        'url': url,
                        'available': True,
                    }
            
            return None
            
        except Exception as e:
            print(f"[!] Nike価格取得エラー ({url}): {e}")
            return None
    
    def extract_price_from_asics(self, url: str) -> Optional[Dict]:
        """
        ASICS公式サイトから価格を抽出
        
        Args:
            url: 商品ページのURL
            
        Returns:
            価格情報の辞書
        """
        if not self.session:
            return None
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 価格要素を探す（ASICSサイトの構造に応じて調整が必要）
            price_element = soup.find('span', class_=re.compile('price', re.I))
            if not price_element:
                price_element = soup.find('div', {'data-price': True})
            
            if price_element:
                price_text = price_element.get_text(strip=True)
                price_match = re.search(r'[\d,]+', price_text.replace(',', ''))
                if price_match:
                    price = int(price_match.group().replace(',', ''))
                    return {
                        'price': price,
                        'currency': 'JPY',
                        'url': url,
                        'available': True,
                    }
            
            return None
            
        except Exception as e:
            print(f"[!] ASICS価格取得エラー ({url}): {e}")
            return None
    
    def extract_price(self, url: str) -> Optional[Dict]:
        """
        URLから価格を抽出（サイトに応じて適切なメソッドを呼び出す）
        
        Args:
            url: 商品ページのURL
            
        Returns:
            価格情報の辞書
        """
        if 'nike.com' in url:
            return self.extract_price_from_nike(url)
        elif 'asics.com' in url:
            return self.extract_price_from_asics(url)
        else:
            # 汎用的な価格抽出を試みる
            return self.extract_price_generic(url)
    
    def extract_price_generic(self, url: str) -> Optional[Dict]:
        """
        汎用的な価格抽出（正規表現ベース）
        
        Args:
            url: 商品ページのURL
            
        Returns:
            価格情報の辞書
        """
        if not self.session:
            return None
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # HTMLから価格パターンを検索
            price_patterns = [
                r'¥\s*([\d,]+)',
                r'(\d{1,3}(?:,\d{3})*)\s*円',
                r'price["\']?\s*[:=]\s*["\']?([\d,]+)',
            ]
            
            for pattern in price_patterns:
                matches = re.findall(pattern, response.text, re.IGNORECASE)
                if matches:
                    # 最初に見つかった価格を使用
                    price_str = matches[0].replace(',', '')
                    try:
                        price = int(price_str)
                        return {
                            'price': price,
                            'currency': 'JPY',
                            'url': url,
                            'available': True,
                        }
                    except ValueError:
                        continue
            
            return None
            
        except Exception as e:
            print(f"[!] 汎用価格取得エラー ({url}): {e}")
            return None
    
    def track_shoe(self, brand: str, model: str, urls: List[str]) -> Dict:
        """
        特定のシューズの価格を追跡
        
        Args:
            brand: ブランド名
            model: モデル名
            urls: 監視対象のURLリスト
            
        Returns:
            価格情報の辞書
        """
        shoe_key = f"{brand}_{model}"
        current_prices = []
        
        print(f"\n[*] 価格追跡: {brand} {model}")
        
        for url in urls:
            print(f"  [*] チェック中: {url}")
            price_info = self.extract_price(url)
            
            if price_info:
                current_prices.append(price_info)
                print(f"    [✓] 価格: ¥{price_info['price']:,}")
            else:
                print(f"    [!] 価格取得失敗")
            
            # リクエスト間隔
            time.sleep(2)
        
        # 最安値を計算
        if current_prices:
            min_price = min(p['price'] for p in current_prices)
            min_price_url = next(p['url'] for p in current_prices if p['price'] == min_price)
        else:
            min_price = None
            min_price_url = None
        
        # 価格履歴を更新
        if shoe_key not in self.price_history:
            self.price_history[shoe_key] = {
                'brand': brand,
                'model': model,
                'history': []
            }
        
        history_entry = {
            'timestamp': datetime.now().isoformat(),
            'prices': current_prices,
            'min_price': min_price,
            'min_price_url': min_price_url,
        }
        
        self.price_history[shoe_key]['history'].append(history_entry)
        
        # 履歴が長すぎる場合は古いものを削除（最新100件まで）
        if len(self.price_history[shoe_key]['history']) > 100:
            self.price_history[shoe_key]['history'] = \
                self.price_history[shoe_key]['history'][-100:]
        
        return {
            'shoe_key': shoe_key,
            'brand': brand,
            'model': model,
            'current_prices': current_prices,
            'min_price': min_price,
            'min_price_url': min_price_url,
            'price_change': self.calculate_price_change(shoe_key, min_price),
        }
    
    def calculate_price_change(self, shoe_key: str, current_price: Optional[int]) -> Optional[Dict]:
        """
        価格変動を計算
        
        Args:
            shoe_key: シューズキー
            current_price: 現在の価格
            
        Returns:
            価格変動情報の辞書
        """
        if not current_price or shoe_key not in self.price_history:
            return None
        
        history = self.price_history[shoe_key]['history']
        if len(history) < 2:
            return None
        
        # 前回の価格を取得
        previous_entry = history[-2]
        previous_min_price = previous_entry.get('min_price')
        
        if not previous_min_price:
            return None
        
        change = current_price - previous_min_price
        change_percent = (change / previous_min_price) * 100
        
        return {
            'previous_price': previous_min_price,
            'current_price': current_price,
            'change': change,
            'change_percent': round(change_percent, 2),
            'is_discount': change < 0,
        }
    
    def track_all_shoes(self, shoes: List[Dict]) -> List[Dict]:
        """
        すべての監視対象シューズの価格を追跡
        
        Args:
            shoes: 監視対象シューズのリスト
            
        Returns:
            価格情報のリスト
        """
        results = []
        
        for shoe in shoes:
            result = self.track_shoe(
                brand=shoe['brand'],
                model=shoe['model'],
                urls=shoe['search_urls']
            )
            results.append(result)
        
        # 価格履歴を保存
        self.save_price_history()
        
        return results


def main():
    """メイン関数"""
    if not requests or not BeautifulSoup:
        print("[!] 必要なライブラリがインストールされていません")
        return
    
    print("=" * 60)
    print("価格追跡システム")
    print("=" * 60)
    
    tracker = PriceTracker()
    
    # すべてのシューズの価格を追跡
    results = tracker.track_all_shoes(MONITORED_SHOES)
    
    # 結果を表示
    print("\n" + "=" * 60)
    print("価格追跡結果")
    print("=" * 60)
    
    for result in results:
        print(f"\n{result['brand']} {result['model']}:")
        if result['min_price']:
            print(f"  最安値: ¥{result['min_price']:,}")
            print(f"  URL: {result['min_price_url']}")
            
            if result['price_change']:
                change = result['price_change']
                if change['is_discount']:
                    print(f"  [↓] 前回より ¥{abs(change['change']):,} 安くなりました ({abs(change['change_percent']):.1f}%)")
                else:
                    print(f"  [↑] 前回より ¥{change['change']:,} 高くなりました ({change['change_percent']:.1f}%)")
        else:
            print("  価格取得失敗")
    
    print(f"\n[*] 価格履歴を {PRICE_HISTORY_FILE} に保存しました")


if __name__ == "__main__":
    main()



