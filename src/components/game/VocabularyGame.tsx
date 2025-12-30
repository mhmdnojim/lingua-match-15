import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { VocabularyItem, fetchExcelFromUrl, parseExcelFile, createBatches } from '@/utils/excelParser';
import { GameCard, GameMode, createGameCards, checkMatch, getRequiredSelections, calculateAccuracy } from '@/utils/gameLogic';
import { saveProgress, loadProgress } from '@/utils/storage';
import { useAudio } from '@/hooks/useAudio';
import GameBoard from './GameBoard';
import BatchNavigator from './BatchNavigator';
import StatsPanel from './StatsPanel';
import ProgressBar from './ProgressBar';
import FileSelector from './FileSelector';
import GameSettings from './GameSettings';
import CelebrationModal from './CelebrationModal';
import { useToast } from '@/hooks/use-toast';

const AVAILABLE_FILES = ['sample-vocabulary.xlsx'];
const BATCH_SIZE = 5;

export interface VocabularyGameProps {
  dataSource?: string;
  mode?: GameMode;
  batchSize?: number;
  showPinyin?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const VocabularyGame: React.FC<VocabularyGameProps> = ({
  dataSource,
  mode: initialMode,
  batchSize = BATCH_SIZE,
  showPinyin: initialShowPinyin,
  onComplete,
  className,
}) => {
  const { toast } = useToast();
  const savedProgress = loadProgress();

  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [batches, setBatches] = useState<VocabularyItem[][]>([]);
  const [currentBatch, setCurrentBatch] = useState(savedProgress.currentBatch);
  const [completedBatches, setCompletedBatches] = useState<number[]>(savedProgress.completedBatches);
  const [gameMode, setGameMode] = useState<GameMode>(initialMode || savedProgress.gameMode);
  const [showPinyin, setShowPinyin] = useState(initialShowPinyin ?? savedProgress.showPinyin);
  const [muteVoice, setMuteVoice] = useState(savedProgress.muteVoice);
  const [muteSfx, setMuteSfx] = useState(savedProgress.muteSfx);
  const [selectedFile, setSelectedFile] = useState<string | null>(dataSource || savedProgress.selectedFile);
  const [chineseCards, setChineseCards] = useState<GameCard[]>([]);
  const [pinyinCards, setPinyinCards] = useState<GameCard[]>([]);
  const [englishCards, setEnglishCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [score, setScore] = useState(savedProgress.score);
  const [time, setTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [batchScore, setBatchScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const { speak, playSuccess, playError, playCelebration, stopAudio } = useAudio({ muteVoice, muteSfx });

  // Timer
  useEffect(() => {
    if (!gameStarted || showCelebration) return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameStarted, showCelebration]);

  // Load vocabulary
  const loadVocabulary = useCallback(async (fileName: string) => {
    setIsLoading(true);
    try {
      const result = await fetchExcelFromUrl(`/datasets/${fileName}`);
      if (result.success) {
        setVocabulary(result.data);
        const newBatches = createBatches(result.data, batchSize);
        setBatches(newBatches);
        toast({ title: 'Vocabulary loaded', description: `${result.data.length} words loaded` });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load vocabulary', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [batchSize, toast]);

  useEffect(() => {
    if (selectedFile) {
      loadVocabulary(selectedFile);
      saveProgress({ selectedFile });
    }
  }, [selectedFile, loadVocabulary]);

  // Initialize batch cards
  const initializeBatch = useCallback((batchIndex: number) => {
    if (!batches[batchIndex]) return;
    const cards = createGameCards(batches[batchIndex], gameMode, showPinyin);
    setChineseCards(cards.chinese);
    setPinyinCards(cards.pinyin);
    setEnglishCards(cards.english);
    setSelectedCards([]);
    setMatchedPairs(0);
    setTime(0);
    setAttempts(0);
    setCorrectMatches(0);
    setBatchScore(0);
    setGameStarted(true);
  }, [batches, gameMode, showPinyin]);

  useEffect(() => {
    if (batches.length > 0) {
      initializeBatch(currentBatch);
    }
  }, [batches, currentBatch, gameMode, showPinyin, initializeBatch]);

  // Handle card click
  const handleCardClick = useCallback((card: GameCard) => {
    if (card.isMatched || card.isError) return;
    const alreadySelected = selectedCards.find(c => c.id === card.id);
    if (alreadySelected) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
      updateCardSelection(card.id, false);
      return;
    }
    const sameTypeSelected = selectedCards.find(c => c.type === card.type);
    if (sameTypeSelected) {
      updateCardSelection(sameTypeSelected.id, false);
      setSelectedCards(prev => [...prev.filter(c => c.type !== card.type), card]);
    } else {
      setSelectedCards(prev => [...prev, card]);
    }
    updateCardSelection(card.id, true);
  }, [selectedCards]);

  const updateCardSelection = (cardId: string, isSelected: boolean) => {
    const update = (cards: GameCard[]) => cards.map(c => c.id === cardId ? { ...c, isSelected } : c);
    setChineseCards(update);
    setPinyinCards(update);
    setEnglishCards(update);
  };

  // Check for match
  useEffect(() => {
    const required = getRequiredSelections(gameMode);
    if (selectedCards.length !== required) return;

    setAttempts(a => a + 1);
    const result = checkMatch(selectedCards, gameMode);

    if (result.isMatch) {
      playSuccess();
      setCorrectMatches(c => c + 1);
      setScore(s => s + 10);
      setBatchScore(s => s + 10);
      setMatchedPairs(m => m + 1);

      const matchCards = (cards: GameCard[]) => cards.map(c => 
        selectedCards.some(s => s.id === c.id) ? { ...c, isMatched: true, isSelected: false } : c
      );
      setChineseCards(matchCards);
      setPinyinCards(matchCards);
      setEnglishCards(matchCards);
      setSelectedCards([]);

      if (matchedPairs + 1 === batches[currentBatch]?.length) {
        setTimeout(() => {
          playCelebration();
          setShowCelebration(true);
          if (!completedBatches.includes(currentBatch)) {
            const newCompleted = [...completedBatches, currentBatch];
            setCompletedBatches(newCompleted);
            saveProgress({ completedBatches: newCompleted, score: score + 10 });
          }
        }, 600);
      }
    } else {
      playError();
      const errorCards = (cards: GameCard[]) => cards.map(c => 
        selectedCards.some(s => s.id === c.id) ? { ...c, isError: true } : c
      );
      setChineseCards(errorCards);
      setPinyinCards(errorCards);
      setEnglishCards(errorCards);

      setTimeout(() => {
        const clearError = (cards: GameCard[]) => cards.map(c => ({ ...c, isError: false, isSelected: false }));
        setChineseCards(clearError);
        setPinyinCards(clearError);
        setEnglishCards(clearError);
        setSelectedCards([]);
      }, 500);
    }
  }, [selectedCards, gameMode, playSuccess, playError, playCelebration, matchedPairs, batches, currentBatch, completedBatches, score]);

  const handleSelectBatch = (index: number) => {
    setCurrentBatch(index);
    saveProgress({ currentBatch: index });
    setShowCelebration(false);
  };

  const handleNextBatch = () => {
    setShowCelebration(false);
    if (currentBatch < batches.length - 1) {
      handleSelectBatch(currentBatch + 1);
    } else {
      onComplete?.();
    }
  };

  const handleUploadFile = async (file: File) => {
    setIsLoading(true);
    const result = await parseExcelFile(file);
    if (result.success) {
      setVocabulary(result.data);
      setBatches(createBatches(result.data, batchSize));
      setCurrentBatch(0);
      toast({ title: 'File uploaded', description: `${result.data.length} words loaded` });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    saveProgress({ gameMode, showPinyin, muteVoice, muteSfx });
  }, [gameMode, showPinyin, muteVoice, muteSfx]);

  return (
    <div className={cn('min-h-screen bg-background p-4 md:p-6', className)}>
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-game-english bg-clip-text text-transparent">
            词汇配对 Vocabulary Match
          </h1>
          <p className="text-muted-foreground mt-2">Match Chinese characters with their English meanings</p>
        </header>

        <FileSelector
          selectedFile={selectedFile}
          availableFiles={AVAILABLE_FILES}
          onSelectFile={setSelectedFile}
          onUploadFile={handleUploadFile}
        />

        <GameSettings
          mode={gameMode}
          showPinyin={showPinyin}
          muteVoice={muteVoice}
          muteSfx={muteSfx}
          onModeChange={setGameMode}
          onShowPinyinChange={setShowPinyin}
          onMuteVoiceChange={setMuteVoice}
          onMuteSfxChange={setMuteSfx}
          disabled={isLoading}
        />

        {batches.length > 0 && (
          <>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <StatsPanel score={score} time={time} accuracy={calculateAccuracy(correctMatches, attempts)} />
              <ProgressBar matched={matchedPairs} total={batches[currentBatch]?.length || 0} className="w-full md:w-64" />
            </div>

            <BatchNavigator
              totalBatches={batches.length}
              currentBatch={currentBatch}
              completedBatches={completedBatches}
              onSelectBatch={handleSelectBatch}
            />

            <GameBoard
              chineseCards={chineseCards}
              pinyinCards={pinyinCards}
              englishCards={englishCards}
              mode={gameMode}
              showPinyin={showPinyin}
              onCardClick={handleCardClick}
              onSpeak={speak}
            />
          </>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        )}

        <CelebrationModal
          isOpen={showCelebration}
          batchNumber={currentBatch + 1}
          score={batchScore}
          time={time}
          accuracy={calculateAccuracy(correctMatches, attempts)}
          isLastBatch={currentBatch === batches.length - 1}
          onNextBatch={handleNextBatch}
          onReplayBatch={() => { setShowCelebration(false); initializeBatch(currentBatch); }}
          onClose={() => setShowCelebration(false)}
        />
      </div>
    </div>
  );
};

export default VocabularyGame;
