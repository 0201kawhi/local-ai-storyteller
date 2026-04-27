# Local AI Storyteller

這是一個結合大語言模型（LLM）與輕量化語音合成（TTS）的本地化說書人系統。透過 `llama.cpp` 驅動 Qwen 3.5 進行文本創作，並利用 [Kokoro-82M-v1.1-zh](https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh) 實現高品質、低延遲的語音輸出。

## 📋 Prerequisites

* **Node.js** (建議 v18 以上)
* **Python 3.10+** (建議使用 Conda 管理環境)
* **C++ 編譯工具** (用於編譯 llama.cpp)
* **espeak-ng** (Kokoro TTS 的音素處理依賴)
  ```bash
  sudo apt-get install espeak-ng -y
  ```

## 🛠️ Installation & Setup

### 1. 後端環境配置 (Python)
請在你的 Python 環境中安裝必要的套件：
```bash
# 安裝所有 Python 依賴項
pip install -r requirements.txt
pip install "kokoro>=0.8.2" "misaki[zh]>=0.8.2" soundfile numpy fastapi uvicorn
```

### 2. 編譯 llama.cpp
```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
mkdir build && cd build
cmake ..
cmake --build . --config Release
```

### 3. 設定環境變數
1. 在專案根目錄找到 `.env.example`。
2. 將其中的 `GEMINI_API_KEY="your_GEMINI_API_KEY"` 替換為你自己的 Google Gemini API Key。
3. **將檔案重新命名為 `.env`**。

### 4. 設定伺服器與模型路徑
編輯 `server.py` 中的路徑變數，以符合你的開發環境：

* **LLAMA_CPP_PATH**: 修改為你的 `llama.cpp` 實際存放資料夾。
* **Model Path**: 在 `subprocess.Popen` 中修改為你的 `Qwen3.5-4B-Q4_K_M.gguf` 絕對路徑。

```python
# server.py 範例
LLAMA_CPP_PATH = "/你的路徑/llama.cpp"

llama_process = subprocess.Popen([
    LLAMA_SERVER_BIN,
    "--model", "/你的路徑/Qwen3.5-4B-Q4_K_M.gguf",
    # ... 其他參數保持不變
])
```

### 5. 前端環境配置
```bash
npm install
```

## 🏃 Running the App

請按照以下順序啟動服務：

1. **啟動後端與 TTS API**:
   ```bash
   python server.py
   ```
2. **啟動前端介面**:
   ```bash
   npm run dev
   ```
3. 開啟瀏覽器訪問 `http://localhost:3000`。
![image](demo.png)
