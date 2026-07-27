import React from 'react';
import { cn } from '@/lib/utils';
import { GameCard } from '@/utils/gameLogic';
import { getLanguage, columnStyle } from '@/utils/languages';
import { Volume2 } from 'lucide-react';

export type FontSize = 'small' | 'medium' | 'large';

interface CardProps {
  card: GameCard;
  columnIndex: number;
  showRomanization?: boolean;
  fontSize?: FontSize;
  onClick: (card: GameCard) => void;
  onSpeak?: (card: GameCard) => void;
}

const FONT_SIZES: Record<FontSize, { script: string[]; latin: string[]; rom: string }> = {
  small: {
    script: ['text-2xl md:text-3xl', 'text-xl md:text-2xl', 'text-lg', 'text-base', 'text-sm'],
    latin: ['text-base md:text-lg', 'text-sm md:text-base', 'text-sm', 'text-xs', 'text-[11px]'],
    rom: 'text-xs',
  },
  medium: {
    script: ['text-3xl md:text-4xl', 'text-2xl md:text-3xl', 'text-xl', 'text-lg', 'text-base'],
    latin: ['text-lg md:text-xl', 'text-base md:text-lg', 'text-sm md:text-base', 'text-sm', 'text-xs'],
    rom: 'text-sm',
  },
  large: {
    script: ['text-5xl md:text-6xl', 'text-3xl md:text-4xl', 'text-2xl md:text-3xl', 'text-xl', 'text-lg'],
    latin: ['text-xl md:text-2xl', 'text-lg md:text-xl', 'text-base md:text-lg', 'text-sm md:text-base', 'text-sm'],
    rom: 'text-base',
  },
};

/** Pick a smaller step the longer the word/phrase is so it always fits the card */
const fitStep = (text: string) => {
  const len = (text || '').trim().length;
  if (len <= 8) return 0;
  if (len <= 16) return 1;
  if (len <= 28) return 2;
  if (len <= 48) return 3;
  return 4;
};


export const Card: React.FC<CardProps> = ({
  card,
  columnIndex,
  showRomanization = true,
  fontSize = 'medium',
  onClick,
  onSpeak,
}) => {
  const language = getLanguage(card.lang);
  const style = columnStyle(columnIndex);
  const sizes = FONT_SIZES[fontSize];
  const isScript = Boolean(language.fontClass) || Boolean(language.rtl);

  const handleClick = () => {
    if (card.isMatched) return;
    onClick(card);
    onSpeak?.(card);
  };

  const background = card.isMatched
    ? 'bg-muted/40'
    : card.isError
      ? 'bg-destructive/80'
      : card.isSelected
        ? 'bg-game-glow scale-110 shadow-xl ring-4 ring-foreground/40'
        : cn(style.card, 'hover:scale-105 hover:shadow-lg');

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center justify-center h-[100px] p-4 rounded-lg cursor-pointer transition-all duration-300 z-0',
        background,
        card.isSelected && !card.isMatched && 'z-10',
        card.isMatched && 'card-matched opacity-50 cursor-default',
        card.isError && 'card-shake',
      )}
    >
      <span
        className={cn('text-foreground/70 mb-1 font-medium h-4', sizes.rom, (!showRomanization || !card.romanization) && 'invisible')}
      >
        {card.romanization || '\u00A0'}
      </span>

      <span
        dir={language.rtl ? 'rtl' : 'ltr'}
        className={cn(
          'text-center font-medium text-foreground',
          isScript ? sizes.script : sizes.latin,
          language.fontClass,
          language.romanizationOf && 'italic',
        )}
      >
        {card.content}
      </span>

      <span className="text-[10px] text-foreground/50 mt-1 uppercase tracking-wider">
        {language.native}
      </span>

      {onSpeak && !card.isMatched && (
        <button
          onClick={e => {
            e.stopPropagation();
            onSpeak(card);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/10 hover:bg-foreground/20 opacity-60 hover:opacity-100 transition-all"
          aria-label="Speak"
        >
          <Volume2 className="w-3.5 h-3.5 text-foreground/80" />
        </button>
      )}

      {card.isMatched && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-success/20">
          <span className="text-success text-2xl">✓</span>
        </div>
      )}
    </div>
  );
};

export default Card;
