import React from 'react';
import { cn } from '@/lib/utils';
import { GameCard } from '@/utils/gameLogic';
import { getLanguage, columnStyle } from '@/utils/languages';
import { splitMeanings, joinMeanings, useMeaningSelection } from '@/utils/meanings';
import MeaningsPanel from './MeaningsPanel';
import { Volume2, Layers } from 'lucide-react';

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
    script: ['text-4xl md:text-5xl', 'text-3xl md:text-4xl', 'text-2xl md:text-3xl', 'text-xl', 'text-lg'],
    latin: ['text-xl md:text-2xl', 'text-lg md:text-xl', 'text-base md:text-lg', 'text-sm md:text-base', 'text-sm'],
    rom: 'text-base',
  },
};

/** Base (max) font size in px per size preset */
const BASE_PX: Record<FontSize, { script: number; latin: number }> = {
  small: { script: 26, latin: 17 },
  medium: { script: 34, latin: 21 },
  large: { script: 44, latin: 26 },
};
const MIN_PX = 9;

/** Shrink the text until it fits its fixed-size box */
const useAutoFit = (text: string, maxPx: number) => {
  const boxRef = React.useRef<HTMLSpanElement>(null);
  const [px, setPx] = React.useState(maxPx);

  React.useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let size = maxPx;
    el.style.fontSize = `${size}px`;
    let guard = 0;
    while (
      guard++ < 60 &&
      size > MIN_PX &&
      (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
    ) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
    setPx(size);
  }, [text, maxPx]);

  return { boxRef, px };
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
  const maxPx = isScript ? BASE_PX[fontSize].script : BASE_PX[fontSize].latin;

  const meanings = React.useMemo(() => splitMeanings(card.content), [card.content]);
  const hasMultiple = meanings.length > 1;
  const { selected, setSelected } = useMeaningSelection(card.vocabId, card.lang, meanings);
  const displayed = hasMultiple ? joinMeanings(selected) : card.content;

  const cardRef = React.useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);

  const { boxRef, px } = useAutoFit(displayed, maxPx);

  const speakCard = () => onSpeak?.({ ...card, content: displayed });

  const handleClick = () => {
    if (card.isMatched) return;
    onClick(card);
    speakCard();
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
      ref={cardRef}
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center justify-center h-[100px] w-full overflow-hidden p-3 rounded-lg cursor-pointer transition-all duration-300 z-0',
        background,
        card.isSelected && !card.isMatched && 'z-10',
        card.isMatched && 'card-matched opacity-50 cursor-default',
        card.isError && 'card-shake',
      )}
    >
      {showRomanization && card.romanization && (
        <span
          className={cn(
            'pointer-events-none absolute left-2 right-2 top-1.5 text-foreground/70 font-medium leading-none text-center truncate',
            sizes.rom,
          )}
        >
          {card.romanization}
        </span>
      )}

      <span
        ref={boxRef}
        dir={language.rtl ? 'rtl' : 'ltr'}
        style={{ fontSize: `${px}px` }}
        className={cn(
          'w-full h-full flex items-center justify-center text-center font-medium text-foreground leading-[1.15] break-words hyphens-auto overflow-hidden',
          showRomanization && card.romanization && 'pt-4',
          language.fontClass,
          language.romanizationOf && 'italic',
        )}
      >
        {displayed}
      </span>

      {hasMultiple && !card.isMatched && (
        <button
          onClick={e => {
            e.stopPropagation();
            setAnchor(cardRef.current?.getBoundingClientRect() ?? null);
          }}
          className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-full bg-background/85 px-1.5 py-1 shadow-md ring-1 ring-foreground/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-background z-20"
          title={`${meanings.length} meanings — pick which ones to show`}
          aria-label="Other meanings"
        >
          <Layers className="h-4 w-4 text-foreground" />
          <span className="text-[10px] font-semibold leading-none text-foreground">{meanings.length}</span>
        </button>
      )}

      {anchor && (
        <MeaningsPanel
          title={`${language.name} — ${meanings.length} meanings`}
          meanings={meanings}
          selected={selected}
          rtl={language.rtl}
          fontClass={language.fontClass}
          anchor={anchor}
          onChange={setSelected}
          onClose={() => setAnchor(null)}
        />
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
