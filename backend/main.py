# backend/main.py

import os
import uuid
import openai
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

# Excel or DB操作
import openpyxl

# LINE API使う場合（通知機能）
try:
    from linebot import LineBotApi
    from linebot.models import TextSendMessage
except ImportError:
    LineBotApi = None  # 必要に応じてインストールされていない場合のエラー回避
    TextSendMessage = None

load_dotenv()

app = FastAPI()

# CORS設定
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# OpenAI APIキー
openai.api_key = os.getenv("OPENAI_API_KEY")

# LINE通知用
LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN) if LINE_CHANNEL_ACCESS_TOKEN else None

# Excelファイルのパス設定
EXCEL_FILE = "data.xlsx"

# Excelファイルがなければ作成
if not os.path.exists(EXCEL_FILE):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Data"
    # ヘッダー行
    ws.append(["ID", "担当者", "発注数", "文字起こし結果", "要約", "通知ステータス"])
    wb.save(EXCEL_FILE)

@app.post("/api/upload")
async def upload_audio(file: UploadFile = File(...)):
    # ファイルID生成
    file_id = str(uuid.uuid4())
    if not os.path.exists("uploaded_files"):
        os.mkdir("uploaded_files")
    file_path = os.path.join("uploaded_files", f"{file_id}.webm")

    # ファイルを保存
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"ファイル保存に失敗: {str(e)}"})

    # Whisper APIで文字起こし
    try:
        with open(file_path, "rb") as audio_file:
            transcript = openai.Audio.transcribe("whisper-1", audio_file)
        transcript_text = transcript["text"]
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"文字起こしに失敗: {str(e)}"})

    # 要約 (GPT-3.5 / GPT-4 など)
    try:
        prompt = f"以下の文章を簡潔に要約してください:\n{transcript_text}"
        summary_response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=100,
            temperature=0.7
        )
        summary_text = summary_response["choices"][0]["text"].strip()
    except Exception as e:
        summary_text = "要約に失敗しました。"

    # Excelにデータを書き込み
    wb = openpyxl.load_workbook(EXCEL_FILE)
    ws = wb.active
    new_id = str(uuid.uuid4())[:8]

    # 例: 担当者Aさんと発注数10を仮定
    # 実運用ではLLMや正規表現で抽出、あるいはフロントエンドから入力してもらう
    担当者 = "Aさん"
    発注数 = 10

    ws.append([new_id, 担当者, 発注数, transcript_text, summary_text, "未通知"])
    wb.save(EXCEL_FILE)

    # LINE 通知（例）
    if line_bot_api is not None:
        try:
            message_text = f"担当者: {担当者}\n発注数: {発注数}\n要約: {summary_text}"
            # 実際には担当者別に user_id を管理しておく
            dummy_user_id = "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            line_bot_api.push_message(dummy_user_id, TextSendMessage(text=message_text))
            
            # 通知ステータス更新
            last_row = ws.max_row
            ws.cell(row=last_row, column=6).value = "通知済"
            wb.save(EXCEL_FILE)

        except Exception as e:
            print("LINE通知に失敗:", e)

    # フロントに結果を返却
    return {
        "file_id": file_id,
        "transcript": transcript_text,
        "summary": summary_text
    }


@app.get("/api/data")
def get_data():
    # Excelからデータを取得して返す例
    wb = openpyxl.load_workbook(EXCEL_FILE)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return {"data": []}
    header = rows[0]
    data_rows = rows[1:]

    data_list = []
    for row in data_rows:
        row_dict = {}
        for i, cell in enumerate(row):
            row_dict[header[i]] = cell
        data_list.append(row_dict)

    return {"data": data_list}