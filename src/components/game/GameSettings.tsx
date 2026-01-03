import React from 'react';
import { cn } from '@/lib/utils';
import { GameMode } from '@/utils/gameLogic';
import { Columns2, Columns3, Eye, EyeOff, Volume2, VolumeX, Music, Music2, Mic, Crown, Type, Shuffle, ListOrdered } from 'lucide-react';

export type VoiceType = 'free' | 'premium';
export type FontSize = 'small' | 'medium' | 'large';

export interface ColumnVisibility {
  chinese: boolean;
  pinyin: boolean;
  english: boolean;
  arabic: boolean;
}

interface GameSettingsProps {
  mode: GameMode;
  showPinyin: boolean;
  showArabic: boolean;
  hasArabicData: boolean;
  fourthColumnLabel?: string;
  shuffleMode: boolean;
  columnVisibility: ColumnVisibility;
  onModeChange: (mode: GameMode) => void;
  onShowPinyinChange: (show: boolean) => void;
  onShowArabicChange: (show: boolean) => void;
  onShuffleModeChange: (shuffle: boolean) => void;
  onColumnVisibilityChange: (column: keyof ColumnVisibility, visible: boolean) => void;
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
  fourthColumnLabel,
  shuffleMode,
  columnVisibility,
  onModeChange,
  onShowPinyinChange,
  onShowArabicChange,
  onShuffleModeChange,
  onColumnVisibilityChange,
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

      {/* Shuffle/Sequential Toggle */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => onShuffleModeChange(true)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            shuffleMode 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title="Shuffle words randomly"
        >
          <Shuffle className="w-4 h-4" />
          <span className="hidden sm:inline">Shuffle</span>
        </button>
        <button
          onClick={() => onShuffleModeChange(false)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            !shuffleMode 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title="Show words in order"
        >
          <ListOrdered className="w-4 h-4" />
          <span className="hidden sm:inline">Order</span>
        </button>
      </div>

      {/* Column Visibility Toggles */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => onColumnVisibilityChange('chinese', !columnVisibility.chinese)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
            columnVisibility.chinese 
              ? 'bg-game-chinese text-white' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={columnVisibility.chinese ? 'Hide Chinese' : 'Show Chinese'}
        >
          {columnVisibility.chinese ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>中</span>
        </button>
        <button
          onClick={() => onColumnVisibilityChange('pinyin', !columnVisibility.pinyin)}
          disabled={disabled || mode === '2-column'}
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
            mode === '2-column' 
              ? 'opacity-50 cursor-not-allowed text-muted-foreground'
              : columnVisibility.pinyin 
                ? 'bg-game-pinyin text-white' 
                : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={mode === '2-column' ? 'Pinyin column only in 3-col mode' : (columnVisibility.pinyin ? 'Hide Pinyin' : 'Show Pinyin')}
        >
          {columnVisibility.pinyin ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>拼</span>
        </button>
        <button
          onClick={() => onColumnVisibilityChange('english', !columnVisibility.english)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
            columnVisibility.english 
              ? 'bg-game-english text-white' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={columnVisibility.english ? 'Hide English' : 'Show English'}
        >
          {columnVisibility.english ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>EN</span>
        </button>
        {hasArabicData && (
          <button
            onClick={() => onColumnVisibilityChange('arabic', !columnVisibility.arabic)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
              columnVisibility.arabic 
                ? 'bg-game-arabic text-white' 
                : 'text-muted-foreground hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            title={columnVisibility.arabic ? 'Hide ' + (fourthColumnLabel || 'Arabic') : 'Show ' + (fourthColumnLabel || 'Arabic')}
          >
            {columnVisibility.arabic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{fourthColumnLabel?.substring(0, 2) || 'ع'}</span>
          </button>
        )}
      </div>

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