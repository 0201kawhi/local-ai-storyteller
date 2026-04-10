const getApiBaseUrl = () => {
  return `http://${window.location.hostname}:8000`;
};

export async function generateStoryWithLocal(theme: string, details: string): Promise<string> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/generate_story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme, details }),
    });
    
    if (!response.ok) {
      throw new Error('Local backend not responding or returned an error.');
    }
    
    const data = await response.json();
    return data.story;
  } catch (error) {
    console.error('Local API Error:', error);
    throw new Error(`無法連接到本地後端。請確認您已經啟動了本地 FastAPI 伺服器 (${getApiBaseUrl()})。`);
  }
}

export async function generateAudioWithLocal(text: string): Promise<string | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/generate_audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error('Local backend not responding or returned an error.');
    }
    
    const data = await response.json();
    return data.audio_base64;
  } catch (error) {
    console.error('Local API Error:', error);
    throw new Error('無法連接到本地後端合成語音。');
  }
}
