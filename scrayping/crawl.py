import os
import requests
import json
import time
import csv
import re
from collections import defaultdict
# 本文抽出に特化したライブラリ（BeautifulSoupよりノイズ除去に強い）
# pip install trafilatura requests
import trafilatura
from dotenv import load_dotenv
from pathlib import Path

# .envファイルから環境変数を読み込む（プロジェクトルートの.envを読み込む）
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# ==========================================
# 使用方法
# ==========================================
# Dify APIを使用する場合:
#   USE_DIFY=true
#   DIFY_API_KEY=your_dify_api_key
#   DIFY_WORKFLOW_ID=your_workflow_id
#
# コードベース実装（OpenAI API）を使用する場合:
#   USE_DIFY=false
#   LLM_PROVIDER=openai
#   OPENAI_API_KEY=your_openai_api_key
#   MAX_TOKENS=2048
#   pip install openai が必要
#
# コードベース実装（Claude API）を使用する場合:
#   USE_DIFY=false
#   LLM_PROVIDER=claude
#   CLAUDE_API_KEY=your_claude_api_key
#   MAX_TOKENS=2048
#   pip install anthropic が必要
#
# コードベース実装（Gemini API）を使用する場合:
#   USE_DIFY=false
#   LLM_PROVIDER=gemini
#   GEMINI_API_KEY=your_gemini_api_key
#   GEMINI_MODEL=gemini-1.5-flash  # 利用可能: gemini-1.5-flash, gemini-1.5-pro, gemini-1.5-flash-latest
#   MAX_TOKENS=2048
#   pip install google-generativeai が必要
#
# DifyでGeminiを使用する場合の注意:
#   Difyのワークフロー内でGeminiモデルを設定する際は、以下のモデル名を使用してください:
#   - gemini-1.5-flash (推奨)
#   - gemini-1.5-pro
#   - gemini-1.5-flash-latest
#   - gemini-1.5-pro-latest
#   プレビュー版や存在しないモデル名（例: gemini-2.5-flash-lite-preview-06-17）は使用しないでください

# ==========================================
# 設定 (環境変数または直接入力)
# ==========================================
GOOGLE_API_KEY = os.getenv('GOOGLE_SEARCH_API_KEY')
GOOGLE_CSE_ID = os.getenv('GOOGLE_SEARCH_ENGINE_ID')
DIFY_API_KEY = os.getenv('DIFY_API_KEY')
DIFY_WORKFLOW_ID = os.getenv('DIFY_WORKFLOW_ID', '')  # DifyのワークフローID（オプション）
DIFY_BASE_URL = os.getenv('DIFY_API_URL', 'https://willdify.com/v1')

# LLM API設定（コードベース実装用）
USE_DIFY = os.getenv('USE_DIFY', 'true').lower() == 'true'  # Difyを使用するか（デフォルト: true）
LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'gemini').lower()  # 'openai', 'claude', または 'gemini'
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')  # デフォルト: gpt-4o-mini（コスト効率が良い）
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')
CLAUDE_MODEL = os.getenv('CLAUDE_MODEL', 'claude-3-haiku-20240307')  # デフォルト: claude-3-haiku（コスト効率が良い）
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')  # デフォルト: gemini-1.5-flash
# 利用可能なGeminiモデル（2024-2025）:
# - gemini-1.5-flash (推奨: 高速でコスト効率が良い)
# - gemini-1.5-pro (高精度が必要な場合)
# - gemini-1.5-flash-latest (最新版)
# - gemini-1.5-pro-latest (最新版)
# - gemini-pro (旧バージョン、互換性のため)
# 注意: gemini-2.5-flash-lite-preview-06-17 などのプレビュー版は利用不可
MAX_TOKENS = int(os.getenv('MAX_TOKENS', '2048'))  # コードベース実装での最大トークン数（デフォルト: 2048）

# ==========================================
# キャッシュ設定
# ==========================================
CACHE_FILE = Path(__file__).parent / 'url_cache.json'  # URLキャッシュファイル
MAX_TEXT_LENGTH = int(os.getenv('MAX_TEXT_LENGTH', '8000'))  # Difyに送信する最大文字数（デフォルト: 8000文字）

# ==========================================
# プロンプトテンプレート（コードベース実装用）
# ==========================================
SHOE_REVIEW_PROMPT = """あなたはランニングシューズの専門家です。以下の記事を分析して、JSON形式で構造化された情報を抽出してください。

記事URL: {url}

記事内容:
{article_text}

以下のJSON形式で出力してください（日本語で記述）:
{{
  "product_info": {{
    "brand_name": "ブランド名（例: Nike, Adidas, ASICS）",
    "model_name": "モデル名（例: Pegasus 41, Ultraboost 23）",
    "category": "カテゴリ（例: Daily Trainer, Racing, Trail）",
    "release_year": 発売年（数値、不明な場合はnull）,
    "price_usd": 価格（USD、不明な場合はnull）
  }},
  "specs": {{
    "weight_g": 重量（グラム、不明な場合はnull）,
    "drop_mm": ドロップ（mm、不明な場合はnull）,
    "stack_height_heel_mm": ヒールスタック高（mm、不明な場合はnull）,
    "stack_height_forefoot_mm": フォアフットスタック高（mm、不明な場合はnull）
  }},
  "review_content": {{
    "summary_ja": "記事の要約（日本語、200文字程度）",
    "pros": ["長所1", "長所2", "長所3"],
    "cons": ["短所1", "短所2"],
    "comparable_shoes": []
  }},
  "analysis": {{
    "sentiment_score": センチメントスコア（0-100の数値）,
    "recommended_runner_level": "推奨ランナーレベル（例: Beginner, Intermediate, Advanced, All）",
    "best_for": "最適な用途（例: 毎日のトレーニング、長距離ラン、レース）"
  }}
}}

JSONのみを出力し、説明文は含めないでください。"""

# ==========================================
# ブランドリストと公式サイトドメイン
# ==========================================
BRANDS = [
    {"name": "Nike", "domain": "nike.com"},
    {"name": "Adidas", "domain": "adidas.com"},
    {"name": "ASICS", "domain": "asics.com"},
    {"name": "Saucony", "domain": "saucony.com"},
    {"name": "Brooks", "domain": "brooksrunning.com"},
    {"name": "New Balance", "domain": "newbalance.com"},
    {"name": "Mizuno", "domain": "mizuno.com"},
    {"name": "Hoka", "domain": "hoka.com"},
    {"name": "On", "domain": "on.com"},
]

# ==========================================
# 主要レビューサイトリスト
# ==========================================
REVIEW_SITES = [
    "runrepeat.com",
    "runnersworld.com",
    "believeintherun.com",
    "theruntesters.com",
    "irunfar.com",
    "roadtrailrun.com",
    "solereview.com",
    "runningwarehouse.com",
]

# ==========================================
# ブランド別の人気モデルリスト
# ==========================================
POPULAR_MODELS = {
    "Nike": ["Pegasus", "Vaporfly", "Alphafly", "ZoomX", "Invincible", "Structure", "React"],
    "Adidas": ["Ultraboost", "Adizero", "Boston", "Solarboost", "Terrex", "Takumi"],
    "ASICS": ["Gel-Nimbus", "Gel-Kayano", "Novablast", "Superblast", "Gel-Cumulus", "Metaspeed"],
    "Saucony": ["Endorphin", "Triumph", "Ride", "Kinvara", "Peregrine", "Guide"],
    "Brooks": ["Ghost", "Glycerin", "Adrenaline", "Launch", "Hyperion", "Cascadia"],
    "New Balance": ["1080", "880", "FuelCell", "Fresh Foam", "Hierro", "Rebel"],
    "Mizuno": ["Wave Rider", "Wave Sky", "Wave Inspire", "Wave Creation", "Daichi"],
    "Hoka": ["Clifton", "Bondi", "Speedgoat", "Mach", "Rincon", "Arahi"],
    "On": ["Cloudrunner", "Cloudmonster", "Cloudflow", "Cloudsurfer", "Cloudventure"],
}

# ==========================================
# 検索キーワードのバリエーション
# ==========================================
KEYWORD_VARIANTS = [
    "review",
    "test",
    "comparison",
    "best",
    "guide",
    "analysis",
    "user review",
    "detailed review",
]

# ==========================================
# 検索キーワード生成関数
# ==========================================
def generate_brand_queries(brand_name, brand_domain=None):
    """ブランド名から複数のクエリを生成（より多くのレビューを収集）"""
    queries = []
    
    # 1. 一般的なブランド検索（キーワードバリエーション）
    for keyword in ["review", "test", "best"]:
        queries.append({
            "query": f"{brand_name} running shoes {keyword}",
            "type": "review",
            "priority": "high"
        })
    
    # 2. 主要レビューサイトでの検索（各サイトで3件ずつ取得）
    for site in REVIEW_SITES[:4]:  # 上位4サイトを優先
        queries.append({
            "query": f"site:{site} {brand_name} running shoes",
            "type": "review",
            "priority": "high"
        })
    
    # 3. 人気モデル名での検索（各ブランドの上位3モデル）
    if brand_name in POPULAR_MODELS:
        for model in POPULAR_MODELS[brand_name][:3]:
            queries.append({
                "query": f"{brand_name} {model} running shoe review",
                "type": "review",
                "priority": "medium"
            })
    
    # 4. 用途別検索
    for category in ["daily trainer", "racing", "trail"]:
        queries.append({
            "query": f"{brand_name} {category} running shoes review",
            "type": "review",
            "priority": "medium"
        })
    
    return queries

def generate_all_queries():
    """全ブランドのクエリを生成"""
    all_queries = []
    for brand in BRANDS:
        brand_queries = generate_brand_queries(brand["name"], brand["domain"])
        all_queries.extend(brand_queries)
    return all_queries

# 検索クエリリスト（後方互換性のため）
SEARCH_QUERIES = generate_all_queries()

# 単一クエリで実行する場合（ループ処理をスキップしたい場合）
SINGLE_QUERY = os.getenv('SEARCH_QUERY')  # 環境変数で指定可能

# ==========================================
# 1. Google Search APIで記事を探す
# ==========================================
def search_google(query, num_results=6, site_restrict=None):
    """Google Custom Search APIを使用してURLを取得する"""
    url = "https://www.googleapis.com/customsearch/v1"
    
    # クエリにsite:が含まれている場合はそのまま使用、そうでない場合はsite_restrictを追加
    search_query = query
    if site_restrict and "site:" not in query.lower():
        search_query = f"site:{site_restrict} {query}"
    
    params = {
        'key': GOOGLE_API_KEY,
        'cx': GOOGLE_CSE_ID,
        'q': search_query,
        'num': min(num_results, 10),  # Google APIの最大値は10
        # 最近の情報を優先する場合 (例: 過去3ヶ月 = m3)
        # 'dateRestrict': 'm3' 
    }
    
    print(f"[*] Google検索を実行中: {query}...")
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        items = data.get('items', [])
        urls = [item['link'] for item in items]
        print(f"[*] {len(urls)} 件のURLが見つかりました。")
        return urls
    except requests.exceptions.HTTPError as e:
        print(f"[!] Google検索HTTPエラー: {e}")
        if e.response is not None:
            try:
                error_detail = e.response.json()
                print(f"    エラー詳細: {json.dumps(error_detail, indent=2, ensure_ascii=False)}")
            except:
                print(f"    レスポンス: {e.response.text[:500]}")
        return []
    except Exception as e:
        print(f"[!] Google検索エラー: {e}")
        return []

# ==========================================
# 2. URLから本文を抽出する (Extraction)
# ==========================================
def fetch_article_text(url, max_length=None):
    """Trafilaturaを使用してWebページから本文のみを抽出する"""
    print(f"[*] 本文抽出中: {url}")
    try:
        # download()関数でHTMLを取得
        downloaded = trafilatura.fetch_url(url)
        if downloaded is None:
            print(f"[!] HTML取得失敗: {url}")
            return None
            
        # extract()関数で本文抽出（nav, footer, ads等を自動除去）
        text = trafilatura.extract(downloaded, include_comments=False)
        
        if text and len(text) > 500: # 文字数チェック（あまりに短いものは除外）
            # テキスト長制限（Difyのトークン節約のため）
            original_length = len(text)
            if max_length and len(text) > max_length:
                text = text[:max_length]
                print(f"[*] テキストを {max_length} 文字に切り詰めました（元の長さ: {original_length} 文字）")
            return text
        else:
            print(f"[!] 本文が短すぎるか抽出できませんでした。")
            return None
    except Exception as e:
        print(f"[!] 抽出エラー: {e}")
        return None

# ==========================================
# 3-1. コードベース実装: LLM APIを直接呼び出す
# ==========================================
def estimate_tokens(text):
    """テキストのトークン数を概算（日本語は1文字≈1トークン、英語は4文字≈1トークン）"""
    # 簡易的な計算: 日本語文字数 + 英語文字数/4
    japanese_chars = len([c for c in text if ord(c) > 127])
    english_chars = len(text) - japanese_chars
    return japanese_chars + english_chars // 4

def truncate_text_by_tokens(text, max_tokens):
    """テキストをトークン数で切り詰める"""
    if estimate_tokens(text) <= max_tokens:
        return text
    
    # バイナリサーチで適切な長さを見つける
    low, high = 0, len(text)
    while low < high:
        mid = (low + high + 1) // 2
        if estimate_tokens(text[:mid]) <= max_tokens:
            low = mid
        else:
            high = mid - 1
    
    truncated = text[:low]
    print(f"[*] テキストを {max_tokens} トークンに切り詰めました（元: {estimate_tokens(text)} トークン、文字数: {len(text)} → {len(truncated)}）")
    return truncated

def process_with_openai(text, original_url):
    """OpenAI APIを使用して記事を構造化"""
    if not OPENAI_API_KEY:
        print("[!] OPENAI_API_KEYが設定されていません")
        return None
    
    try:
        # OpenAI APIをインポート（必要に応じて）
        try:
            from openai import OpenAI
        except ImportError:
            print("[!] openaiライブラリがインストールされていません。pip install openai を実行してください")
            return None
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # プロンプトを準備（トークン制限を考慮）
        # プロンプト自体のトークン数 + レスポンス用のトークンを考慮して、入力テキストを制限
        prompt_tokens = estimate_tokens(SHOE_REVIEW_PROMPT.format(url=original_url, article_text=""))
        available_tokens = MAX_TOKENS - prompt_tokens - 500  # レスポンス用に500トークン確保
        
        truncated_text = truncate_text_by_tokens(text, available_tokens)
        
        prompt = SHOE_REVIEW_PROMPT.format(url=original_url, article_text=truncated_text)
        
        print(f"[*] OpenAI APIで処理中... (モデル: {OPENAI_MODEL}, 入力トークン: {estimate_tokens(prompt)} 程度)")
        
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "あなたはランニングシューズの専門家です。JSON形式で正確に情報を抽出してください。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000,  # レスポンス用のトークン数
            response_format={"type": "json_object"}  # JSON形式を強制
        )
        
        result_text = response.choices[0].message.content
        
        # JSONをパース
        try:
            # JSONコードブロックを除去
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(1)
            else:
                # コードブロックがない場合は、最初の{から最後の}までを探す
                json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
                if json_match:
                    result_text = json_match.group(0)
            
            result = json.loads(result_text)
            
            # Difyと同じ形式に変換
            outputs = {
                "text": json.dumps(result, ensure_ascii=False, indent=2)
            }
            
            print(f"[*] OpenAI API処理成功: 使用トークン={response.usage.total_tokens} (入力: {response.usage.prompt_tokens}, 出力: {response.usage.completion_tokens})")
            return outputs
            
        except json.JSONDecodeError as e:
            print(f"[!] JSON解析エラー: {e}")
            print(f"[!] レスポンス: {result_text[:500]}")
            return None
            
    except Exception as e:
        print(f"[!] OpenAI APIエラー: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None

def process_with_claude(text, original_url):
    """Claude APIを使用して記事を構造化"""
    if not CLAUDE_API_KEY:
        print("[!] CLAUDE_API_KEYが設定されていません")
        return None
    
    try:
        import anthropic
    except ImportError:
        print("[!] anthropicライブラリがインストールされていません。pip install anthropic を実行してください")
        return None
    
    try:
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        
        # プロンプトを準備（トークン制限を考慮）
        prompt_tokens = estimate_tokens(SHOE_REVIEW_PROMPT.format(url=original_url, article_text=""))
        available_tokens = MAX_TOKENS - prompt_tokens - 500  # レスポンス用に500トークン確保
        
        truncated_text = truncate_text_by_tokens(text, available_tokens)
        
        prompt = SHOE_REVIEW_PROMPT.format(url=original_url, article_text=truncated_text)
        
        print(f"[*] Claude APIで処理中... (モデル: {CLAUDE_MODEL}, 入力トークン: {estimate_tokens(prompt)} 程度)")
        
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1000,  # レスポンス用のトークン数
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        result_text = message.content[0].text
        
        # JSONをパース
        try:
            # JSONコードブロックを除去
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(1)
            else:
                # コードブロックがない場合は、最初の{から最後の}までを探す
                json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
                if json_match:
                    result_text = json_match.group(0)
            
            result = json.loads(result_text)
            
            # Difyと同じ形式に変換
            outputs = {
                "text": json.dumps(result, ensure_ascii=False, indent=2)
            }
            
            print(f"[*] Claude API処理成功: 使用トークン={message.usage.input_tokens + message.usage.output_tokens} (入力: {message.usage.input_tokens}, 出力: {message.usage.output_tokens})")
            return outputs
            
        except json.JSONDecodeError as e:
            print(f"[!] JSON解析エラー: {e}")
            print(f"[!] レスポンス: {result_text[:500]}")
            return None
            
    except Exception as e:
        print(f"[!] Claude APIエラー: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None

def process_with_gemini(text, original_url):
    """Gemini APIを使用して記事を構造化"""
    if not GEMINI_API_KEY:
        print("[!] GEMINI_API_KEYが設定されていません")
        return None
    
    try:
        import google.generativeai as genai
    except ImportError:
        print("[!] google-generativeaiライブラリがインストールされていません。pip install google-generativeai を実行してください")
        return None
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        
        # プロンプトを準備（トークン制限を考慮）
        prompt_tokens = estimate_tokens(SHOE_REVIEW_PROMPT.format(url=original_url, article_text=""))
        available_tokens = MAX_TOKENS - prompt_tokens - 500  # レスポンス用に500トークン確保
        
        truncated_text = truncate_text_by_tokens(text, available_tokens)
        
        prompt = SHOE_REVIEW_PROMPT.format(url=original_url, article_text=truncated_text)
        
        print(f"[*] Gemini APIで処理中... (モデル: {GEMINI_MODEL}, 入力トークン: {estimate_tokens(prompt)} 程度)")
        
        # モデルを初期化
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 1000,  # レスポンス用のトークン数
                "response_mime_type": "application/json",  # JSON形式を強制
            }
        )
        
        # システムプロンプトとユーザープロンプトを組み合わせ
        full_prompt = f"""あなたはランニングシューズの専門家です。JSON形式で正確に情報を抽出してください。

{prompt}"""
        
        response = model.generate_content(full_prompt)
        
        result_text = response.text
        
        # JSONをパース
        try:
            # JSONコードブロックを除去（GeminiはJSON形式を強制しているので通常は不要だが、念のため）
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(1)
            else:
                # コードブロックがない場合は、最初の{から最後の}までを探す
                json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
                if json_match:
                    result_text = json_match.group(0)
            
            result = json.loads(result_text)
            
            # Difyと同じ形式に変換
            outputs = {
                "text": json.dumps(result, ensure_ascii=False, indent=2)
            }
            
            # トークン使用量を表示（Gemini APIのレスポンスに含まれる場合）
            if hasattr(response, 'usage_metadata'):
                usage = response.usage_metadata
                print(f"[*] Gemini API処理成功: 使用トークン={usage.prompt_token_count + usage.candidates_token_count} (入力: {usage.prompt_token_count}, 出力: {usage.candidates_token_count})")
            else:
                print(f"[*] Gemini API処理成功")
            
            return outputs
            
        except json.JSONDecodeError as e:
            print(f"[!] JSON解析エラー: {e}")
            print(f"[!] レスポンス: {result_text[:500]}")
            return None
            
    except Exception as e:
        print(f"[!] Gemini APIエラー: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None

def process_with_llm(text, original_url):
    """LLM APIを使用して記事を構造化（プロバイダーに応じて切り替え）"""
    if LLM_PROVIDER == 'openai':
        return process_with_openai(text, original_url)
    elif LLM_PROVIDER == 'claude':
        return process_with_claude(text, original_url)
    elif LLM_PROVIDER == 'gemini':
        return process_with_gemini(text, original_url)
    else:
        print(f"[!] 不明なLLMプロバイダー: {LLM_PROVIDER} (openai, claude, または gemini を指定してください)")
        return None

# ==========================================
# 3-2. Dify APIに投げて処理する
# ==========================================
def process_with_dify(text, original_url):
    """DifyのワークフローAPIを叩く"""
    if not DIFY_API_KEY:
        print("[!] DIFY_API_KEYが設定されていません")
        return None
    
    # DifyのAPIキーは常にBearerプレフィックスが必要
    headers = {
        'Authorization': f'Bearer {DIFY_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Dify側の「開始ブロック」で設定した入力変数名に合わせる（例: article_text）
    # Difyのワークフロー実行APIの形式に合わせる
    # テキストが長すぎる場合は、Difyの制限に合わせて処理
    # 注意: Difyのワークフロー設定で入力変数の文字数制限を確認してください
    
    # テキストの長さを確認（デバッグ用）
    text_length = len(text)
    print(f"[*] 送信するテキストの長さ: {text_length} 文字")
    
    payload = {
        "inputs": {
            "article_text": text,
            "source_url": original_url
        },
        "response_mode": "blocking", # 完了まで待機
        "user": "api_user"
    }
    
    # DifyのAPI URLを構築
    # Difyのワークフロー実行エンドポイントは /v1/workflows/run で、ワークフローIDをパラメータとして送信
    if DIFY_WORKFLOW_ID:
        # ワークフローIDをパラメータとして送信する形式
        url = f"{DIFY_BASE_URL}/workflows/run"
        # ワークフローIDをパラメータに追加
        payload["workflow_id"] = DIFY_WORKFLOW_ID
    else:
        # ワークフローIDがない場合はベースURLを使用（カスタムエンドポイントの場合）
        url = DIFY_BASE_URL
    
    print(f"[*] Difyで処理中... (URL: {url})")
    print(f"[*] リクエストペイロード: workflow_id={DIFY_WORKFLOW_ID}, text_length={len(text)}")
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        
        # ステータスコードを確認
        print(f"[*] レスポンスステータス: {response.status_code}")
        
        # エラーの場合は詳細を表示
        if not response.ok:
            print(f"[!] Dify API HTTPエラー: {response.status_code} {response.reason}")
            try:
                error_detail = response.json()
                print(f"[!] エラー詳細:")
                print(json.dumps(error_detail, indent=2, ensure_ascii=False))
            except:
                print(f"[!] レスポンス本文: {response.text[:500]}")
            return None
        
        response.raise_for_status()
        result = response.json()
        
        # Difyの出力形式に応じて適切に取得
        # レスポンス構造: {task_id, workflow_run_id, data: {outputs, ...}}
        outputs = None
        if 'data' in result and isinstance(result['data'], dict):
            # data.outputs に実際の出力が含まれている
            outputs = result['data'].get('outputs', {})
            # outputsが空の場合は、data全体を返す
            if not outputs or (isinstance(outputs, dict) and len(outputs) == 0):
                outputs = result['data']
        else:
            # フォールバック: レスポンス全体から出力を探す
            outputs = result.get('outputs', result)
        
        print(f"[*] Dify処理成功: 出力キー数={len(outputs) if isinstance(outputs, dict) else 'N/A'}")
        return outputs
    except requests.exceptions.Timeout:
        print(f"[!] Dify APIタイムアウト: 処理に時間がかかりすぎています")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"[!] Dify API HTTPエラー: {e}")
        if e.response is not None:
            try:
                error_detail = e.response.json()
                print(f"[!] エラー詳細:")
                print(json.dumps(error_detail, indent=2, ensure_ascii=False))
            except:
                print(f"[!] レスポンス: {e.response.text[:500]}")
        return None
    except Exception as e:
        print(f"[!] Dify APIエラー: {type(e).__name__}: {e}")
        import traceback
        print(f"[!] トレースバック:")
        traceback.print_exc()
        return None

# ==========================================
# URLキャッシュ機能
# ==========================================
def load_url_cache():
    """URLキャッシュを読み込む"""
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                cache = json.load(f)
            print(f"[*] URLキャッシュを読み込みました: {len(cache)} 件のURL")
            return cache
        except Exception as e:
            print(f"[!] キャッシュ読み込みエラー: {e}")
            return {}
    return {}

def save_url_cache(cache):
    """URLキャッシュを保存する"""
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache, f, indent=2, ensure_ascii=False, default=str)
        print(f"[*] URLキャッシュを保存しました: {len(cache)} 件のURL")
    except Exception as e:
        print(f"[!] キャッシュ保存エラー: {e}")

def is_url_cached(url, cache):
    """URLがキャッシュされているかチェック"""
    return url in cache

def add_to_cache(url, result, cache):
    """URLと結果をキャッシュに追加"""
    cache[url] = {
        'analysis': result,
        'cached_at': time.strftime("%Y-%m-%d %H:%M:%S")
    }

# ==========================================
# メイン処理
# ==========================================
def validate_env():
    """環境変数の検証"""
    errors = []
    if not GOOGLE_API_KEY:
        errors.append("GOOGLE_SEARCH_API_KEYが設定されていません")
    if not GOOGLE_CSE_ID:
        errors.append("GOOGLE_SEARCH_ENGINE_IDが設定されていません")
    
    # DifyまたはLLM APIのどちらかが必要
    if USE_DIFY:
        if not DIFY_API_KEY:
            errors.append("USE_DIFY=trueの場合、DIFY_API_KEYが設定されていません")
    else:
        if LLM_PROVIDER == 'openai' and not OPENAI_API_KEY:
            errors.append("LLM_PROVIDER=openaiの場合、OPENAI_API_KEYが設定されていません")
        elif LLM_PROVIDER == 'claude' and not CLAUDE_API_KEY:
            errors.append("LLM_PROVIDER=claudeの場合、CLAUDE_API_KEYが設定されていません")
        elif LLM_PROVIDER == 'gemini' and not GEMINI_API_KEY:
            errors.append("LLM_PROVIDER=geminiの場合、GEMINI_API_KEYが設定されていません")
    
    if errors:
        print("[!] 環境変数の設定エラー:")
        for error in errors:
            print(f"    - {error}")
        return False
    return True

def save_results(results, filename="results.json", query=None):
    """結果をJSONファイルに保存"""
    try:
        # クエリごとにファイル名を変更
        if query:
            # クエリをファイル名に使用できる形式に変換
            safe_query = "".join(c for c in query if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_query = safe_query.replace(' ', '_')[:50]  # ファイル名として安全な形式に
            filename = f"results_{safe_query}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
        print(f"[*] 結果を {filename} に保存しました")
        return filename
    except Exception as e:
        print(f"[!] 結果の保存に失敗: {e}")
        return None

def extract_shoe_info_from_analysis(analysis):
    """analysisオブジェクトから靴の情報を抽出する"""
    try:
        if not analysis or not isinstance(analysis, dict):
            return None
        
        # analysis.textからJSONを抽出
        text = analysis.get('text', '')
        if not text:
            return None
        
        # JSONコードブロックからJSONを抽出
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # コードブロックがない場合は、最初の{から最後の}までを探す
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                return None
        
        # JSONをパース
        parsed = json.loads(json_str)
        
        # 靴の識別情報を取得
        product_info = parsed.get('product_info', {})
        brand_name = product_info.get('brand_name', 'Unknown')
        model_name = product_info.get('model_name', 'Unknown')
        
        # ブランド名とモデル名の組み合わせでキーを生成
        shoe_key = f"{brand_name}_{model_name}".strip()
        
        return {
            'shoe_key': shoe_key,
            'brand_name': brand_name,
            'model_name': model_name,
            'category': product_info.get('category', ''),
            'release_year': product_info.get('release_year'),
            'price_usd': product_info.get('price_usd'),
            'specs': parsed.get('specs', {}),
            'review_content': parsed.get('review_content', {}),
            'analysis': parsed.get('analysis', {}),
            'raw_data': parsed
        }
    except json.JSONDecodeError as e:
        print(f"[!] JSON解析エラー: {e}")
        return None
    except Exception as e:
        print(f"[!] 靴情報抽出エラー: {e}")
        return None

def group_reviews_by_shoe(results):
    """同じ靴のレビューをグループ化する"""
    grouped = defaultdict(list)
    
    for result in results:
        shoe_info = extract_shoe_info_from_analysis(result.get('analysis'))
        if shoe_info:
            shoe_key = shoe_info['shoe_key']
            grouped[shoe_key].append({
                'shoe_info': shoe_info,
                'url': result.get('url'),
                'query': result.get('query'),
                'article_length': result.get('article_length'),
                'processed_at': result.get('processed_at')
            })
        else:
            # 靴情報が抽出できない場合は、URLベースでグループ化
            url = result.get('url', 'unknown')
            grouped[f"unknown_{url[:30]}"].append({
                'shoe_info': None,
                'url': url,
                'query': result.get('query'),
                'article_length': result.get('article_length'),
                'processed_at': result.get('processed_at')
            })
    
    return grouped

def save_to_csv(grouped_reviews, filename="reviews_grouped.csv"):
    """グループ化されたレビューをCSVファイルに保存"""
    try:
        rows = []
        
        for shoe_key, reviews in grouped_reviews.items():
            if not reviews or not reviews[0].get('shoe_info'):
                # 靴情報が取得できない場合はスキップ
                continue
            
            shoe_info = reviews[0]['shoe_info']
            review_content = shoe_info.get('review_content', {})
            analysis = shoe_info.get('analysis', {})
            specs = shoe_info.get('specs', {})
            
            # 複数のレビューを統合
            urls = [r['url'] for r in reviews]
            queries = list(set([r['query'] for r in reviews]))
            summaries = []
            all_pros = []
            all_cons = []
            sentiment_scores = []
            
            for review in reviews:
                review_data = review.get('shoe_info', {}).get('review_content', {})
                if review_data.get('summary_ja'):
                    summaries.append(review_data['summary_ja'])
                if review_data.get('pros'):
                    all_pros.extend(review_data['pros'])
                if review_data.get('cons'):
                    all_cons.extend(review_data['cons'])
                
                analysis_data = review.get('shoe_info', {}).get('analysis', {})
                if analysis_data.get('sentiment_score'):
                    sentiment_scores.append(analysis_data['sentiment_score'])
            
            # 重複を除去
            unique_pros = list(set(all_pros))
            unique_cons = list(set(all_cons))
            
            # 平均センチメントスコアを計算
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else None
            
            row = {
                'brand_name': shoe_info.get('brand_name', ''),
                'model_name': shoe_info.get('model_name', ''),
                'category': shoe_info.get('category', ''),
                'release_year': shoe_info.get('release_year') or '',
                'price_usd': shoe_info.get('price_usd') or '',
                'weight_g': specs.get('weight_g') or '',
                'drop_mm': specs.get('drop_mm') or '',
                'stack_height_heel_mm': specs.get('stack_height_heel_mm') or '',
                'stack_height_forefoot_mm': specs.get('stack_height_forefoot_mm') or '',
                'review_count': len(reviews),
                'urls': '; '.join(urls),
                'queries': '; '.join(queries),
                'summary': ' | '.join(summaries[:3]),  # 最初の3つの要約のみ
                'pros': ' | '.join(unique_pros[:10]),  # 最初の10個の長所のみ
                'cons': ' | '.join(unique_cons[:10]),  # 最初の10個の短所のみ
                'sentiment_score': round(avg_sentiment, 2) if avg_sentiment else '',
                'recommended_runner_level': analysis.get('recommended_runner_level', ''),
                'best_for': analysis.get('best_for', ''),
                'processed_at': reviews[0].get('processed_at', '')
            }
            rows.append(row)
        
        # CSVファイルに書き込み
        if rows:
            fieldnames = [
                'brand_name', 'model_name', 'category', 'release_year', 'price_usd',
                'weight_g', 'drop_mm', 'stack_height_heel_mm', 'stack_height_forefoot_mm',
                'review_count', 'urls', 'queries', 'summary', 'pros', 'cons',
                'sentiment_score', 'recommended_runner_level', 'best_for', 'processed_at'
            ]
            
            with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
            
            print(f"[*] CSVファイルに保存しました: {filename} ({len(rows)} 件の靴)")
            return filename
        else:
            print(f"[!] CSVに出力するデータがありませんでした")
            return None
            
    except Exception as e:
        print(f"[!] CSV保存エラー: {e}")
        import traceback
        traceback.print_exc()
        return None

def process_query(query_dict, num_results=6, url_cache=None):
    """単一のクエリを処理する（クエリ辞書または文字列を受け取る）"""
    # 後方互換性: 文字列が渡された場合は辞書に変換
    if isinstance(query_dict, str):
        query = query_dict
        query_type = "review"
        priority = "medium"
    else:
        query = query_dict.get("query", "")
        query_type = query_dict.get("type", "review")
        priority = query_dict.get("priority", "medium")
    
    # 優先度に応じて取得数を調整
    if priority == "high":
        results_count = num_results
    elif priority == "medium":
        results_count = max(3, num_results // 2)
    else:
        results_count = 3
    
    print(f"\n{'='*60}")
    print(f"検索クエリ: {query}")
    print(f"クエリタイプ: {query_type}")
    print(f"優先度: {priority} (取得数: {results_count})")
    print(f"{'='*60}\n")
    
    # 1. 検索（優先度に応じた件数取得）
    target_urls = search_google(query, num_results=results_count)
    
    if not target_urls:
        print(f"[!] 検索結果が見つかりませんでした: {query}")
        return []
    
    results = []
    cache = url_cache or {}
    skipped_count = 0
    
    # 2. 各URLに対して処理
    for idx, url in enumerate(target_urls, 1):
        print(f"\n[{idx}/{len(target_urls)}] 処理中: {url}")
        
        # キャッシュチェック
        if is_url_cached(url, cache):
            print(f"[*] キャッシュから取得: {url}")
            cached_result = cache[url]
            results.append({
                "query": query,
                "query_type": query_type,
                "url": url,
                "article_length": 0,  # キャッシュから取得した場合は不明
                "analysis": cached_result.get('analysis'),
                "processed_at": cached_result.get('cached_at', time.strftime("%Y-%m-%d %H:%M:%S")),
                "from_cache": True
            })
            skipped_count += 1
            continue
        
        # サーバー負荷軽減のための待機
        time.sleep(2) 
        
        # 本文抽出
        # Dify用: 文字数制限（MAX_TEXT_LENGTH）
        # LLM API用: トークン制限は後で適用
        max_length = MAX_TEXT_LENGTH if USE_DIFY else None
        article_text = fetch_article_text(url, max_length=max_length)
        
        # Dify用でもトークン数を考慮して切り詰める（オプション）
        if article_text and USE_DIFY:
            # Difyでもトークン数を概算して表示（参考用）
            estimated_tokens = estimate_tokens(article_text)
            if estimated_tokens > MAX_TOKENS:
                print(f"[*] 警告: テキストの推定トークン数({estimated_tokens})が制限({MAX_TOKENS})を超えています")
        
        if article_text:
            print(f"[*] 本文抽出成功 ({len(article_text)} 文字)")
            # 3. DifyまたはLLM APIで要約・構造化
            if USE_DIFY:
                output = process_with_dify(article_text, url)
                service_name = "Dify"
            else:
                output = process_with_llm(article_text, url)
                service_name = f"{LLM_PROVIDER.upper()} API"
            
            if output:
                # キャッシュに追加
                add_to_cache(url, output, cache)
                
                results.append({
                    "query": query,
                    "query_type": query_type,
                    "url": url,
                    "article_length": len(article_text),
                    "analysis": output,
                    "processed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "from_cache": False,
                    "service": service_name
                })
                print(f"[Success] 処理完了: {url} ({service_name})\n")
            else:
                print(f"[!] {service_name}処理に失敗: {url}")
        else:
            print(f"[!] 本文抽出に失敗: {url}")
    
    if skipped_count > 0:
        print(f"[*] {skipped_count} 件のURLをキャッシュから取得しました（Dify API呼び出しをスキップ）")
    
    return results

def main():
    # 環境変数の検証
    if not validate_env():
        print("\n[!] 環境変数を設定してから実行してください")
        return
    
    print("=" * 60)
    print("スクレイピング & LLM構造化スクリプト")
    print("=" * 60)
    if USE_DIFY:
        print(f"処理方法: Dify API")
        print(f"Dify Base URL: {DIFY_BASE_URL}")
        if DIFY_WORKFLOW_ID:
            print(f"Dify Workflow ID: {DIFY_WORKFLOW_ID}")
    else:
        print(f"処理方法: {LLM_PROVIDER.upper()} API (コードベース実装)")
        if LLM_PROVIDER == 'openai':
            print(f"モデル: {OPENAI_MODEL}")
            print(f"最大トークン数: {MAX_TOKENS}")
        elif LLM_PROVIDER == 'claude':
            print(f"モデル: {CLAUDE_MODEL}")
            print(f"最大トークン数: {MAX_TOKENS}")
        elif LLM_PROVIDER == 'gemini':
            print(f"モデル: {GEMINI_MODEL}")
            print(f"最大トークン数: {MAX_TOKENS}")
    print("=" * 60)
    
    # 検索クエリの決定
    if SINGLE_QUERY:
        # 環境変数で指定された単一クエリを使用
        queries = [{"query": SINGLE_QUERY, "type": "review"}]
        print(f"\n単一クエリモード: {SINGLE_QUERY}")
    else:
        # ブランドごとにクエリを生成
        queries = generate_all_queries()
        print(f"\nブランド別ループ処理モード: {len(BRANDS)} ブランド、合計 {len(queries)} 件のクエリを処理します")
        print(f"  検索戦略:")
        print(f"    - 一般的なキーワード検索（review, test, best）")
        print(f"    - 主要レビューサイトでの検索（4サイト）")
        print(f"    - 人気モデル名での検索（各ブランド上位3モデル）")
        print(f"    - 用途別検索（daily trainer, racing, trail）")
        print(f"  優先度: high=6件, medium=3件")
    
    # URLキャッシュを読み込む
    url_cache = load_url_cache()
    
    # 各クエリごとの結果を保存
    all_results = []
    query_results = {}
    brand_results = {}
    
    # ブランドごとに処理
    current_brand = None
    brand_query_count = 0
    
    # 各クエリを処理
    for query_idx, query_dict in enumerate(queries, 1):
        query = query_dict.get("query", "") if isinstance(query_dict, dict) else query_dict
        query_type = query_dict.get("type", "review") if isinstance(query_dict, dict) else "review"
        
        # ブランド名を抽出（クエリから）
        brand_name = None
        for brand in BRANDS:
            if brand["name"].lower() in query.lower():
                brand_name = brand["name"]
                break
        
        # ブランドが変わった場合の処理
        if brand_name != current_brand:
            if current_brand is not None:
                print(f"\n[*] {current_brand} の処理完了: {brand_query_count} 件のクエリを処理しました")
                print(f"[*] 次のブランドまで10秒待機中...")
                time.sleep(10)
            current_brand = brand_name
            brand_query_count = 0
            if brand_name:
                brand_results[brand_name] = []
        
        brand_query_count += 1
        
        print(f"\n{'#'*60}")
        print(f"ブランド: {brand_name or 'Unknown'}")
        print(f"クエリ {query_idx}/{len(queries)}: {query}")
        print(f"タイプ: {query_type}")
        print(f"{'#'*60}")
        
        # クエリを処理（優先度に応じた件数取得、キャッシュ付き）
        results = process_query(query_dict, num_results=6, url_cache=url_cache)
        
        if results:
            query_results[query] = results
            all_results.extend(results)
            if brand_name:
                brand_results[brand_name].extend(results)
            
            # クエリごとに結果を保存
            safe_query = "".join(c for c in query if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_query = safe_query.replace(' ', '_')[:50]
            save_results(results, query=safe_query)
        
        # クエリ間の待機（API制限対策）
        if query_idx < len(queries):
            print(f"\n[*] 次のクエリまで5秒待機中...")
            time.sleep(5)
        
        # 定期的にキャッシュを保存（10クエリごと）
        if query_idx % 10 == 0:
            save_url_cache(url_cache)
    
    # 全結果を統合して保存
    if all_results:
        print(f"\n{'='*60}")
        print(f"全クエリ処理完了: 合計 {len(all_results)} 件の記事を処理しました")
        print(f"{'='*60}")
        
        # 統合結果を保存
        save_results(all_results, filename="results_all.json")
        
        # ブランドごとのサマリー
        print(f"\nブランドごとの処理結果:")
        for brand_name, results in brand_results.items():
            review_count = len([r for r in results if r.get('query_type') == 'review'])
            official_count = len([r for r in results if r.get('query_type') == 'official'])
            print(f"  - {brand_name}: 合計 {len(results)} 件 (個人レビュー: {review_count}件, 公式サイト: {official_count}件)")
        
        # クエリごとのサマリー（最初の10件のみ）
        print(f"\nクエリごとの処理結果（最初の10件）:")
        for idx, (query, results) in enumerate(list(query_results.items())[:10], 1):
            print(f"  {idx}. {query}: {len(results)} 件")
        if len(query_results) > 10:
            print(f"  ... 他 {len(query_results) - 10} 件のクエリ")
        
        # 全体のサマリー
        print(f"\n処理結果のサマリー:")
        for idx, result in enumerate(all_results[:10], 1):  # 最初の10件を表示
            print(f"  {idx}. [{result.get('query', 'N/A')}] {result['url']}")
            print(f"     文字数: {result['article_length']}")
            print(f"     処理日時: {result['processed_at']}")
        
        if len(all_results) > 10:
            print(f"  ... 他 {len(all_results) - 10} 件")
        
        # 同じ靴のレビューをグループ化
        print(f"\n{'='*60}")
        print(f"レビューを靴ごとにグループ化中...")
        print(f"{'='*60}")
        grouped_reviews = group_reviews_by_shoe(all_results)
        
        print(f"\nグループ化結果:")
        print(f"  合計 {len(grouped_reviews)} 種類の靴が見つかりました")
        for shoe_key, reviews in list(grouped_reviews.items())[:10]:
            shoe_info = reviews[0].get('shoe_info')
            if shoe_info:
                print(f"  - {shoe_info.get('brand_name', 'Unknown')} {shoe_info.get('model_name', 'Unknown')}: {len(reviews)} 件のレビュー")
            else:
                print(f"  - {shoe_key}: {len(reviews)} 件のレビュー")
        
        if len(grouped_reviews) > 10:
            print(f"  ... 他 {len(grouped_reviews) - 10} 種類")
        
        # CSVファイルに保存
        print(f"\n{'='*60}")
        print(f"CSVファイルに出力中...")
        print(f"{'='*60}")
        csv_filename = save_to_csv(grouped_reviews, filename="reviews_grouped.csv")
        
        if csv_filename:
            print(f"\n[Success] CSVファイルの出力が完了しました: {csv_filename}")
        
        # 最終的なキャッシュを保存
        save_url_cache(url_cache)
        
        # キャッシュ統計を表示
        cached_urls = sum(1 for r in all_results if r.get('from_cache', False))
        new_urls = len(all_results) - cached_urls
        print(f"\n{'='*60}")
        print(f"キャッシュ統計:")
        print(f"  新規処理: {new_urls} 件")
        print(f"  キャッシュから取得: {cached_urls} 件")
        print(f"  トークン節約率: {cached_urls / len(all_results) * 100:.1f}%" if all_results else "0%")
        print(f"{'='*60}")
    else:
        print(f"\n[!] 処理できた記事がありませんでした")
        # キャッシュを保存（エラー時も）
        save_url_cache(url_cache)

if __name__ == "__main__":
    main()