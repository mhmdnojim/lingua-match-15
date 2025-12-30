import { useCallback, useRef } from 'react';

interface UseAudioOptions {
  muteVoice: boolean;
  muteSfx: boolean;
}

export function useAudio({ muteVoice, muteSfx }: UseAudioOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakWithWebSpeech = useCallback((text: string, language: 'chinese' | 'english') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'chinese' ? 'zh-CN' : 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, []);

  const speak = useCallback(async (text: string, language: 'chinese' | 'english') => {
    if (muteVoice) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, language }),
        }
      );

      if (!response.ok) {
        // Check for specific error types that indicate we should fallback
        const errorData = await response.json().catch(() => ({}));
        console.warn('ElevenLabs TTS failed, using Web Speech API fallback:', errorData);
        speakWithWebSpeech(text, language);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      await audioRef.current.play();
    } catch (error) {
      console.warn('TTS request failed, using Web Speech API fallback:', error);
      speakWithWebSpeech(text, language);
    }
  }, [muteVoice, speakWithWebSpeech]);

  const playSuccess = useCallback(() => {
    if (muteSfx) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.error('Failed to play success sound:', error);
    }
  }, [muteSfx]);

  const playError = useCallback(() => {
    if (muteSfx) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Failed to play error sound:', error);
    }
  }, [muteSfx]);

  const playCelebration = useCallback(() => {
    if (muteSfx) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.08);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + index * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.08 + 0.3);
        
        oscillator.start(audioContext.currentTime + index * 0.08);
        oscillator.stop(audioContext.currentTime + index * 0.08 + 0.3);
      });
    } catch (error) {
      console.error('Failed to play celebration sound:', error);
    }
  }, [muteSfx]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  return {
    speak,
    playSuccess,
    playError,
    playCelebration,
    stopAudio,
  };
}
