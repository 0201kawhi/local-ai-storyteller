import React, { useState, useRef } from 'react';
import { Sparkles, Play, Loader2, Volume2, Cloud, HardDrive, RefreshCw } from 'lucide-react';
import { generateStoryWithGemini, generateAudioWithGemini } from '../services/geminiService';
import { generateStoryWithLocal, generateAudioWithLocal } from '../services/localService';

const THEMES = ['童話', '科幻', '懸疑', '浪漫', '武俠', '自訂'];

export default function StoryGenerator() {
  const [theme, setTheme] = useState('童話');
  const [details, setDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [story, setStory] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [useLocal, setUseLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async () => {
    if (!theme) return;
    
    setIsGenerating(true);
    setStory('');
    setAudioUrl(null);
    setError(null);
    
    try {
      let generatedStory = '';
      if (useLocal) {
        generatedStory = await generateStoryWithLocal(theme, details);
      } else {
        generatedStory = await generateStoryWithGemini(theme, details);
      }
      
      setStory(generatedStory);
      setIsGenerating(false);
      
      // 自動開始合成語音
      setIsSynthesizing(true);
      let base64Audio = null;
      
      if (useLocal) {
        base64Audio = await generateAudioWithLocal(generatedStory);
      } else {
        base64Audio = await generateAudioWithGemini(generatedStory);
      }
      
      if (base64Audio) {
        // 處理不同來源的 base64 前綴
        const prefix = 'data:audio/wav;base64,';
        const fullAudioUrl = base64Audio.startsWith('data:') || base64Audio.startsWith('blob:') ? base64Audio : prefix + base64Audio;
        setAudioUrl(fullAudioUrl);
      }
      
    } catch (err: any) {
      setError(err.message || '發生未知錯誤');
    } finally {
      setIsGenerating(false);
      setIsSynthesizing(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 左側：控制面板 */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">故事設定</h2>
            
            {/* 模式切換開關 */}
            <div className="flex items-center bg-slate-100 p-1 rounded-full">
              <button
                onClick={() => setUseLocal(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !useLocal 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Cloud className="w-4 h-4" />
                雲端展示
              </button>
              <button
                onClick={() => setUseLocal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  useLocal 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                本地模型
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                選擇主題
              </label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      theme === t
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                自訂細節 (選填)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="例如：主角是一隻會說話的貓，場景在未來的火星..."
                className="w-full h-32 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none text-slate-700 placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || isSynthesizing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在生成故事...
                </>
              ) : isSynthesizing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  正在合成語音...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成故事與語音
                </>
              )}
            </button>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
            
            {useLocal && (
              <p className="text-xs text-slate-500 text-center mt-2">
                請確保您已根據「本地部署指南」啟動了 <code>localhost:8000</code> 伺服器
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 右側：結果展示 */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col min-h-[500px]">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-500" />
            生成結果
          </h2>

          <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 overflow-y-auto relative">
            {!story && !isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p>故事將顯示在這裡</p>
              </div>
            )}
            
            {story && (
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {story}
                </p>
              </div>
            )}
          </div>

          {/* 語音播放器 */}
          <div className={`mt-6 transition-all duration-500 ${audioUrl ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none hidden'}`}>
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-center gap-4">
              <button
                onClick={playAudio}
                className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors flex-shrink-0"
              >
                <Play className="w-5 h-5 ml-1" />
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-900 mb-1">故事語音已就緒</p>
                <audio 
                  ref={audioRef} 
                  src={audioUrl || ''} 
                  controls 
                  className="w-full h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
