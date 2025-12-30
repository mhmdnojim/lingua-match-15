import React from 'react';
import { cn } from '@/lib/utils';
import Card from './Card';
import { GameCard, GameMode } from '@/utils/gameLogic';

interface GameBoardProps {
  chineseCards: GameCard[];
  pinyinCards: GameCard[];
  englishCards: GameCard[];
  mode: GameMode;
  showPinyin: boolean;
  onCardClick: (card: GameCard) => void;
  onSpeak: (text: string, language: 'chinese' | 'english') => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  chineseCards,
  pinyinCards,
  englishCards,
  mode,
  showPinyin,
  onCardClick,
  onSpeak,
}) => {
  return (
    <div className={cn(
      'grid gap-4 md:gap-6',
      mode === '2-column' ? 'grid-cols-2' : 'grid-cols-3'
    )}>
      {/* Chinese Column */}
      <div className="flex flex-col gap-3">
        <h3 className="text-center text-sm font-medium text-game-chinese mb-2">
          中文 (Chinese)
        </h3>
        {chineseCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            showPinyin={showPinyin}
            onClick={onCardClick}
            onSpeak={onSpeak}
          />
        ))}
      </div>

      {/* Pinyin Column (3-column mode only) */}
      {mode === '3-column' && (
        <div className="flex flex-col gap-3">
          <h3 className="text-center text-sm font-medium text-game-pinyin mb-2">
            拼音 (Pinyin)
          </h3>
          {pinyinCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onClick={onCardClick}
            />
          ))}
        </div>
      )}

      {/* English Column */}
      <div className="flex flex-col gap-3">
        <h3 className="text-center text-sm font-medium text-game-english mb-2">
          English
        </h3>
        {englishCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onClick={onCardClick}
            onSpeak={onSpeak}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
