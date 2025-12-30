import React from 'react';
import { cn } from '@/lib/utils';
import { GameCard, CardType } from '@/utils/gameLogic';
import { Volume2 } from 'lucide-react';

export type FontSize = 'small' | 'medium' | 'large';

interface CardProps {
  card: GameCard;
  showPinyin?: boolean;
  fontSize?: FontSize;
  onClick: (card: GameCard) => void;
  onSpeak?: (text: string, language: 'chinese' | 'english') => void;
}

export const Card: React.FC<CardProps> = ({ card, showPinyin = true, fontSize = 'medium', onClick, onSpeak }) => {
  const handleClick = () => {
    if (card.isMatched) return;
    onClick(card);
    
    // Speak when clicking the card
    if (onSpeak && !card.isMatched) {
      const language = card.type === 'english' ? 'english' : 'chinese';
      const text = card.type === 'pinyin' ? card.content : card.content;
      onSpeak(text, language);
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSpeak) return;
    
    const language = card.type === 'english' ? 'english' : 'chinese';
    const text = card.type === 'pinyin' ? card.content : card.content;
    onSpeak(text, language);
  };

  // Card background colors based on type
  const getCardBackground = () => {
    if (card.isMatched) return 'bg-muted/30';
    if (card.isSelected) return card.type === 'chinese' ? 'bg-game-chinese/80' : card.type === 'english' ? 'bg-game-english/80' : 'bg-game-pinyin/80';
    if (card.type === 'chinese') return 'bg-game-chinese/60 hover:bg-game-chinese/70';
    if (card.type === 'english') return 'bg-game-english/60 hover:bg-game-english/70';
    return 'bg-game-pinyin/60 hover:bg-game-pinyin/70';
  };

  // Font sizes based on setting
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          chinese: 'text-lg md:text-xl',
          pinyin: 'text-sm md:text-base',
          english: 'text-xs md:text-sm',
          pinyinLabel: 'text-[8px]',
        };
      case 'large':
        return {
          chinese: 'text-3xl md:text-4xl',
          pinyin: 'text-xl md:text-2xl',
          english: 'text-lg md:text-xl',
          pinyinLabel: 'text-sm',
        };
      default: // medium
        return {
          chinese: 'text-2xl md:text-3xl',
          pinyin: 'text-lg md:text-xl',
          english: 'text-base md:text-lg',
          pinyinLabel: 'text-xs',
        };
    }
  };

  const fontSizes = getFontSizes();

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center justify-center h-[100px] p-4 rounded-lg cursor-pointer transition-all duration-300',
        getCardBackground(),
        card.isSelected && !card.isMatched && 'card-selected ring-2 ring-foreground/30',
        card.isMatched && 'card-matched opacity-50 cursor-default',
        card.isError && 'card-shake card-flash-error'
      )}
    >
      {/* Pinyin display for Chinese cards - always reserve space */}
      {card.type === 'chinese' && (
        <span className={cn(
          'text-foreground/70 mb-1 font-medium h-4',
          fontSizes.pinyinLabel,
          !showPinyin && 'invisible'
        )}>
          {card.pinyin || '\u00A0'}
        </span>
      )}
      
      {/* Main content */}
      <span
        className={cn(
          'text-center font-medium transition-all text-foreground',
          card.type === 'chinese' && cn(fontSizes.chinese, 'font-chinese'),
          card.type === 'pinyin' && cn(fontSizes.pinyin, 'italic'),
          card.type === 'english' && fontSizes.english
        )}
      >
        {card.content}
      </span>

      {/* Type label */}
      <span className="text-[10px] text-foreground/50 mt-1 uppercase tracking-wider">
        {card.type === 'chinese' ? 'CHINESE' : card.type === 'english' ? 'ENGLISH' : 'PINYIN'}
      </span>

      {/* Audio button */}
      {(card.type === 'chinese' || card.type === 'english') && onSpeak && !card.isMatched && (
        <button
          onClick={handleSpeak}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-full transition-all',
            'bg-foreground/10 hover:bg-foreground/20',
            'opacity-60 hover:opacity-100'
          )}
          aria-label="Speak"
        >
          <Volume2 className="w-3.5 h-3.5 text-foreground/80" />
        </button>
      )}

      {/* Match indicator */}
      {card.isMatched && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-success/20">
          <span className="text-success text-2xl">✓</span>
        </div>
      )}
    </div>
  );
};

export default Card;