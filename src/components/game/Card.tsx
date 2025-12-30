import React from 'react';
import { cn } from '@/lib/utils';
import { GameCard, CardType } from '@/utils/gameLogic';
import { Volume2 } from 'lucide-react';

interface CardProps {
  card: GameCard;
  showPinyin?: boolean;
  onClick: (card: GameCard) => void;
  onSpeak?: (text: string, language: 'chinese' | 'english') => void;
}

const cardTypeStyles: Record<CardType, string> = {
  chinese: 'border-l-4 border-l-game-chinese hover:shadow-[0_0_20px_hsl(var(--game-chinese)/0.3)]',
  pinyin: 'border-l-4 border-l-game-pinyin hover:shadow-[0_0_20px_hsl(var(--game-pinyin)/0.3)]',
  english: 'border-l-4 border-l-game-english hover:shadow-[0_0_20px_hsl(var(--game-english)/0.3)]',
};

export const Card: React.FC<CardProps> = ({ card, showPinyin = true, onClick, onSpeak }) => {
  const handleClick = () => {
    if (card.isMatched) return;
    onClick(card);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSpeak) return;
    
    const language = card.type === 'english' ? 'english' : 'chinese';
    const text = card.type === 'pinyin' ? card.content : card.content;
    onSpeak(text, language);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center justify-center min-h-[100px] p-4 rounded-lg cursor-pointer transition-all duration-300',
        'bg-card border border-border hover:border-primary/50',
        cardTypeStyles[card.type],
        card.isSelected && !card.isMatched && 'card-selected border-game-selected bg-secondary',
        card.isMatched && 'card-matched opacity-50 cursor-default',
        card.isError && 'card-shake card-flash-error'
      )}
    >
      {/* Pinyin display for Chinese cards */}
      {card.type === 'chinese' && showPinyin && card.pinyin && (
        <span className="text-xs text-muted-foreground mb-1 font-medium">
          {card.pinyin}
        </span>
      )}
      
      {/* Main content */}
      <span
        className={cn(
          'text-center font-medium transition-all',
          card.type === 'chinese' && 'text-2xl md:text-3xl font-chinese',
          card.type === 'pinyin' && 'text-lg md:text-xl italic text-game-pinyin',
          card.type === 'english' && 'text-base md:text-lg'
        )}
      >
        {card.content}
      </span>

      {/* Audio button */}
      {(card.type === 'chinese' || card.type === 'english') && onSpeak && !card.isMatched && (
        <button
          onClick={handleSpeak}
          className={cn(
            'absolute bottom-2 right-2 p-1.5 rounded-full transition-all',
            'bg-secondary/80 hover:bg-primary hover:text-primary-foreground',
            'opacity-60 hover:opacity-100'
          )}
          aria-label="Speak"
        >
          <Volume2 className="w-3.5 h-3.5" />
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
