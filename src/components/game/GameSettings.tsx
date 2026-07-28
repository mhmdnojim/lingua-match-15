import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Volume2, VolumeX, Music, Music2, Mic, Crown, Type, Shuffle, ListOrdered, SlidersHorizontal, ChevronUp, ChevronDown, Columns3, Palette } from 'lucide-react';
import { ColumnConfig } from '@/utils/gameLogic';
import { getLanguage, columnStyle, COLUMN_COLOR_COUNT } from '@/utils/languages';
import { THEMES, nextThemeId, getTheme } from '@/utils/themes';

export type VoiceType = 'free' | 'premium';
export type FontSize = 'small' | 'medium' | 'large' | 'x-large';

interface GameSettingsProps {
  columns: ColumnConfig[];
  shuffleMode: boolean;
  onShuffleModeChange: (shuffle: boolean) => void;
  /** Seeded daily sequence — the same order/shuffle for the whole day */
  dailyMode?: boolean;
  onDailyModeChange?: (daily: boolean) => void;
  onColumnVisibilityChange: (lang: string, visible: boolean) => void;
  onColumnMuteChange: (lang: string, mute: boolean) => void;
  onColumnRomanizationChange: (lang: string, show: boolean) => void;
  onColumnColorChange?: (lang: string, colorIndex: number) => void;
  onColumnFontSizeChange?: (lang: string, size: FontSize) => void;
  onOpenLanguages: () => void;
  onOpenWordEditor: () => void;
  muteSfx?: boolean;
  voiceType?: VoiceType;
  /** Premium voice requests used this month */
  premiumUsed?: number;
  /** Monthly premium voice allowance */
  premiumLimit?: number;
  premiumSignedIn?: boolean;

  fontSize?: FontSize;
  onMuteSfxChange?: (mute: boolean) => void;
  onVoiceTypeChange?: (type: VoiceType) => void;
  onFontSizeChange?: (size: FontSize) => void;
  disabled?: boolean;
  className?: string;
  /** Whether the extra options row is expanded */
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
  /** Render the built-in Options toggle button (false when it lives in the header) */
  showToggle?: boolean;
  /** Extra controls rendered at the start of the expanded panel (e.g. file picker) */
  extraControls?: React.ReactNode;
  /** Translate every remaining word in the file right now */
  onTranslateWholeFile?: () => void;
  translating?: boolean;
  /** Selected color theme id */
  themeId?: string;
  onThemeChange?: (id: string) => void;
}


export const GameSettings: React.FC<GameSettingsProps> = ({
  columns,
  shuffleMode,
  onShuffleModeChange,
  dailyMode = false,
  onDailyModeChange,
  onColumnVisibilityChange,
  onColumnMuteChange,
  onColumnRomanizationChange,
  onColumnColorChange,
  onColumnFontSizeChange,
  onOpenLanguages,
  onOpenWordEditor,
  muteSfx = false,
  voiceType = 'free',
  premiumUsed = 0,
  premiumLimit = 300,
  premiumSignedIn = false,

  fontSize = 'medium',
  onMuteSfxChange,
  onVoiceTypeChange,
  onFontSizeChange,
  disabled = false,
  className,
  settingsOpen = false,
  onSettingsOpenChange,
  showToggle = true,
  extraControls,
  onTranslateWholeFile,
  translating = false,
  themeId = 'forest',
  onThemeChange,

}) => {
  const activeTheme = THEMES.find(t => t.id === themeId);

  /** Per-column control rows (transliteration / visibility / voice / color) */
  const [colsOpen, setColsOpen] = useState(false);


  return (
    <div className={cn(settingsOpen ? 'space-y-2' : '', className)}>
      {showToggle && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => onSettingsOpenChange?.(!settingsOpen)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
              settingsOpen
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            title={settingsOpen ? 'Hide options' : 'Show options'}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Options</span>
            <ChevronUp className={cn('w-3.5 h-3.5 transition-transform', !settingsOpen && 'rotate-180')} />
          </button>
        </div>
      )}

      {/* Everything else — hidden until needed */}
      {settingsOpen && (
        <div className="flex flex-wrap items-center justify-start gap-2 rounded-lg border border-border bg-card/60 p-2">
      {extraControls}



      {/* Shuffle/Order Toggle */}
      <button
        onClick={() => onShuffleModeChange(!shuffleMode)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
          shuffleMode
            ? 'bg-primary border-primary text-primary-foreground'
            : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        title={shuffleMode ? 'Shuffle mode (click to switch to sequential)' : 'Sequential mode (click to shuffle)'}
      >
        {shuffleMode ? <Shuffle className="w-4 h-4 shrink-0" /> : <ListOrdered className="w-4 h-4 shrink-0" />}
        <span className="hidden sm:inline text-center w-[3.75rem]">{shuffleMode ? 'Shuffle' : 'Order'}</span>
      </button>





      {/* Per-column controls — one row per column with all of its toggles */}
      <div className="relative flex items-center gap-1 rounded-lg bg-secondary p-1" title="Per-column controls">
        <button
          onClick={() => setColsOpen(o => !o)}
          className={cn(
            'flex h-6 items-center gap-1 rounded-md px-1.5 transition-colors',
            colsOpen ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
          title={colsOpen ? 'Hide column controls' : 'Show column controls'}
          aria-expanded={colsOpen}
        >
          <Columns3 className="h-4 w-4 shrink-0" />
          <ChevronUp className={cn('h-3 w-3 shrink-0 transition-transform', colsOpen ? 'rotate-90' : '-rotate-90')} />
        </button>
        <div
          className={cn(
            'absolute left-0 top-full z-40 mt-1 flex w-max flex-row items-start gap-2 rounded-lg border border-border bg-popover p-1.5 shadow-lg transition-all duration-200',
            colsOpen ? 'visible opacity-100' : 'invisible opacity-0',
          )}
        >
          {columns.map((column, index) => {
            const language = getLanguage(column.lang);
            const style = columnStyle(column.colorIndex ?? index);
            const canRomanize = Boolean(language.romanizationLabel);
            return (
              <div key={`col-${column.lang}`} className="flex flex-col items-center gap-1">
                <span className={cn('w-9 shrink-0 truncate text-center text-xs font-semibold uppercase', style.text)}>
                  {language.short}
                </span>

                {/* Transliteration */}
                <button
                  onClick={() => onColumnRomanizationChange(column.lang, !column.showRomanization)}
                  disabled={disabled || !canRomanize}
                  className={cn(
                    'flex h-7 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold transition-all',
                    column.showRomanization && canRomanize
                      ? 'bg-game-pinyin text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                    (disabled || !canRomanize) && 'cursor-not-allowed opacity-40',
                  )}
                  title={
                    canRomanize
                      ? `${column.showRomanization ? 'Hide' : 'Show'} transliteration above ${language.name} words`
                      : `${language.name} has no transliteration`
                  }
                >
                  Aa
                </button>

                {/* Visibility */}
                <button
                  onClick={() => onColumnVisibilityChange(column.lang, !column.visible)}
                  disabled={disabled}
                  className={cn(
                    'flex h-7 w-8 shrink-0 items-center justify-center rounded-md transition-all',
                    column.visible ? cn(style.solid, 'text-primary-foreground') : 'text-muted-foreground hover:text-foreground',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                  title={`${column.visible ? 'Hide' : 'Show'} ${language.name} column`}
                >
                  {column.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>

                {/* Voice */}
                <button
                  onClick={() => onColumnMuteChange(column.lang, !column.muted)}
                  disabled={disabled}
                  className={cn(
                    'flex h-7 w-8 shrink-0 items-center justify-center rounded-md transition-all',
                    !column.muted ? cn(style.solid, 'text-primary-foreground') : 'text-muted-foreground hover:text-foreground',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                  title={`${column.muted ? 'Unmute' : 'Mute'} ${language.name} voice`}
                >
                  {column.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>

                {/* Card color — cycles through the available colors */}
                {onColumnColorChange && (
                  <button
                    onClick={() =>
                      onColumnColorChange(column.lang, ((column.colorIndex ?? index) + 1) % COLUMN_COLOR_COUNT)
                    }
                    disabled={disabled}
                    className={cn(
                      'flex h-7 w-8 shrink-0 items-center justify-center rounded-md transition-all',
                      cn(style.solid, 'text-primary-foreground hover:opacity-90'),
                      disabled && 'cursor-not-allowed opacity-50',
                    )}
                    title={`Change the ${language.name} column color`}
                    aria-label={`Change ${language.name} column color`}
                  >
                    <Palette className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Font size for this column only — cycles S → M → L → XL */}
                {onColumnFontSizeChange && (() => {
                  const order: FontSize[] = ['small', 'medium', 'large', 'x-large'];
                  const current = column.fontSize ?? fontSize;
                  const next = order[(order.indexOf(current) + 1) % order.length];
                  const label = current === 'x-large' ? 'XL' : current.charAt(0).toUpperCase();
                  return (
                    <button
                      onClick={() => onColumnFontSizeChange(column.lang, next)}
                      disabled={disabled}
                      className={cn(
                        'flex h-7 w-8 shrink-0 items-center justify-center gap-0.5 rounded-md transition-all',
                        column.fontSize
                          ? cn(style.solid, 'text-primary-foreground')
                          : 'text-muted-foreground hover:text-foreground',
                        disabled && 'cursor-not-allowed opacity-50',
                      )}
                      title={`${language.name} font size: ${current} — click for ${next}`}
                      aria-label={`${language.name} font size ${current}, click for ${next}`}
                    >
                      <Type className="h-3 w-3 shrink-0" />
                      <span className="text-[9px] font-semibold uppercase leading-none">{label}</span>
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>





      {/* Voice Type Toggle */}
      {onVoiceTypeChange && (
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <button
            onClick={() => onVoiceTypeChange('free')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all',
              voiceType === 'free' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
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
              voiceType === 'premium' ? 'bg-warning text-warning-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            title={
              premiumSignedIn
                ? `Premium voice — ${premiumUsed}/${premiumLimit} plays used this month`
                : 'Premium voice (sign in required)'
            }
          >
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Premium</span>
          </button>
          {voiceType === 'premium' && (
            <span
              className={cn(
                'px-1.5 text-xs font-medium tabular-nums',
                premiumSignedIn && premiumUsed >= premiumLimit ? 'text-destructive' : 'text-muted-foreground',
              )}
              title="Premium voice plays used this month"
            >
              {premiumSignedIn ? `${premiumUsed}/${premiumLimit}` : 'sign in'}
            </span>
          )}
        </div>
      )}


      {/* Font Size — single cycling button: small → medium → large → x-large → small */}
      {onFontSizeChange && (() => {
        const order: FontSize[] = ['small', 'medium', 'large', 'x-large'];
        const next = order[(order.indexOf(fontSize) + 1) % order.length];
        return (
          <button
            onClick={() => onFontSizeChange(next)}
            className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1.5 font-medium text-muted-foreground transition-all hover:text-foreground"
            title={`Font size: ${fontSize} — click for ${next}`}
            aria-label={`Font size ${fontSize}, click for ${next}`}
          >
            <Type className="w-4 h-4 shrink-0" />
            <span className="text-[10px] uppercase tracking-wide">{fontSize.charAt(0)}</span>
          </button>
        );
      })()}


      {/* Theme — single icon, each tap switches to the next theme */}
      {onThemeChange && (
        <button
          onClick={() => onThemeChange(nextThemeId(themeId))}
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-2 py-1.5 text-muted-foreground transition-all hover:text-foreground"
          title={`Theme: ${activeTheme?.name ?? themeId} — tap for ${getTheme(nextThemeId(themeId)).name}`}
          aria-label={`Theme ${activeTheme?.name ?? themeId}, tap to change`}
        >
          <Palette className="h-4 w-4 shrink-0" />
          {activeTheme && (
            <span className="flex h-4 w-4 shrink-0 overflow-hidden rounded-full border border-border">
              {activeTheme.swatch.map((color, i) => (
                <span key={i} className="h-full flex-1" style={{ backgroundColor: `hsl(${color})` }} />
              ))}
            </span>
          )}
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
              : 'bg-primary border-primary text-primary-foreground',
          )}
          title={muteSfx ? 'Unmute effects' : 'Mute effects'}
        >
          {muteSfx ? <Music2 className="w-4 h-4" /> : <Music className="w-4 h-4" />}
        </button>
      )}
        </div>
      )}
    </div>
  );
};

export default GameSettings;
