"""
既存のJSONファイルを統合してCSVにまとめ、重複を削除するスクリプト
"""
import json
import csv
import re
from pathlib import Path
from collections import defaultdict

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
        return None
    except Exception as e:
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

def save_to_csv(grouped_reviews, filename="reviews_consolidated.csv"):
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

def load_all_json_files(directory="."):
    """ディレクトリ内のすべてのresults_*.jsonファイルを読み込む"""
    directory_path = Path(directory)
    all_results = []
    processed_urls = set()  # 重複チェック用
    
    # results_*.jsonファイルを検索
    json_files = list(directory_path.glob("results_*.json"))
    
    print(f"[*] {len(json_files)} 件のJSONファイルが見つかりました")
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            if isinstance(data, list):
                for item in data:
                    url = item.get('url', '')
                    # 重複チェック（URLベース）
                    if url and url not in processed_urls:
                        all_results.append(item)
                        processed_urls.add(url)
                    elif url:
                        print(f"[*] 重複をスキップ: {url}")
            elif isinstance(data, dict):
                # 単一の結果の場合
                url = data.get('url', '')
                if url and url not in processed_urls:
                    all_results.append(data)
                    processed_urls.add(url)
                    
        except Exception as e:
            print(f"[!] {json_file} の読み込みエラー: {e}")
    
    print(f"[*] 合計 {len(all_results)} 件のレビューを収集しました（重複除外後）")
    return all_results

def filter_valid_results(results):
    """有効な結果のみをフィルタリング（analysisが存在し、エラーでないもの）"""
    valid_results = []
    
    for result in results:
        analysis = result.get('analysis')
        
        # analysisが存在しない場合はスキップ
        if not analysis:
            continue
        
        # Difyのエラーレスポンスをチェック
        if isinstance(analysis, dict):
            # statusがfailedの場合はスキップ
            if analysis.get('status') == 'failed':
                continue
            # errorフィールドがある場合はスキップ
            if 'error' in analysis:
                continue
            # outputsが空の場合はスキップ
            if 'outputs' in analysis and not analysis.get('outputs'):
                continue
        
        # textフィールドが空の場合はスキップ
        if isinstance(analysis, dict) and analysis.get('text') == '':
            continue
        
        valid_results.append(result)
    
    print(f"[*] 有効なレビュー: {len(valid_results)} 件（全 {len(results)} 件中）")
    return valid_results

def main():
    print("=" * 60)
    print("JSONファイル統合 & CSV出力スクリプト")
    print("=" * 60)
    
    # 1. すべてのJSONファイルを読み込む
    print("\n[*] JSONファイルを読み込み中...")
    all_results = load_all_json_files(".")
    
    if not all_results:
        print("[!] 処理するデータがありませんでした")
        return
    
    # 2. 有効な結果のみをフィルタリング
    print("\n[*] 有効な結果をフィルタリング中...")
    valid_results = filter_valid_results(all_results)
    
    if not valid_results:
        print("[!] 有効なレビューがありませんでした")
        return
    
    # 3. 靴ごとにグループ化
    print("\n[*] レビューを靴ごとにグループ化中...")
    grouped_reviews = group_reviews_by_shoe(valid_results)
    
    print(f"\n[*] グループ化結果:")
    print(f"  合計 {len(grouped_reviews)} 種類の靴が見つかりました")
    for shoe_key, reviews in list(grouped_reviews.items())[:10]:
        shoe_info = reviews[0].get('shoe_info')
        if shoe_info:
            print(f"  - {shoe_info.get('brand_name', 'Unknown')} {shoe_info.get('model_name', 'Unknown')}: {len(reviews)} 件のレビュー")
        else:
            print(f"  - {shoe_key}: {len(reviews)} 件のレビュー")
    
    if len(grouped_reviews) > 10:
        print(f"  ... 他 {len(grouped_reviews) - 10} 種類")
    
    # 4. CSVファイルに保存
    print("\n[*] CSVファイルに出力中...")
    csv_filename = save_to_csv(grouped_reviews, filename="reviews_consolidated.csv")
    
    if csv_filename:
        print(f"\n[Success] CSVファイルの出力が完了しました: {csv_filename}")
        
        # 5. 元のJSONファイルをバックアップフォルダに移動（削除ではなく）
        print("\n[*] 元のJSONファイルをバックアップフォルダに移動しますか？")
        print("    （手動で削除する場合は、backup/ フォルダを確認してください）")
        
        backup_dir = Path("backup")
        backup_dir.mkdir(exist_ok=True)
        
        json_files = list(Path(".").glob("results_*.json"))
        moved_count = 0
        
        for json_file in json_files:
            if json_file.name != "results_all.json":  # results_all.jsonは残す
                try:
                    backup_path = backup_dir / json_file.name
                    json_file.rename(backup_path)
                    moved_count += 1
                except Exception as e:
                    print(f"[!] {json_file.name} の移動に失敗: {e}")
        
        if moved_count > 0:
            print(f"[*] {moved_count} 件のJSONファイルを backup/ フォルダに移動しました")
    else:
        print("\n[!] CSVファイルの出力に失敗しました")

if __name__ == "__main__":
    main()

