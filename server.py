import subprocess
import numpy as np 
import soundfile as sf
import time
import os
import atexit
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import torch
import uvicorn
import base64
import io

import scipy.io.wavfile as wavfile
from transformers import VitsModel, AutoTokenizer as VitsTokenizer
from pydantic import BaseModel
from kokoro import KPipeline

pipeline = KPipeline(lang_code='z', repo_id='hexgrad/Kokoro-82M-v1.1-zh')

LLAMA_CPP_PATH = "/home/kawhi/llama.cpp"
# 定義執行檔的絕對路徑
LLAMA_SERVER_BIN = os.path.join(LLAMA_CPP_PATH, "build/bin/llama-server")
# 1. 啟動 llama-server
print("正在啟動 llama-server...")
llama_process = subprocess.Popen([
    LLAMA_SERVER_BIN,
    "--model", "/home/kawhi/Qwen3.5-4B-Q4_K_M.gguf",
    "--alias", "Qwen3.5-4B-GGUF",
    "--ctx-size", "16384",
    "--temp", "0.7",
    "--top-k", "20",
    "--top-p", "0.8",
    "--min-p", "0.00",
    "--chat-template-kwargs", '{"enable_thinking":false}'
])

# 確保 Python 程式結束時，自動關閉背景的 llama-server
def cleanup_llama():
    print("正在關閉 llama-server...")
    llama_process.terminate()
    llama_process.wait()

atexit.register(cleanup_llama)

# 給予 llama-server 一些啟動時間 (等待 5 秒)
print("等待 llama-server 啟動...")
time.sleep(5)


app = FastAPI()

# 允許前端跨域請求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




class StoryRequest(BaseModel):
    theme: str
    details: str

class AudioRequest(BaseModel):
    text: str

openai_client = OpenAI(
    base_url = "http://127.0.0.1:8080/v1",
    api_key = "sk-no-key-required",
)

@app.post("/generate_story")
def generate_story(req: StoryRequest):
    prompt = f"請根據以下主題和細節寫一個大約300字的繁體中文短篇故事。\\n主題：{req.theme}\\n細節：{req.details}\\n請直接輸出故事內容，不要包含任何其他說明。"
    
    completion = openai_client.chat.completions.create(
        model = "unsloth/Qwen3.5-397B-A17B",
        messages = [
            {"role": "system", "content": "你是一個擅長寫故事的AI助手。"},
            {"role": "user", "content": prompt}
        ],
    )
    
    story = completion.choices[0].message.content
    return {"story": story}

@app.post("/generate_audio")
def generate_audio(req: AudioRequest):
    # Kokoro 生成器會返回 (graphemes, phonemes, audio_tensor)
    # 我們取最後一個生成的音訊片段（如果是長文本，Kokoro 會自動切分）
    FIXED_VOICE = 'zf_002'
    FIXED_SPEED = 1.0
    generator = pipeline(
        req.text, 
        voice=FIXED_VOICE, 
        speed=FIXED_SPEED, 
        split_pattern=r'[。！？；…\n]+'
    )
    
    # 收集所有片段的音訊 (Kokoro 返回的是 float32 numpy array)
    full_audio = []
    for _, _, audio in generator:
        if audio is not None:
            full_audio.append(audio)
    
    if not full_audio:
        return {"error": "Audio generation failed"}

    # 合併多個片段
    combined_audio = np.concatenate(full_audio)

    # 2. 將 Numpy 陣列轉為 WAV 格式並進行 Base64 編碼
    byte_io = io.BytesIO()
    # Kokoro 預設採樣率為 24000Hz
    sf.write(byte_io, combined_audio, 24000, format='WAV')
    byte_io.seek(0)
    
    audio_base64 = base64.b64encode(byte_io.read()).decode('utf-8')
    
    return {
        "audio_base64": audio_base64,
        "sampling_rate": 24000,
        "format": "wav"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
