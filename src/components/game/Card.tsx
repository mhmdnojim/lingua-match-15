import React from 'react';
import { cn } from '@/lib/utils';
import { GameCard } from '@/utils/gameLogic';
import { getLanguage, columnStyle } from '@/utils/languages';
import { splitMeanings, joinMeanings, useMeaningSelection } from '@/utils/meanings';
import MeaningsPanel from './MeaningsPanel';
import { Layers } from 'lucide-react';

/** Compact tag for a grammatical class, e.g. adjective -> adj. */
export const posAbbrev = (pos?: string): string => {
  const value = (pos || '').trim().toLowerCase();
  if (!value) return '';
  const map: Record<string, string> = {
    noun: 'n.', 'proper noun': 'prop.n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.',
    pronoun: 'pron.', preposition: 'prep.', conjunction: 'conj.', interjection: 'interj.',
    numeral: 'num.', determiner: 'det.', article: 'art.', particle: 'part.',
    'measure word': 'mw.', phrase: 'phr.', idiom: 'idiom',
  };
  return map[value] ?? (value.length <= 5 ? value : `${value.slice(0, 4)}.`);
};

export type FontSize = 'small' | 'medium' | 'large' | 'x-large';

interface CardProps {
  card: GameCard;
  columnIndex: number;
  showRomanization?: boolean;
  fontSize?: FontSize;
  /** hint mode: blink this card without selecting or matching it */
  isHinted?: boolean;
  /** this card's translation is being regenerated right now */
  isBusy?: boolean;
  onClick: (card: GameCard) => void;
  onSpeak?: (card: GameCard) => void;
}

/** Base (max) font size in px per size preset */
const BASE_PX: Record<FontSize, { script: number; latin: number }> = {
  small: { script: 26, latin: 17 },
  medium: { script: 34, latin: 21 },
  large: { script: 44, latin: 26 },
  'x-large': { script: 56, latin: 34 },
};
const MIN_PX = 8;

/** Scale the max font size with the viewport so phones don't get oversized text */
const useViewportScale = () => {
  const read = () => {
    if (typeof window === 'undefined') return 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const byWidth = w < 360 ? 0.62 : w < 480 ? 0.7 : w < 640 ? 0.8 : w < 768 ? 0.88 : w < 1024 ? 0.95 : 1;
    const byHeight = h < 560 ? 0.8 : h < 700 ? 0.9 : 1;
    return Math.min(byWidth, byHeight);
  };
  const [scale, setScale] = React.useState(read);
  React.useEffect(() => {
    const onResize = () => setScale(read());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return scale;
};

/** Shrink the text until it fits its fixed-size box */
const useAutoFit = (text: string, maxPx: number) => {
  const boxRef = React.useRef<HTMLSpanElement>(null);
  const [px, setPx] = React.useState(maxPx);

  React.useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => {
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
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, maxPx]);

  return { boxRef, px };
};


export const Card: React.FC<CardProps> = ({
  card,
  columnIndex,
  showRomanization = true,
  fontSize = 'medium',
  isHinted = false,
  isBusy = false,
  onClick,
  onSpeak,
}) => {
  const language = getLanguage(card.lang);
  const style = columnStyle(columnIndex);
  const isScript = Boolean(language.fontClass) || Boolean(language.rtl);
  const scale = useViewportScale();
  const maxPx = Math.max(
    MIN_PX,
    Math.round((isScript ? BASE_PX[fontSize].script : BASE_PX[fontSize].latin) * scale),
  );

  // Alternatives come from the file when the workbook declares them; only plain
  // spreadsheets fall back to splitting a multi-meaning cell by punctuation.
  const declared = card.entries;
  const meanings = React.useMemo(
    () => (declared?.length ? declared.map(e => e.text) : splitMeanings(card.content)),
    [declared, card.content],
  );
  const hasMultiple = meanings.length > 1;
  const { selected, setSelected } = useMeaningSelection(card.vocabId, card.lang, meanings);
  const displayed = hasMultiple ? joinMeanings(selected) : card.content;

  // Transliteration belongs to the exact expression shown, not to the sense.
  const romanization = React.useMemo(() => {
    if (!declared?.length) return card.romanization;
    const shown = declared.filter(e => selected.includes(e.text));
    const latin = (shown.length ? shown : declared.slice(0, 1)).map(e => e.latin).filter(Boolean);
    return latin.length ? latin.join(', ') : undefined;
  }, [declared, selected, card.romanization]);

  // File-supplied only — the app never invents a distinction.
  const disambiguation = declared?.find(e => selected.includes(e.text))?.disambiguation || '';

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
        'relative flex flex-col items-center justify-center h-[56px] sm:h-[72px] md:h-[84px] w-full overflow-hidden p-1 sm:p-2 md:p-2.5 rounded-lg cursor-pointer transition-all duration-300 z-0',
        background,
        card.isSelected && !card.isMatched && 'z-10',
        card.isMatched && 'card-matched opacity-50 cursor-default',
        card.isError && 'card-shake',
        isHinted && !card.isMatched && 'animate-pulse ring-4 ring-foreground/60 z-10',
        isBusy && !card.isMatched && 'ring-2 ring-primary/70 shadow-lg z-10',
      )}
    >
      {showRomanization && card.romanization && (
        <span
          className={cn(
            'pointer-events-none absolute left-1.5 right-1.5 top-1 sm:left-2 sm:right-2 sm:top-1.5 text-foreground/70 font-medium leading-none text-center truncate text-[9px] sm:text-[11px]',
            fontSize === 'large' ? 'md:text-sm' : 'md:text-xs',
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
          showRomanization && card.romanization && 'pt-2.5 sm:pt-4',
          language.fontClass,
          language.romanizationOf && 'italic',
        )}
      >
        {displayed}
      </span>

      {!!posAbbrev(card.pos) && !card.isMatched && (
        <span
          className="pointer-events-none absolute bottom-0.5 left-1 rounded-full bg-background/70 px-1.5 py-[1px] font-mono text-[9px] font-semibold leading-none text-foreground/80 ring-1 ring-foreground/15 sm:text-[10px]"
          title={card.pos}
        >
          {posAbbrev(card.pos)}
        </span>
      )}

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


      {isBusy && !card.isMatched && (
        <span className="pointer-events-none absolute inset-0 rounded-lg bg-primary/15 animate-pulse" />
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
