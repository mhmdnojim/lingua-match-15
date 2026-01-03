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
  onSpeak?: (text: string, language: 'chinese' | 'english' | 'arabic') => void;
}

export const Card: React.FC<CardProps> = ({ card, showPinyin = true, fontSize = 'medium', onClick, onSpeak }) => {
  const handleClick = () => {
    if (card.isMatched) return;
    onClick(card);
    
    // Speak when clicking the card
    if (onSpeak && !card.isMatched) {
      const language = card.type === 'english' ? 'english' : card.type === 'arabic' ? 'arabic' : 'chinese';
      onSpeak(card.content, language);
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSpeak) return;
    
    const language = card.type === 'english' ? 'english' : card.type === 'arabic' ? 'arabic' : 'chinese';
    onSpeak(card.content, language);
  };

  // Card background colors based on type - brighter and more vibrant
  const getCardBackground = () => {
    if (card.isMatched) return 'bg-muted/40';
    if (card.isError) return 'bg-destructive/80';
    if (card.isSelected) {
      // Selected state - full color with glow and scale
      if (card.type === 'chinese') return 'bg-game-chinese scale-110 shadow-xl shadow-game-chinese/50 ring-4 ring-white/40';
      if (card.type === 'english') return 'bg-game-english scale-110 shadow-xl shadow-game-english/50 ring-4 ring-white/40';
      if (card.type === 'arabic') return 'bg-game-arabic scale-110 shadow-xl shadow-game-arabic/50 ring-4 ring-white/40';
      return 'bg-game-pinyin scale-110 shadow-xl shadow-game-pinyin/50 ring-4 ring-white/40';
    }
    // Default state
    if (card.type === 'chinese') return 'bg-game-chinese/70 hover:bg-game-chinese/90 hover:scale-105 hover:shadow-lg hover:shadow-game-chinese/30';
    if (card.type === 'english') return 'bg-game-english/70 hover:bg-game-english/90 hover:scale-105 hover:shadow-lg hover:shadow-game-english/30';
    if (card.type === 'arabic') return 'bg-game-arabic/70 hover:bg-game-arabic/90 hover:scale-105 hover:shadow-lg hover:shadow-game-arabic/30';
    return 'bg-game-pinyin/70 hover:bg-game-pinyin/90 hover:scale-105 hover:shadow-lg hover:shadow-game-pinyin/30';
  };

  // Font sizes based on setting
  // Font sizes - small is now what was medium, medium is what was large, large is even bigger
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          chinese: 'text-2xl md:text-3xl',
          pinyin: 'text-lg md:text-xl',
          english: 'text-base md:text-lg',
          arabic: 'text-xl md:text-2xl',
          pinyinLabel: 'text-xs',
        };
      case 'large':
        return {
          chinese: 'text-5xl md:text-6xl',
          pinyin: 'text-2xl md:text-3xl',
          english: 'text-xl md:text-2xl',
          arabic: 'text-3xl md:text-4xl',
          pinyinLabel: 'text-base',
        };
      default: // medium
        return {
          chinese: 'text-3xl md:text-4xl',
          pinyin: 'text-xl md:text-2xl',
          english: 'text-lg md:text-xl',
          arabic: 'text-2xl md:text-3xl',
          pinyinLabel: 'text-sm',
        };
    }
  };

  const fontSizes = getFontSizes();

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center justify-center h-[100px] p-4 rounded-lg cursor-pointer transition-all duration-300 z-0',
        getCardBackground(),
        card.isSelected && !card.isMatched && 'z-10',
        card.isMatched && 'card-matched opacity-50 cursor-default',
        card.isError && 'card-shake'
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
          card.type === 'english' && fontSizes.english,
          card.type === 'arabic' && cn(fontSizes.arabic, 'font-arabic')
        )}
      >
        {card.content}
      </span>

      {/* Type label */}
      <span className="text-[10px] text-foreground/50 mt-1 uppercase tracking-wider">
        {card.type === 'chinese' ? 'CHINESE' : card.type === 'english' ? 'ENGLISH' : card.type === 'arabic' ? 'عربي' : 'PINYIN'}
      </span>

      {/* Audio button - for Chinese, English, and Arabic */}
      {(card.type === 'chinese' || card.type === 'english' || card.type === 'arabic') && onSpeak && !card.isMatched && (
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