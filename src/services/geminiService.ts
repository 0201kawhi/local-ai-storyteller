import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateStoryWithGemini(theme: string, details: string): Promise<string> {
  const prompt = `請根據以下主題和細節寫一個大約300字的繁體中文短篇故事。
主題：${theme}
細節：${details || '無'}
請直接輸出故事內容，不要包含任何其他說明。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  
  return response.text || "";
}

export async function generateAudioWithGemini(text: string): Promise<string | null> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return null;

  // Gemini TTS returns raw PCM audio (24000Hz, 16-bit, mono).
  // We need to wrap it in a WAV header so the browser can play it.
  const binaryString = atob(base64Audio);
  const pcmData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }

  const sampleRate = 24000;
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);

  const wavBytes = new Uint8Array(44 + pcmData.length);
  wavBytes.set(new Uint8Array(wavHeader), 0);
  wavBytes.set(pcmData, 44);

  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
