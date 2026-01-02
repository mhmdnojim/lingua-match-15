import React from 'react';
import { cn } from '@/lib/utils';
import { GameMode } from '@/utils/gameLogic';
import { Columns2, Columns3, Eye, EyeOff, Volume2, VolumeX, Music, Music2, Mic, Crown, Type } from 'lucide-react';

export type VoiceType = 'free' | 'premium';
export type FontSize = 'small' | 'medium' | 'large';

interface GameSettingsProps {
  mode: GameMode;
  showPinyin: boolean;
  showArabic: boolean;
  hasArabicData: boolean;
  onModeChange: (mode: GameMode) => void;
  onShowPinyinChange: (show: boolean) => void;
  onShowArabicChange: (show: boolean) => void;
  muteVoice?: boolean;
  muteSfx?: boolean;
  voiceType?: VoiceType;
  fontSize?: FontSize;
  onMuteVoiceChange?: (mute: boolean) => void;
  onMuteSfxChange?: (mute: boolean) => void;
  onVoiceTypeChange?: (type: VoiceType) => void;
  onFontSizeChange?: (size: FontSize) => void;
  disabled?: boolean;
  className?: string;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
  mode,
  showPinyin,
  showArabic,
  hasArabicData,
  onModeChange,
  onShowPinyinChange,
  onShowArabicChange,
  muteVoice = false,
  muteSfx = false,
  voiceType = 'free',
  fontSize = 'medium',
  onMuteVoiceChange,
  onMuteSfxChange,
  onVoiceTypeChange,
  onFontSizeChange,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      {/* Column Mode Toggle */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => onModeChange('2-column')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            mode === '2-column' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Columns2 className="w-4 h-4" />
          <span>2 Col</span>
        </button>
        <button
          onClick={() => onModeChange('3-column')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            mode === '3-column' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Columns3 className="w-4 h-4" />
          <span>3 Col</span>
        </button>
      </div>

      {/* Pinyin Toggle - always visible, controls visibility in 2-col mode, disabled in 3-col */}
      <button
        onClick={() => onShowPinyinChange(!showPinyin)}
        disabled={mode === '3-column'}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
          mode === '3-column'
            ? 'bg-primary/50 border-primary/50 text-primary-foreground/70 cursor-not-allowed'
            : showPinyin 
              ? 'bg-primary border-primary text-primary-foreground' 
              : 'bg-secondary border-border text-muted-foreground'
        )}
        title={mode === '3-column' ? 'Pinyin always shown in 3-column mode' : (showPinyin ? 'Hide Pinyin' : 'Show Pinyin')}
      >
        {(showPinyin || mode === '3-column') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        <span>Pinyin</span>
      </button>

      {/* Arabic Toggle - only show if data has Arabic */}
      {hasArabicData && (
        <button
          onClick={() => onShowArabicChange(!showArabic)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
            showArabic 
              ? 'bg-game-arabic border-game-arabic text-white' 
              : 'bg-secondary border-border text-muted-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={showArabic ? 'Hide Arabic' : 'Show Arabic'}
        >
          {showArabic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>عربي</span>
        </button>
      )}

      {/* Voice Type Toggle */}
      {onVoiceTypeChange && (
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <button
            onClick={() => onVoiceTypeChange('free')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all',
              voiceType === 'free' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Free voice (browser)"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Free</span>
          </button>
          <button
            onClick={() => onVoiceTypeChange('premium')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all',
              voiceType === 'premium' 
                ? 'bg-warning text-warning-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Premium voice (ElevenLabs)"
          >
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Premium</span>
          </button>
        </div>
      )}

      {/* Font Size Toggle */}
      {onFontSizeChange && (
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <button
            onClick={() => onFontSizeChange('small')}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
              fontSize === 'small' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Small font"
          >
            <Type className="w-3 h-3" />
          </button>
          <button
            onClick={() => onFontSizeChange('medium')}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all',
              fontSize === 'medium' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Medium font"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFontSizeChange('large')}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-base font-medium transition-all',
              fontSize === 'large' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Large font"
          >
            <Type className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Mute Voice Toggle */}
      {onMuteVoiceChange && (
        <button
          onClick={() => onMuteVoiceChange(!muteVoice)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
            muteVoice 
              ? 'bg-secondary border-border text-muted-foreground' 
              : 'bg-primary border-primary text-primary-foreground'
          )}
          title={muteVoice ? 'Unmute voice' : 'Mute voice'}
        >
          {muteVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}

      {/* Mute SFX Toggle */}
      {onMuteSfxChange && (
        <button
          onClick={() => onMuteSfxChange(!muteSfx)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
            muteSfx 
              ? 'bg-secondary border-border text-muted-foreground' 
              : 'bg-primary border-primary text-primary-foreground'
          )}
          title={muteSfx ? 'Unmute effects' : 'Mute effects'}
        >
          {muteSfx ? <Music2 className="w-4 h-4" /> : <Music className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

export default GameSettings;