import React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Volume2, VolumeX, Music, Music2, Mic, Crown, Type, Shuffle, ListOrdered } from 'lucide-react';

export type VoiceType = 'free' | 'premium';
export type FontSize = 'small' | 'medium' | 'large';

export interface ColumnVisibility {
  chinese: boolean;
  pinyin: boolean;
  english: boolean;
  arabic: boolean;
}

export interface ColumnMute {
  chinese: boolean;
  pinyin: boolean;
  english: boolean;
  arabic: boolean;
}

interface GameSettingsProps {
  showPinyin: boolean;
  showArabic: boolean;
  hasArabicData: boolean;
  fourthColumnLabel?: string;
  shuffleMode: boolean;
  columnVisibility: ColumnVisibility;
  columnMute: ColumnMute;
  onShowPinyinChange: (show: boolean) => void;
  onShowArabicChange: (show: boolean) => void;
  onShuffleModeChange: (shuffle: boolean) => void;
  onColumnVisibilityChange: (column: keyof ColumnVisibility, visible: boolean) => void;
  onColumnMuteChange: (column: keyof ColumnMute, mute: boolean) => void;
  muteSfx?: boolean;
  voiceType?: VoiceType;
  fontSize?: FontSize;
  onMuteSfxChange?: (mute: boolean) => void;
  onVoiceTypeChange?: (type: VoiceType) => void;
  onFontSizeChange?: (size: FontSize) => void;
  disabled?: boolean;
  className?: string;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
  showPinyin,
  showArabic,
  hasArabicData,
  fourthColumnLabel,
  shuffleMode,
  columnVisibility,
  columnMute,
  onShowPinyinChange,
  onShowArabicChange,
  onShuffleModeChange,
  onColumnVisibilityChange,
  onColumnMuteChange,
  muteSfx = false,
  voiceType = 'free',
  fontSize = 'medium',
  onMuteSfxChange,
  onVoiceTypeChange,
  onFontSizeChange,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      {/* Shuffle/Order Toggle - Single button */}
      <button
        onClick={() => onShuffleModeChange(!shuffleMode)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
          shuffleMode 
            ? 'bg-primary border-primary text-primary-foreground' 
            : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title={shuffleMode ? 'Shuffle mode (click to switch to sequential)' : 'Sequential mode (click to shuffle)'}
      >
        {shuffleMode ? <Shuffle className="w-4 h-4" /> : <ListOrdered className="w-4 h-4" />}
        <span className="hidden sm:inline">{shuffleMode ? 'Shuffle' : 'Order'}</span>
      </button>

      {/* Pinyin Display Toggle - Show pinyin above Chinese characters */}
      <button
        onClick={() => onShowPinyinChange(!showPinyin)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
          showPinyin 
            ? 'bg-game-pinyin border-game-pinyin text-white' 
            : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title={showPinyin ? 'Hide pinyin on Chinese cards' : 'Show pinyin on Chinese cards'}
      >
        <span className="text-xs">拼音</span>
        <span className="hidden sm:inline">Pinyin</span>
      </button>

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
          title={columnVisibility.chinese ? 'Hide Chinese column' : 'Show Chinese column'}
        >
          {columnVisibility.chinese ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>中</span>
        </button>
        <button
          onClick={() => onColumnVisibilityChange('pinyin', !columnVisibility.pinyin)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
            columnVisibility.pinyin 
              ? 'bg-game-pinyin text-white' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={columnVisibility.pinyin ? 'Hide Pinyin column' : 'Show Pinyin column'}
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
          title={columnVisibility.english ? 'Hide English column' : 'Show English column'}
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

      {/* Column Mute Toggles */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <span className="text-xs text-muted-foreground px-1">🔊</span>
        <button
          onClick={() => onColumnMuteChange('chinese', !columnMute.chinese)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
            !columnMute.chinese 
              ? 'bg-game-chinese text-white' 
              : 'text-muted-foreground hover:text-foreground line-through',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={columnMute.chinese ? 'Unmute Chinese voice' : 'Mute Chinese voice'}
        >
          {columnMute.chinese ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          <span>中</span>
        </button>
        <button
          onClick={() => onColumnMuteChange('english', !columnMute.english)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
            !columnMute.english 
              ? 'bg-game-english text-white' 
              : 'text-muted-foreground hover:text-foreground line-through',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={columnMute.english ? 'Unmute English voice' : 'Mute English voice'}
        >
          {columnMute.english ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          <span>EN</span>
        </button>
        {hasArabicData && (
          <button
            onClick={() => onColumnMuteChange('arabic', !columnMute.arabic)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
              !columnMute.arabic 
                ? 'bg-game-arabic text-white' 
                : 'text-muted-foreground hover:text-foreground line-through',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            title={columnMute.arabic ? 'Unmute Arabic voice' : 'Mute Arabic voice'}
          >
            {columnMute.arabic ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            <span>ع</span>
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