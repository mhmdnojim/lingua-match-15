import { useCallback, useRef } from 'react';
import { getLanguage } from '@/utils/languages';
import { supabase } from '@/integrations/supabase/client';

export type VoiceType = 'free' | 'premium';

export type PremiumBlockReason = 'auth' | 'limit' | 'error';

interface UseAudioOptions {
  muteVoice: boolean;
  muteSfx: boolean;
  voiceType?: VoiceType;
  /** Called when a premium request is refused (not signed in, or monthly limit reached) */
  onPremiumBlocked?: (reason: PremiumBlockReason, info: { used?: number; limit?: number; message?: string }) => void;
  /** Called after every successful premium request with the updated counter */
  onPremiumUsage?: (used: number, limit: number) => void;
}

export function useAudio({ muteVoice, muteSfx, voiceType = 'free', onPremiumBlocked, onPremiumUsage }: UseAudioOptions) {

  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** increments on every speak request so stale async audio never plays over a newer one */
  const speakTokenRef = useRef(0);

  /** Immediately stop any voice that is currently playing or pending */
  const stopSpeaking = useCallback(() => {
    speakTokenRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  /** langCode is a language code from the language catalog, e.g. 'zh', 'en', 'ar', 'fr' */
  const speakWithWebSpeech = useCallback((text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguage(langCode).locale;
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, []);

  const speakWithPremium = useCallback(async (text: string, langCode: string, token: number): Promise<boolean> => {
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
          body: JSON.stringify({ text, language: langCode }),
        }
      );

      // Check content type first - if it's JSON, it's an error response
      const contentType = response.headers.get('content-type');
      
      // Handle any non-success response or non-audio content
      if (!response.ok || !contentType?.includes('audio')) {
        // Try to get error details for logging
        try {
          const errorData = await response.json();
          console.warn('Premium TTS error:', errorData.error || 'Unknown error');
        } catch {
          console.warn('Premium TTS not available, status:', response.status);
        }
        return false;
      }

      const audioBlob = await response.blob();
      // A newer card was clicked while this audio was loading — drop it
      if (token !== speakTokenRef.current) return true;
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioUrl);
      await audioRef.current.play();
      return true;
    } catch (error) {
      console.warn('Premium TTS failed:', error);
      return false;
    }
  }, []);

  const speak = useCallback(async (text: string, langCode: string) => {
    // Always cut off whatever is playing before starting the new word
    stopSpeaking();
    if (muteVoice) return;
    const token = speakTokenRef.current;

    if (voiceType === 'premium') {
      const success = await speakWithPremium(text, langCode, token);
      if (token !== speakTokenRef.current) return;
      if (!success) {
        // Fallback to free voice if premium fails
        console.warn('Premium voice failed, falling back to free voice');
        speakWithWebSpeech(text, langCode);
      }
    } else {
      speakWithWebSpeech(text, langCode);
    }
  }, [muteVoice, voiceType, speakWithPremium, speakWithWebSpeech, stopSpeaking]);

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

  /** Short two-note chime announcing that an AI translation run just started */
  const playTranslateStart = useCallback(() => {
    if (muteSfx) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);

      gainNode.gain.setValueAtTime(0.18, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.35);
    } catch (error) {
      console.error('Failed to play translate sound:', error);
    }
  }, [muteSfx]);

  const stopAudio = stopSpeaking;

  return {
    speak,
    playSuccess,
    playError,
    playTranslateStart,
    playCelebration,
    stopAudio,
    stopSpeaking,
  };
}