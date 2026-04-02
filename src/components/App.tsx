import React from 'react';
import { Sparkles } from 'lucide-react';
import StoryGenerator from './StoryGenerator';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              AI Storyteller
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            創作您的專屬短篇故事
          </h2>
          <p className="text-slate-600">
            選擇主題或輸入細節，AI 將為您生成精彩故事並用語音朗讀。支援雲端展示與本地模型切換。
          </p>
        </div>

        <StoryGenerator />
      </main>
    </div>
  );
}
