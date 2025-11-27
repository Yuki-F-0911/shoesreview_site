"""
YouTube動画自動要約プログラム
YouTube上のレビュー動画を自動で文字起こしし、要約を生成するプログラム

必要なライブラリ:
    pip install yt-dlp openai-whisper google-generativeai ffmpeg-python python-dotenv

環境変数:
    GEMINI_API_KEY: Google Gemini APIキー
    
    設定方法:
    1. PowerShellで一時的に設定: $env:GEMINI_API_KEY="your-api-key"
    2. .envファイルに記述: GEMINI_API_KEY=your-api-key
    3. Windowsシステム環境変数として設定
"""

import os
import json
import tempfile
import shutil
from pathlib import Path
from typing import Optional, Dict, List
import yt_dlp
import whisper
import google.generativeai as genai

# .envファイルから環境変数を読み込む（オプション）
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenvがインストールされていない場合はスキップ
    pass


class YouTubeSummarizer:
    """YouTube動画を要約するクラス"""
    
    def __init__(self, gemini_api_key: str, whisper_model: str = "base", gemini_model: str = "gemini-pro"):
        """
        Args:
            gemini_api_key: Google Gemini APIキー
            whisper_model: Whisperモデルサイズ (tiny, base, small, medium, large)
            gemini_model: Geminiモデル名 (gemini-pro, gemini-pro-vision等)
        """
        genai.configure(api_key=gemini_api_key)
        self.gemini_model = genai.GenerativeModel(gemini_model)
        self.whisper_model = whisper.load_model(whisper_model)
        self.temp_dir = None
        
    def download_audio(self, video_url: str) -> str:
        """
        YouTube動画から音声をダウンロード
        
        Args:
            video_url: YouTube動画のURL
            
        Returns:
            音声ファイルのパス
        """
        # 一時ディレクトリを作成
        self.temp_dir = tempfile.mkdtemp()
        audio_path = os.path.join(self.temp_dir, "audio.mp3")
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': audio_path.replace('.mp3', '.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # 動画情報も取得
                info = ydl.extract_info(video_url, download=True)
                video_title = info.get('title', '')
                channel_name = info.get('uploader', '')
                video_id = info.get('id', '')
                
                # 実際のファイル名を取得
                downloaded_file = audio_path.replace('.mp3', '.mp3')
                if not os.path.exists(downloaded_file):
                    # 拡張子が異なる可能性がある
                    for ext in ['.mp3', '.m4a', '.webm']:
                        candidate = audio_path.replace('.mp3', ext)
                        if os.path.exists(candidate):
                            downloaded_file = candidate
                            break
                
                return downloaded_file, {
                    'title': video_title,
                    'channel': channel_name,
                    'video_id': video_id,
                    'url': video_url
                }
        except Exception as e:
            raise Exception(f"動画のダウンロードに失敗しました: {str(e)}")
    
    def transcribe_audio(self, audio_path: str, language: Optional[str] = None, translate_to_japanese: bool = True) -> Dict:
        """
        音声ファイルを文字起こし（必要に応じて日本語に翻訳）
        
        Args:
            audio_path: 音声ファイルのパス
            language: 元の言語コード（Noneの場合は自動検出）
            translate_to_japanese: Trueの場合、日本語に翻訳
            
        Returns:
            文字起こし結果の辞書
        """
        try:
            if translate_to_japanese:
                # 英語→日本語翻訳
                result = self.whisper_model.transcribe(
                    audio_path,
                    language=language or "en",
                    task="translate"  # 翻訳タスク
                )
            else:
                # 文字起こしのみ
                result = self.whisper_model.transcribe(
                    audio_path,
                    language=language
                )
            
            return {
                'text': result['text'],
                'language': result.get('language', 'unknown'),
                'segments': result.get('segments', [])
            }
        except Exception as e:
            raise Exception(f"文字起こしに失敗しました: {str(e)}")
    
    def summarize_text(self, text: str, shoe_brand: Optional[str] = None, shoe_model: Optional[str] = None) -> Dict:
        """
        テキストを要約（シューズレビュー用のフォーマット）
        
        Args:
            text: 要約するテキスト
            shoe_brand: シューズのブランド名（オプション）
            shoe_model: シューズのモデル名（オプション）
            
        Returns:
            要約結果の辞書
        """
        # プロンプトの構築
        context = ""
        if shoe_brand and shoe_model:
            context = f"以下のテキストは「{shoe_brand} {shoe_model}」というシューズのレビュー動画の文字起こしです。\n\n"
        
        prompt = f"""あなたはシューズレビューを要約する専門家です。与えられたテキストから重要な情報を抽出し、構造化された要約を作成してください。

{context}以下のテキストを、シューズレビューとして要約してください。

要約は以下のフォーマットでJSON形式で出力してください：
{{
    "title": "レビューのタイトル（50文字以内）",
    "overall_rating": 1-5の数値（総合評価）,
    "pros": ["良い点1", "良い点2", "良い点3"],
    "cons": ["悪い点1", "悪い点2"],
    "recommended_for": "推奨ランナータイプ（例: 初心者向け、マラソンランナー向け、スピード重視のランナー向けなど）",
    "summary": "レビューの要約文（200-300文字）"
}}

テキスト:
{text}
"""
        
        try:
            # Gemini APIを使用して要約を生成
            response = self.gemini_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1000,
                )
            )
            
            summary_text = response.text.strip()
            
            # JSON形式でパースを試みる
            try:
                # JSONコードブロックを除去
                if summary_text.startswith("```json"):
                    summary_text = summary_text[7:]
                if summary_text.startswith("```"):
                    summary_text = summary_text[3:]
                if summary_text.endswith("```"):
                    summary_text = summary_text[:-3]
                summary_text = summary_text.strip()
                
                summary_dict = json.loads(summary_text)
                return summary_dict
            except json.JSONDecodeError:
                # JSONパースに失敗した場合、テキストをそのまま返す
                return {
                    "title": "レビュー要約",
                    "overall_rating": 3,
                    "pros": [],
                    "cons": [],
                    "recommended_for": "不明",
                    "summary": summary_text
                }
        except Exception as e:
            raise Exception(f"要約生成に失敗しました: {str(e)}")
    
    def process_video(self, video_url: str, shoe_brand: Optional[str] = None, shoe_model: Optional[str] = None, translate_to_japanese: bool = True) -> Dict:
        """
        YouTube動画を処理して要約を生成（一連の処理を実行）
        
        Args:
            video_url: YouTube動画のURL
            shoe_brand: シューズのブランド名（オプション）
            shoe_model: シューズのモデル名（オプション）
            translate_to_japanese: Trueの場合、日本語に翻訳
            
        Returns:
            処理結果の辞書
        """
        try:
            # 1. 音声ダウンロード
            print(f"動画をダウンロード中: {video_url}")
            audio_path, video_info = self.download_audio(video_url)
            print(f"ダウンロード完了: {video_info['title']}")
            
            # 2. 文字起こし
            print("文字起こし中...")
            transcription = self.transcribe_audio(audio_path, translate_to_japanese=translate_to_japanese)
            print(f"文字起こし完了（言語: {transcription['language']}）")
            
            # 3. 要約生成
            print("要約生成中...")
            summary = self.summarize_text(transcription['text'], shoe_brand, shoe_model)
            print("要約生成完了")
            
            # 結果をまとめる
            result = {
                'video_info': video_info,
                'transcription': transcription,
                'summary': summary
            }
            
            return result
            
        except Exception as e:
            raise Exception(f"処理に失敗しました: {str(e)}")
        finally:
            # 一時ファイルを削除
            self.cleanup()
    
    def cleanup(self):
        """一時ファイルを削除"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            self.temp_dir = None


def main():
    """メイン関数（使用例）"""
    # 環境変数からAPIキーを取得
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        print("エラー: GEMINI_API_KEY環境変数が設定されていません")
        return
    
    # YouTubeSummarizerのインスタンスを作成
    summarizer = YouTubeSummarizer(gemini_api_key, whisper_model="base")
    
    # 使用例
    video_url = input("YouTube動画のURLを入力してください: ")
    shoe_brand = input("シューズのブランド名（オプション）: ").strip() or None
    shoe_model = input("シューズのモデル名（オプション）: ").strip() or None
    
    try:
        result = summarizer.process_video(
            video_url,
            shoe_brand=shoe_brand,
            shoe_model=shoe_model,
            translate_to_japanese=True
        )
        
        # 結果を表示
        print("\n" + "="*50)
        print("処理結果")
        print("="*50)
        print(f"\n動画タイトル: {result['video_info']['title']}")
        print(f"チャンネル: {result['video_info']['channel']}")
        print(f"\n要約タイトル: {result['summary']['title']}")
        print(f"総合評価: {result['summary']['overall_rating']}/5")
        print(f"\n良い点:")
        for pro in result['summary']['pros']:
            print(f"  - {pro}")
        print(f"\n悪い点:")
        for con in result['summary']['cons']:
            print(f"  - {con}")
        print(f"\n推奨ランナー: {result['summary']['recommended_for']}")
        print(f"\n要約文:\n{result['summary']['summary']}")
        
        # JSONファイルに保存（オプション）
        output_file = "summary_result.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\n結果を {output_file} に保存しました")
        
    except Exception as e:
        print(f"エラー: {str(e)}")
    finally:
        summarizer.cleanup()


if __name__ == "__main__":
    main()

