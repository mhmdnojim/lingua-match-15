import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  VocabularyItem,
  SheetData,
  ColumnMapping,
  buildVocabulary,
  fetchExcelFromUrl,
  parseExcelFile,
  createBatches,
} from '@/utils/excelParser';
import {
  GameCard,
  ColumnConfig,
  createColumnCards,
  
  shuffleVocabulary,
  createSeededRandom,
  dailySeed,
  calculateAccuracy,
  valueFor,
  romanizationFor,

} from '@/utils/gameLogic';
import {
  saveProgress,
  loadProgress,
  clearProgress,
  saveVocabulary,
  loadVocabularyCache,
  saveVocabularySet,
  deleteVocabularySet,
  loadVocabularySet,
  listLocalSources,
  saveUiState,
  loadUiState,
  DEFAULT_COLUMNS,
  VoiceType,
  FontSize,
} from '@/utils/storage';
import { getLanguage, romanizationCodeFor, hasRomanization, equivalentLanguages } from '@/utils/languages';
import { exportVocabularyToExcel } from '@/utils/exportExcel';
import { translateWords } from '@/utils/translate';
import { fetchCloudSet, saveCloudSet, deleteCloudSet, filledCount } from '@/utils/cloudVocabulary';
import { useAudio } from '@/hooks/useAudio';
import { usePremiumVoiceUsage } from '@/hooks/usePremiumVoiceUsage';

import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import StatsPanel from './StatsPanel';
import ProgressBar from './ProgressBar';
import FileSelector from './FileSelector';
import GameSettings from './GameSettings';
import { applyTheme, loadThemeId, saveThemeId } from '@/utils/themes';
import CelebrationModal from './CelebrationModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import LanguageColumnsDialog from './LanguageColumnsDialog';
import WordEditorDialog from './WordEditorDialog';
import ImportMappingDialog, { MappingRoles } from './ImportMappingDialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { BookOpen, LogIn, LogOut, Loader2, Cloud, CloudOff, CloudUpload, SlidersHorizontal, ChevronUp, ChevronDown, X } from 'lucide-react';
import { sampleVocabulary } from '@/data/sampleVocabulary';


const HOSTED_FILES = ['sample-vocabulary.xlsx'];
const BATCH_SIZE = 5;

export interface VocabularyGameProps {
  dataSource?: string;
  batchSize?: number;
  onComplete?: () => void;
  className?: string;
}

export const VocabularyGame: React.FC<VocabularyGameProps> = ({
  dataSource,
  batchSize = BATCH_SIZE,
  onComplete,
  className,
}) => {
  const { toast } = useToast();
  const savedProgress = loadProgress();
  const cached = loadVocabularyCache();
  const savedUi = loadUiState();

  const [user, setUser] = useState<any>(null);

  const [columns, setColumns] = useState<ColumnConfig[]>(savedProgress.columns?.length ? savedProgress.columns : DEFAULT_COLUMNS);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>(cached?.items?.length ? cached.items : sampleVocabulary);
  const [batches, setBatches] = useState<VocabularyItem[][]>([]);

  const [currentBatch, setCurrentBatch] = useState(savedProgress.currentBatch);
  const [completedBatches, setCompletedBatches] = useState<number[]>(savedProgress.completedBatches);
  const [shuffleMode, setShuffleMode] = useState(savedProgress.shuffleMode);
  /** Daily mode: the whole day uses one seeded sequence so progression is reproducible */
  const [dailyMode, setDailyMode] = useState(savedProgress.dailyMode);
  const [translateScope, setTranslateScope] = useState<'batch' | 'all'>(savedProgress.translateScope);
  /** Asks whether to translate the whole file or batch by batch when a language has no data yet */
  const [scopePrompt, setScopePrompt] = useState<{ count: number; lang: string } | null>(null);

  const [muteSfx, setMuteSfx] = useState(savedProgress.muteSfx);
  const [voiceType, setVoiceType] = useState<VoiceType>(savedProgress.voiceType);
  const [fontSize, setFontSize] = useState<FontSize>(savedProgress.fontSize);
  const [selectedFile, setSelectedFile] = useState<string | null>(dataSource || savedProgress.selectedFile);
  const [cards, setCards] = useState<Record<string, GameCard[]>>({});
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [score, setScore] = useState(savedProgress.score);
  const [time, setTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [batchScore, setBatchScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState<{
    lang: string;
    done: number;
    total: number;
    words: string[];
  } | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  /** On phones every menu starts folded so the board gets the whole screen */
  const isSmallScreen =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const [languagesOpen, setLanguagesOpen] = useState(!isSmallScreen && savedUi.languagesOpen);
  const [wordEditorOpen, setWordEditorOpen] = useState(!isSmallScreen && savedUi.wordEditorOpen);
  const [settingsOpen, setSettingsOpen] = useState(!isSmallScreen && savedUi.settingsOpen);
  /** Top chrome (title, options, stats, progress) — collapsed for distraction-free play */
  const [headerOpen, setHeaderOpen] = useState(savedUi.headerOpen);

  const [pendingSheet, setPendingSheet] = useState<SheetData | null>(null);
  const [pendingQueue, setPendingQueue] = useState<SheetData[]>([]);

  const [cloudStatus, setCloudStatus] = useState<'off' | 'saving' | 'saved' | 'error'>('off');

  const [themeId, setThemeId] = useState<string>(() => loadThemeId());

  // Apply the selected color theme
  useEffect(() => {
    applyTheme(themeId);
    saveThemeId(themeId);
  }, [themeId]);



  const navigate = useNavigate();
  const mainLang = columns[0]?.lang || 'zh';
  const premiumUsage = usePremiumVoiceUsage();

  /** Premium refused: warn once and fall back to the free browser voice */
  const handlePremiumBlocked = useCallback(
    (reason: 'auth' | 'limit' | 'error', info: { used?: number; limit?: number; message?: string }) => {
      if (reason === 'limit') {
        setVoiceType('free');
        premiumUsage.refresh();
        toast({
          title: 'Premium voice limit reached',
          description:
            info.message ?? `You used all ${info.limit ?? ''} premium voice plays this month. Switched to free voice.`,
          variant: 'destructive',
        });
      } else if (reason === 'auth') {
        setVoiceType('free');
        toast({
          title: 'Sign in for premium voice',
          description: 'Premium voice is metered per account. Sign in to use it.',
        });
      }
    },
    [premiumUsage, toast],
  );

  const { speak, playSuccess, playError, playCelebration, playTranslateStart } = useAudio({
    muteVoice: false,
    muteSfx,
    voiceType,
    onPremiumBlocked: handlePremiumBlocked,
    onPremiumUsage: premiumUsage.setCounts,
  });


  /** Every file the user has imported, plus the bundled sample */
  const [library, setLibrary] = useState<string[]>(() =>
    Array.from(new Set([...HOSTED_FILES, ...listLocalSources()])),
  );

  const cloudSource = selectedFile || 'upload';
  const userRef = useRef<any>(null);
  userRef.current = user;
  const columnsRef = useRef<ColumnConfig[]>(columns);
  columnsRef.current = columns;
  const cloudTimer = useRef<number | null>(null);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Save words locally and — when signed in — to the account so the generated
   * translations come back on any other device.
   */
  const persistVocabulary = useCallback(
    (items: VocabularyItem[], main: string) => {
      saveVocabulary({ items, mainLang: main, source: cloudSource });
      if (!userRef.current) return;
      if (cloudTimer.current) window.clearTimeout(cloudTimer.current);
      setCloudStatus('saving');
      cloudTimer.current = window.setTimeout(async () => {
        const ok = await saveCloudSet({ source: cloudSource, mainLang: main, columns: columnsRef.current, items });
        setCloudStatus(ok ? 'saved' : 'error');
      }, 1200);
    },
    [cloudSource],
  );


  // Timer
  useEffect(() => {
    if (!gameStarted || showCelebration) return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameStarted, showCelebration]);

  // Persist settings
  useEffect(() => {
    saveProgress({ muteSfx, voiceType, fontSize, columns, shuffleMode, dailyMode, translateScope });
  }, [muteSfx, voiceType, fontSize, columns, shuffleMode, dailyMode, translateScope]);

  // Remember which dialogs were open
  useEffect(() => {
    saveUiState({ languagesOpen, wordEditorOpen, settingsOpen, headerOpen });
  }, [languagesOpen, wordEditorOpen, settingsOpen, headerOpen]);

  // Rebuild batches whenever vocabulary / ordering / main language changes
  useEffect(() => {
    if (vocabulary.length === 0) {
      setBatches([]);
      return;
    }
    // Order mode: keep the original file order so batches are fixed and sequential.
    // Shuffle mode: shuffle the whole dataset so batches mix words from anywhere in the file.
    // Daily mode seeds the shuffle with today's date, so the sequence is identical
    // for the rest of the day (and changes automatically tomorrow).
    const rand = dailyMode ? createSeededRandom(dailySeed(cloudSource, mainLang, 'order')) : Math.random;
    const ordered = shuffleMode ? shuffleVocabulary(vocabulary, mainLang, rand) : [...vocabulary];
    setBatches(createBatches(ordered, batchSize));
  }, [vocabulary, shuffleMode, dailyMode, cloudSource, mainLang, batchSize]);

  const cancelTranslationRef = useRef(false);
  /** true once the user pressed Stop — blocks automatic translation for every file until resumed */
  const haltedRef = useRef(false);
  const [translationHalted, setTranslationHalted] = useState(false);
  const [haltNoticeOpen, setHaltNoticeOpen] = useState(false);

  const haltTranslation = useCallback(() => {
    cancelTranslationRef.current = true;
    haltedRef.current = true;
    autoTranslatedRef.current = 'cancelled';
    setTranslationHalted(true);
    setHaltNoticeOpen(true);
  }, []);

  const resumeTranslation = useCallback(() => {
    haltedRef.current = false;
    autoTranslatedRef.current = '';
    setTranslationHalted(false);
    setHaltNoticeOpen(false);
  }, []);

  // Auto-hide the "stopped" notice after 8 seconds (translation stays halted)
  useEffect(() => {
    if (!haltNoticeOpen) return;
    const t = setTimeout(() => setHaltNoticeOpen(false), 8000);
    return () => clearTimeout(t);
  }, [haltNoticeOpen]);

  /** After an import nothing is translated until the user picks a language that is missing from the file */
  // Never auto-translate on its own: only an explicit user action (choosing a language,
  // pressing "Translate rest", or confirming the scope prompt) turns this on.
  const [autoTranslateOn, setAutoTranslateOn] = useState(false);
  /** false while the saved set is still being pulled from the account — no AI calls until then */
  const [cloudReady, setCloudReady] = useState(true);

  /** Fill in missing translations for the given items using AI */
  const translateMissing = useCallback(
    async (items: VocabularyItem[], activeColumns: ColumnConfig[], source: string, instruction?: string, force = false) => {
      if (items.length === 0 || activeColumns.length === 0) return;
      // Stop applies to every file, not just the run that was interrupted
      if (haltedRef.current && !force) return;


      // Never pay for a translation that is already stored in the account:
      // pull the saved set first and merge anything it already knows.
      if (!force && userRef.current) {
        const remote = await fetchCloudSet(cloudSource);
        if (remote && remote.items.length > 0) {
          const byId = new Map(remote.items.map(r => [r.id, r]));
          let merged = false;
          items = items.map(item => {
            const saved = byId.get(item.id);
            if (!saved) return item;
            const extra: Record<string, string> = {};
            activeColumns.forEach(c => {
              const value = (saved.values[c.lang] || '').trim();
              if (value && !(item.values[c.lang] || '').trim()) extra[c.lang] = value;
            });
            if (Object.keys(extra).length === 0) return item;
            merged = true;
            return { ...item, values: { ...item.values, ...extra } };
          });
          if (merged) {
            const patch = new Map(items.map(i => [i.id, i]));
            setVocabulary(prev => {
              const next = prev.map(i => patch.get(i.id) || i);
              saveVocabulary({ items: next, mainLang: source, source: cloudSource });
              return next;
            });
          }
        }
      }

      // How many items already have text for a language
      const filled = (lang: string) => items.filter(i => (i.values[lang] || '').trim()).length;

      // If the chosen main language has no data yet (user just switched it), translate
      // *from* whichever language does have data, so the main column gets generated too.
      let effectiveSource = source;
      if (filled(source) === 0) {
        const candidates = new Set<string>();
        items.forEach(i => Object.keys(i.values).forEach(k => candidates.add(k)));
        const best = Array.from(candidates)
          .filter(l => l !== source)
          .sort((a, b) => filled(b) - filled(a))[0];
        if (!best || filled(best) === 0) return;
        effectiveSource = best;
      }

      // When the main column itself is empty, only fill the main column first —
      // never translate other columns in the same pass.
      const scopedColumns =
        effectiveSource !== source ? activeColumns.filter(c => c.lang === source) : activeColumns;

      const targets = scopedColumns.filter(c => c.lang !== effectiveSource);
      if (targets.length === 0) return;

      cancelTranslationRef.current = false;
      playTranslateStart();
      setIsTranslating(true);

      // Total work = every word that needs a translation across all target columns
      const pendingByColumn = new Map<string, VocabularyItem[]>();
      for (const column of targets) {
        pendingByColumn.set(
          column.lang,
          items.filter(item => {
            const has = (item.values[column.lang] || '').trim().length > 0;
            const isEdited = item.edited?.[column.lang];
            return force ? !isEdited || instruction !== undefined : !has;
          }),
        );
      }
      const totalWords = Array.from(pendingByColumn.values()).reduce((sum, list) => sum + list.length, 0);
      let doneWords = 0;
      setTranslateProgress({ lang: targets[0].lang, done: 0, total: totalWords, words: [] });

      try {
        for (const column of targets) {
          if (cancelTranslationRef.current) break;
          const pending = pendingByColumn.get(column.lang) || [];
          if (pending.length === 0) continue;

          // Translate in chunks so large datasets (all batches) stay within request limits
          const CHUNK = 25;
          for (let start = 0; start < pending.length; start += CHUNK) {
            if (cancelTranslationRef.current) break;
            const chunk = pending.slice(start, start + CHUNK);
            const words = chunk.map(item => item.values[effectiveSource] || '');
            setTranslateProgress({
              lang: column.lang,
              done: doneWords,
              total: totalWords,
              words: words.filter(Boolean).slice(0, 5),
            });
            const results = await translateWords({ sourceLang: effectiveSource, targetLang: column.lang, words, instruction });

            setVocabulary(prev => {
              const next = prev.map(item => {
                const index = chunk.findIndex(p => p.id === item.id);
                if (index === -1) return item;
                const value = results[index];
                if (!value) return item;
                return { ...item, values: { ...item.values, [column.lang]: value } };
              });
              persistVocabulary(next, source);
              return next;
            });

            doneWords += chunk.length;
            setTranslateProgress({
              lang: column.lang,
              done: doneWords,
              total: totalWords,
              words: words.filter(Boolean).slice(0, 5),
            });
          }
        }
      } catch (error) {
        toast({
          title: 'Translation failed',
          description: error instanceof Error ? error.message : 'Could not generate translations',
          variant: 'destructive',
        });
      } finally {
        cancelTranslationRef.current = false;
        setIsTranslating(false);
        setTranslateProgress(null);
      }
    },
    [persistVocabulary, toast, cloudSource, playTranslateStart],
  );

  /**
   * Columns to generate: the visible language columns plus a hidden pseudo-column for
   * every romanization (pinyin / transliteration) that is switched on above a word.
   */
  const translationColumns = useMemo(() => {
    const list = [...columns];
    columns.forEach(c => {
      if (!c.showRomanization) return;
      const romCode = romanizationCodeFor(c.lang);
      if (romCode && !list.some(x => x.lang === romCode)) {
        list.push({ lang: romCode, visible: false, muted: true, showRomanization: false });
      }
    });
    return list;
  }, [columns]);

  // Auto-translate the current batch when a configured column has no data yet
  const autoTranslatedRef = useRef<string>('');
  useEffect(() => {
    const batch = batches[currentBatch];
    if (!batch || isTranslating || !cloudReady || translationHalted || !autoTranslateOn) return;

    // In "whole file" mode every word is translated at once, not just this round
    const scopeItems = translateScope === 'all' ? vocabulary : batch;
    if (scopeItems.length === 0) return;

    const missing = scopeItems.some(item =>
      translationColumns.some(c => !(item.values[c.lang] || '').trim()),
    );

    const key =
      translateScope === 'all'
        ? `all-${translationColumns.map(c => c.lang).join(',')}-${vocabulary.length}`
        : `${currentBatch}-${translationColumns.map(c => c.lang).join(',')}-${batch.map(i => i.id).join(',')}`;
    if (!missing || autoTranslatedRef.current === key) return;

    autoTranslatedRef.current = key;
    translateMissing(scopeItems, translationColumns, mainLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches, currentBatch, translationColumns, mainLang, cloudReady, translateScope, vocabulary, translationHalted, autoTranslateOn]);

  /** Translate every word still missing a translation in the whole file */
  /** Words still missing at least one of the active column languages */
  const missingCount = useMemo(
    () =>
      vocabulary.filter(item =>
        translationColumns.some(c => !(item.values[c.lang] || '').trim()),
      ).length,
    [vocabulary, translationColumns],
  );

  const [confirmWholeFile, setConfirmWholeFile] = useState(false);

  /** Ask first — this button used to start a paid run on an accidental click */
  const handleTranslateWholeFile = useCallback(() => {
    if (vocabulary.length === 0 || isTranslating) return;
    if (missingCount === 0) {
      toast({
        title: 'Nothing to translate',
        description: 'Every word in this file already has all of its column translations.',
      });
      return;
    }
    setConfirmWholeFile(true);
  }, [vocabulary.length, isTranslating, missingCount]);

  const runTranslateWholeFile = useCallback(() => {
    setConfirmWholeFile(false);
    if (vocabulary.length === 0 || isTranslating) return;
    setAutoTranslateOn(true);
    resumeTranslation();
    translateMissing(vocabulary, translationColumns, mainLang);
  }, [vocabulary, translationColumns, mainLang, isTranslating, translateMissing, resumeTranslation]);



  // Pull the saved set from the account (or seed it) when signed in
  const cloudPulledRef = useRef<string>('');
  useEffect(() => {
    if (!user) {
      setCloudStatus('off');
      cloudPulledRef.current = '';
      setCloudReady(true);
      return;
    }
    const key = `${user.id}-${cloudSource}`;
    if (cloudPulledRef.current === key) return;
    cloudPulledRef.current = key;
    setCloudReady(false);

    (async () => {
      setCloudStatus('saving');
      const remote = await fetchCloudSet(cloudSource);

      if (!remote || remote.items.length === 0) {
        if (vocabulary.length > 0) {
          const ok = await saveCloudSet({ source: cloudSource, mainLang, columns, items: vocabulary });
          setCloudStatus(ok ? 'saved' : 'error');
        } else {
          setCloudStatus('saved');
        }
        setCloudReady(true);
        return;
      }

      if (filledCount(remote.items) > filledCount(vocabulary)) {
        setVocabulary(remote.items);
        if (remote.columns.length >= 2) setColumns(remote.columns);
        saveVocabulary({ items: remote.items, mainLang: remote.mainLang, source: cloudSource });
        autoTranslatedRef.current = '';
        toast({
          title: 'Restored from your account',
          description: `${remote.items.length} words with their saved translations were loaded.`,
        });
      }
      setCloudStatus('saved');
      setCloudReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cloudSource]);


  const initializeBatch = useCallback(
    (batchIndex: number) => {
      const batch = batches[batchIndex];
      if (!batch) return;
      const dealSeed = dailyMode ? dailySeed(cloudSource, mainLang, 'deal', batchIndex) : undefined;
      setCards(createColumnCards(batch, columns, true, dealSeed));
      setSelectedCards([]);
      setMatchedPairs(0);
      setTime(0);
      setAttempts(0);
      setCorrectMatches(0);
      setBatchScore(0);
      setGameStarted(true);
    },
    [batches, columns, shuffleMode, dailyMode, cloudSource, mainLang],
  );

  /**
   * Only re-deal (and re-shuffle) the board when the batch itself or the set of column
   * languages changes — never when a display flag (transliteration / visibility / mute)
   * is toggled or when a translation lands.
   */
  const batchKey = useMemo(
    () => (batches[currentBatch] || []).map(i => i.id).join(','),
    [batches, currentBatch],
  );
  const columnsKey = useMemo(() => columns.map(c => c.lang).join(','), [columns]);

  useEffect(() => {
    if (batches.length > 0) initializeBatch(currentBatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchKey, columnsKey]);

  /** Keep the dealt cards in sync with newly generated text without reshuffling them. */
  useEffect(() => {
    const batch = batches[currentBatch];
    if (!batch) return;
    const byId = new Map(batch.map(i => [i.id, i]));
    setCards(prev => {
      let changed = false;
      const next: Record<string, GameCard[]> = {};
      Object.entries(prev).forEach(([lang, list]) => {
        const updated = list.map(card => {
          const item = byId.get(card.vocabId);
          if (!item) return card;
          const content = valueFor(item, lang);
          const romanization = romanizationFor(item, lang);
          if (content === card.content && romanization === card.romanization) return card;
          changed = true;
          return { ...card, content: content || card.content, romanization };
        });
        const present = new Set(updated.map(c => c.vocabId));
        batch.forEach(item => {
          if (present.has(item.id)) return;
          const content = valueFor(item, lang);
          if (!content) return;
          changed = true;
          updated.push({
            id: `${lang}-${item.id}`,
            vocabId: item.id,
            lang,
            content,
            romanization: romanizationFor(item, lang),
            isSelected: false,
            isMatched: false,
            isError: false,
          });
        });
        next[lang] = updated;
      });
      return changed ? next : prev;
    });
  }, [batches, currentBatch]);


  // Load a hosted file
  const loadVocabulary = useCallback(
    async (fileName: string) => {
      setIsLoading(true);
      const result = await fetchExcelFromUrl(`/datasets/${fileName}`);
      setIsLoading(false);
      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
        return;
      }
      handleSheetReady(result);
    },
    [toast],
  );

  const skipInitialLoadRef = useRef(Boolean(cached?.items?.length));
  useEffect(() => {
    if (!selectedFile) return;
    saveProgress({ selectedFile });
    // On a fresh app open, keep the words that were already saved instead of
    // re-running the import flow for the remembered file.
    if (skipInitialLoadRef.current) {
      skipInitialLoadRef.current = false;
      return;
    }
    // Previously imported file → restore its own saved words instead of re-parsing
    const stored = loadVocabularySet(selectedFile);
    if (stored && stored.items.length > 0) {
      setVocabulary(stored.items);
      saveVocabulary(stored);
      setCurrentBatch(0);
      setCompletedBatches([]);
      autoTranslatedRef.current = '';
      return;
    }
    loadVocabulary(selectedFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  /** Keep every upload: an already used name gets " (1)", " (2)"… appended */
  const uniqueSourceName = (name: string): string => {
    const taken = new Set([...listLocalSources(), ...library]);
    if (!taken.has(name)) return name;
    const match = name.match(/^(.*?)(\.[^.]+)?$/);
    const base = match?.[1] || name;
    const ext = match?.[2] || '';
    let index = 1;
    while (taken.has(`${base} (${index})${ext}`)) index += 1;
    return `${base} (${index})${ext}`;
  };

  /** Remove an uploaded file from the picker, locally and from the account */
  const handleDeleteFile = (source: string) => {
    deleteVocabularySet(source);
    if (userRef.current) deleteCloudSet(source);
    const remaining = library.filter(s => s !== source);
    setLibrary(remaining);
    if (selectedFile === source) {
      const next = remaining[0] || null;
      setSelectedFile(next);
      if (!next) {
        setVocabulary([]);
        setCurrentBatch(0);
        setCompletedBatches([]);
      }
    }
    toast({ title: 'File deleted', description: `${source} was removed from your vocabulary list.` });
  };

  /** Upload one or many Excel files — each becomes its own entry in the picker */

  /** Reuse one language order for every following file, matched by column position */
  const mappingByPosition = (sheet: SheetData, langs: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {};
    sheet.headers.forEach((header, index) => {
      mapping[header] = langs[index] || 'ignore';
    });
    return mapping;
  };

  const langOrder = (sheet: SheetData, mapping: ColumnMapping): string[] =>
    sheet.headers.map(h => mapping[h] || 'ignore');

  /** Import the remaining files with the language order chosen for the first file */
  const applyOrderToRest = (sheets: SheetData[], langs: string[], roles?: MappingRoles) => {
    const imported: string[] = [];
    sheets.forEach(sheet => {
      const mapping = mappingByPosition(sheet, langs);
      if (applyMapping(sheet, mapping, sheet.fileName, roles)) imported.push(sheet.fileName || 'upload');
    });
    if (imported.length > 0) {
      toast({ title: `${imported.length} more file(s) imported`, description: imported.join(', ') });
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    resumeTranslation();
    setIsLoading(true);

    const sheets: SheetData[] = [];

    for (const file of files) {
      const result = await parseExcelFile(file);
      if (!result.success) {
        toast({ title: `Could not read ${file.name}`, description: result.error, variant: 'destructive' });
        continue;
      }
      sheets.push({ ...result, fileName: file.name } as SheetData);
    }
    setIsLoading(false);
    if (sheets.length === 0) return;


    const [first, ...rest] = sheets;

    // Always let the user confirm column languages and roles for the first file,
    // then reuse that language order for the rest
    setPendingQueue(rest);
    setPendingSheet(first);
  };

  /** Move on to the next file that still needs a manual column mapping */
  const advanceQueue = () => {
    setPendingQueue(queue => {
      const [next, ...rest] = queue;
      setPendingSheet(next ?? null);
      return rest;
    });
  };

  /** Single file: always open the picker, pre-filled with the detected languages */
  const handleSheetReady = (sheet: SheetData) => {
    setPendingSheet(sheet);
  };

  const handleConfirmMapping = (mapping: ColumnMapping, roles: MappingRoles) => {
    if (!pendingSheet) return;
    applyMapping(pendingSheet, mapping, pendingSheet.fileName, roles);
    const langs = langOrder(pendingSheet, mapping);
    setPendingSheet(null);
    setPendingQueue(queue => {
      if (queue.length > 0) applyOrderToRest(queue, langs, roles);
      return [];
    });
  };



  const applyMapping = (
    sheet: SheetData,
    mapping: ColumnMapping,
    sourceName?: string,
    roles?: MappingRoles,
  ): boolean => {
    const mappedLangs = Object.entries(mapping)
      .filter(([, lang]) => lang && lang !== 'ignore')
      .map(([, lang]) => lang);

    // Transliteration columns coming from the file are display data, not their own column
    const fileRomanizations = new Set(
      mappedLangs.filter(lang => {
        const root = getLanguage(lang).romanizationOf;
        return root ? mappedLangs.includes(root) : false;
      }),
    );
    const columnLangsFromFile = mappedLangs.filter(l => !fileRomanizations.has(l));
    const newMain = roles?.mainLang || columnLangsFromFile[0] || mappedLangs[0];

    // Keep configured columns, put the file's main language first, then existing extras
    const chosen = roles?.columnLangs?.length ? roles.columnLangs : columnLangsFromFile;
    const extras = columns.map(c => c.lang).filter(lang => lang !== newMain);
    const langs = [
      newMain,
      ...Array.from(new Set([...chosen.filter(l => l !== newMain), ...extras])),
    ].slice(0, 4);
    const nextColumns: ColumnConfig[] = langs.map((lang, index) => {
      const existing = columns.find(c => c.lang === lang);
      // when the file already carries this language's transliteration, show it by default
      const romCode = romanizationCodeFor(lang);
      const fromFile = Boolean(romCode && fileRomanizations.has(romCode));
      return existing
        ? { ...existing, showRomanization: (existing.showRomanization && hasRomanization(lang)) || fromFile }
        : { lang, visible: true, muted: false, showRomanization: fromFile };
    });


    const items = buildVocabulary(sheet, mapping, newMain);

    if (items.length === 0) {
      toast({
        title: sourceName ? `No words in ${sourceName}` : 'Nothing to import',
        description: 'The first column must contain the words — there is nothing to add.',
        variant: 'destructive',
      });
      return false;
    }

    const source = sourceName ? uniqueSourceName(sourceName) : selectedFile || 'upload';
    saveVocabularySet({ items, mainLang: newMain, source });
    setLibrary(prev => (prev.includes(source) ? prev : [...prev, source]));
    if (userRef.current) {
      setCloudStatus('saving');
      saveCloudSet({ source, mainLang: newMain, columns: nextColumns, items }).then(ok =>
        setCloudStatus(ok ? 'saved' : 'error'),
      );
    }

    skipInitialLoadRef.current = true;
    setSelectedFile(source);
    setColumns(nextColumns);
    setVocabulary(items);
    saveVocabulary({ items, mainLang: newMain, source });
    setCurrentBatch(0);
    setScore(0);
    setCompletedBatches([]);
    saveProgress({ currentBatch: 0, score: 0, completedBatches: [], columns: nextColumns });
    setPendingSheet(null);
    autoTranslatedRef.current = '';
    // Only translate when the user asked for languages the file does not have
    setAutoTranslateOn((roles?.generateLangs?.length ?? 0) > 0);

    toast({
      title: 'File imported',
      description: `${items.length} words loaded — main language: ${getLanguage(newMain).native}. Pick a language column to generate what the file is missing.`,
    });
    return true;
  };

  /** Romanization columns (pinyin, romaji...) only make sense for their own script — hide them otherwise */
  const romanizationMainRef = useRef<string>('');
  useEffect(() => {
    if (!mainLang || romanizationMainRef.current === mainLang) return;
    romanizationMainRef.current = mainLang;
    setColumns(prev => {
      let changed = false;
      const next = prev.map(c => {
        const rootLang = getLanguage(c.lang).romanizationOf;
        if (!rootLang) return c;
        const shouldShow = rootLang === mainLang;
        if (c.visible === shouldShow) return c;
        changed = true;
        return { ...c, visible: shouldShow };
      });
      return changed ? next : prev;
    });
  }, [mainLang]);

  /** Ask how much to translate when a newly chosen language has no data in the file */
  const maybeAskScope = (lang: string) => {
    // A variant of a column the file already has (e.g. the two pinyin labels) reuses its words
    const twins = equivalentLanguages(lang);
    let data = vocabulary;
    if (twins.length) {
      let copied = false;
      data = vocabulary.map(item => {
        if ((item.values[lang] || '').trim()) return item;
        const source = twins.map(t => item.values[t]).find(v => (v || '').trim());
        if (!source) return item;
        copied = true;
        return { ...item, values: { ...item.values, [lang]: source } };
      });
      if (copied) setVocabulary(data);
    }

    const missing = data.filter(i => !(i.values[lang] || '').trim()).length;
    if (missing === 0) return;
    if (missing > batchSize) {
      setScopePrompt({ count: missing, lang });
      return;
    }
    setAutoTranslateOn(true);
  };




  const handleColumnsChange = (next: ColumnConfig[]) => {
    const added = next.find(c => c.visible && !columns.some(p => p.lang === c.lang));
    if (added) maybeAskScope(added.lang);
    setColumns(next);
    autoTranslatedRef.current = '';
  };


  const handleColumnVisibilityChange = useCallback((lang: string, visible: boolean) => {
    // Showing a column again must let it re-fetch any words it is still missing
    if (visible) {
      autoTranslatedRef.current = '';
      maybeAskScope(lang);
    }
    setColumns(prev => prev.map(c => (c.lang === lang ? { ...c, visible } : c)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabulary, batchSize]);



  const handleColumnColorChange = useCallback((lang: string, colorIndex: number) => {
    setColumns(prev => prev.map(c => (c.lang === lang ? { ...c, colorIndex } : c)));
  }, []);

  const handleColumnFontSizeChange = useCallback((lang: string, size: FontSize) => {
    setColumns(prev => prev.map(c => (c.lang === lang ? { ...c, fontSize: size } : c)));
  }, []);

  const handleColumnMuteChange = useCallback((lang: string, muted: boolean) => {
    setColumns(prev => prev.map(c => (c.lang === lang ? { ...c, muted } : c)));
  }, []);

  const handleColumnRomanizationChange = useCallback(
    (lang: string, showRomanization: boolean) => {
      setColumns(prev => prev.map(c => (c.lang === lang ? { ...c, showRomanization } : c)));

      // Turning it on: generate the missing romanization/transliteration right away
      if (!showRomanization) return;
      const romCode = romanizationCodeFor(lang);
      if (!romCode || isTranslating) return;
      const scopeItems = translateScope === 'all' ? vocabulary : batches[currentBatch] || [];
      const pending = scopeItems.filter(i => !(i.values[romCode] || '').trim());
      if (pending.length === 0) return;
      resumeTranslation();
      translateMissing(
        scopeItems,
        [{ lang: romCode, visible: false, muted: true, showRomanization: false }],
        lang,
      );
    },
    [isTranslating, translateScope, vocabulary, batches, currentBatch, translateMissing, resumeTranslation],
  );


  const handleSpeak = useCallback(
    (card: GameCard) => {
      const column = columns.find(c => c.lang === card.lang);
      if (column?.muted) return;
      speak(card.content, card.lang);
    },
    [columns, speak],
  );

  const [hintedIds, setHintedIds] = useState<string[]>([]);
  const hintTimer = useRef<number | null>(null);

  const handleHint = useCallback(
    (card: GameCard) => {
      const vocabId = card.vocabId;
      setCards(prev => {
        const ids: string[] = [];
        Object.values(prev).forEach(list => {
          list.forEach(c => {
            if (c.vocabId === vocabId && !c.isMatched) ids.push(c.id);
          });
        });
        setHintedIds(ids);
        return prev;
      });
      // Always pronounce the word in the MAIN language (the source it was translated from)
      const mainColumn = columns[0];
      if (mainColumn && !mainColumn.muted) {
        const item = vocabulary.find(v => v.id === vocabId);
        const mainText = (item?.values?.[mainColumn.lang] || '').trim();
        if (mainText) speak(mainText, mainColumn.lang);
      }
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
      hintTimer.current = window.setTimeout(() => setHintedIds([]), 2500);
      toast({ title: 'Hint used', description: 'Matching cards are blinking — pick them yourself. -5 points' });

      setScore(s => Math.max(0, s - 5));
      setBatchScore(s => Math.max(0, s - 5));
    },
    [toast],
  );

  const updateCardSelection = (cardId: string, isSelected: boolean) => {
    setCards(prev => {
      const next: Record<string, GameCard[]> = {};
      Object.entries(prev).forEach(([lang, list]) => {
        next[lang] = list.map(c => (c.id === cardId ? { ...c, isSelected } : c));
      });
      return next;
    });
  };

  const handleCardClick = useCallback(
    (card: GameCard) => {
      if (card.isMatched || card.isError) return;
      if (selectedCards.find(c => c.id === card.id)) {
        setSelectedCards(selectedCards.filter(c => c.id !== card.id));
        updateCardSelection(card.id, false);
        return;
      }
      const sameColumn = selectedCards.find(c => c.lang === card.lang);
      if (sameColumn) {
        updateCardSelection(sameColumn.id, false);
        setSelectedCards(prev => [...prev.filter(c => c.lang !== card.lang), card]);
      } else {
        setSelectedCards(prev => [...prev, card]);
      }
      updateCardSelection(card.id, true);
    },
    [selectedCards],
  );

  /** Languages that already have data (from the file or saved translations) — no AI needed. */
  const readyLangs = useMemo(() => {
    const counts = new Map<string, number>();
    vocabulary.forEach(item => {
      Object.entries(item.values || {}).forEach(([lang, value]) => {
        if (value && String(value).trim()) counts.set(lang, (counts.get(lang) ?? 0) + 1);
      });
    });
    return Array.from(counts.keys());
  }, [vocabulary]);

  /** Change one column's language directly from its board title */
  const handleColumnLangChange = (index: number, lang: string) => {
    if (columns[index]?.lang === lang) return;
    const otherIndex = columns.findIndex(c => c.lang === lang);
    if (otherIndex !== -1) {
      const currentLang = columns[index].lang;
      handleColumnsChange(
        columns.map((c, i) => {
          if (i === index) return { ...c, lang, showRomanization: hasRomanization(lang) };
          if (i === otherIndex) return { ...c, lang: currentLang, showRomanization: hasRomanization(currentLang) };
          return c;
        }),
      );
      return;
    }
    handleColumnsChange(
      columns.map((c, i) => (i === index ? { ...c, lang, showRomanization: hasRomanization(lang) } : c)),
    );
  };

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);



  /** Every visible column must be picked — even one that is still being generated. */
  const requiredSelections = visibleColumns.length;

  /** A visible column with no cards yet (e.g. language just switched / still translating). */
  const hasPendingColumn = useMemo(
    () => visibleColumns.some(c => (cards[c.lang]?.length ?? 0) === 0),
    [visibleColumns, cards],
  );

  // Match checking
  useEffect(() => {
    if (hasPendingColumn) return;
    if (requiredSelections < 2 || selectedCards.length !== requiredSelections) return;


    setAttempts(a => a + 1);
    const vocabIds = selectedCards.map(c => c.vocabId);
    const isMatch = vocabIds.every(id => id === vocabIds[0]);

    const mapAll = (updater: (card: GameCard) => GameCard) => {
      setCards(prev => {
        const next: Record<string, GameCard[]> = {};
        Object.entries(prev).forEach(([lang, list]) => {
          next[lang] = list.map(updater);
        });
        return next;
      });
    };

    if (isMatch) {
      playSuccess();
      setCorrectMatches(c => c + 1);
      setScore(s => s + 10);
      setBatchScore(s => s + 10);
      setMatchedPairs(m => m + 1);
      mapAll(c => (selectedCards.some(s => s.id === c.id) ? { ...c, isMatched: true, isSelected: false } : c));
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
      mapAll(c => (selectedCards.some(s => s.id === c.id) ? { ...c, isError: true } : c));
      setTimeout(() => {
        mapAll(c => ({ ...c, isError: false, isSelected: false }));
        setSelectedCards([]);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCards, requiredSelections]);

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

  const handleReset = () => {
    clearProgress();
    setScore(0);
    setCompletedBatches([]);
    setCurrentBatch(0);
    initializeBatch(0);
    toast({ title: 'Game reset', description: 'All progress has been cleared' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Logged out', description: 'You have been signed out' });
  };

  // Word editor handlers
  const currentItems = batches[currentBatch] || [];

  const handleEditValue = (vocabId: string, lang: string, value: string) => {
    setVocabulary(prev => {
      const next = prev.map(item =>
        item.id === vocabId
          ? { ...item, values: { ...item.values, [lang]: value }, edited: { ...item.edited, [lang]: true } }
          : item,
      );
      persistVocabulary(next, mainLang);
      return next;
    });
  };

  const [regeneratingCards, setRegeneratingCards] = useState<string[]>([]);

  const handleRegenerateCard = async (card: GameCard) => {
    setRegeneratingCards(prev => [...prev, card.id]);
    try {
      await handleRegenerateOne(card.vocabId, card.lang);
    } finally {
      setRegeneratingCards(prev => prev.filter(id => id !== card.id));
    }
  };

  /** Inline edit from a board card. Editing the main word retranslates its row. */
  const handleCardEdit = async (card: GameCard, value: string) => {
    const item = vocabulary.find(i => i.id === card.vocabId);
    if (!item) return;

    if (card.lang !== mainLang) {
      handleEditValue(card.vocabId, card.lang, value);
      return;
    }

    const updated: VocabularyItem = {
      ...item,
      values: { [mainLang]: value },
      edited: { [mainLang]: true },
    };
    setVocabulary(prev => {
      const next = prev.map(i => (i.id === updated.id ? updated : i));
      persistVocabulary(next, mainLang);
      return next;
    });

    setRegeneratingCards(prev => [...prev, card.id]);
    try {
      await translateMissing([updated], columns, mainLang, undefined, true);
    } finally {
      setRegeneratingCards(prev => prev.filter(id => id !== card.id));
    }
  };

  const handleRegenerateOne = async (vocabId: string, lang: string, instruction?: string) => {
    const item = vocabulary.find(i => i.id === vocabId);
    if (!item) return;
    if (lang === mainLang) return;
    const sourceWord = (item.values[mainLang] || '').trim();
    if (!sourceWord) {
      toast({
        title: 'Cannot regenerate',
        description: 'The main word is empty. Add the main word first.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const [result] = await translateWords({
        sourceLang: mainLang,
        targetLang: lang,
        words: [sourceWord],
        instruction,
      });
      if (result) {
        setVocabulary(prev => {
          const next = prev.map(i =>
            i.id === vocabId ? { ...i, values: { ...i.values, [lang]: result }, edited: { ...i.edited, [lang]: false } } : i,
          );
          persistVocabulary(next, mainLang);
          return next;
        });
        toast({
          title: 'Translation regenerated',
          description: `Regenerated ${getLanguage(lang).name} for “${sourceWord}” only.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Regeneration failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  /** Regenerate every target column for a single word */
  const handleRegenerateWord = async (vocabId: string, instruction?: string) => {
    const item = vocabulary.find(i => i.id === vocabId);
    if (!item) return;
    await translateMissing([item], columns, mainLang, instruction, true);
  };

  /** Regenerate one column for every word in the current round */
  const handleRegenerateColumn = async (lang: string, instruction?: string) => {
    const column = columns.find(c => c.lang === lang);
    if (!column || currentItems.length === 0) return;
    await translateMissing(currentItems, [columns[0], column], mainLang, instruction, true);
  };

  const handleRegenerateAll = async (instruction?: string) => {
    // Regenerate across the entire dataset (all batches), not just the current batch
    await translateMissing(vocabulary, columns, mainLang, instruction, true);
    toast({
      title: 'Translations regenerated',
      description: `Updated ${vocabulary.length} words across all ${batches.length} batches.`,
    });
  };

  const handleExportExcel = () => {
    exportVocabularyToExcel(vocabulary, columns, mainLang, selectedFile || 'vocabulary');
    toast({
      title: 'Excel exported',
      description: `${vocabulary.length} words with all ${columns.length} language columns.`,
    });
  };


  return (
    <div className={cn('min-h-screen bg-background p-2 md:p-4', className)}>
      <div className="max-w-6xl mx-auto space-y-1">
        {/* Collapsible top chrome — folds away so only the cards remain */}
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
            headerOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 -mb-1 pointer-events-none',
          )}
        >
          <div className={headerOpen ? 'overflow-visible' : 'overflow-hidden'}>
            <div className="space-y-2">
        <header className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Vocabulary Match</h1>
            </div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              disabled={isLoading}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                settingsOpen
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
                isLoading && 'opacity-50 cursor-not-allowed',
              )}
              title={settingsOpen ? 'Hide options' : 'Show options'}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Options</span>
              <ChevronUp className={cn('w-3.5 h-3.5 transition-transform', !settingsOpen && 'rotate-180')} />
            </button>
            <StatsPanel
              score={score}
              time={time}
              accuracy={calculateAccuracy(correctMatches, attempts)}
              onReset={handleReset}
            />
          </div>


          {user ? (
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                title={
                  cloudStatus === 'error'
                    ? 'Could not sync with your account'
                    : cloudStatus === 'saving'
                      ? 'Syncing words and translations…'
                      : 'Words and translations saved to your account'
                }
              >
                {cloudStatus === 'saving' ? (
                  <CloudUpload className="w-4 h-4 animate-pulse text-primary" />
                ) : cloudStatus === 'error' ? (
                  <CloudOff className="w-4 h-4 text-destructive" />
                ) : (
                  <Cloud className="w-4 h-4 text-primary" />
                )}
                <span className="hidden sm:inline">
                  {cloudStatus === 'saving' ? 'Syncing…' : cloudStatus === 'error' ? 'Sync failed' : 'Synced'}
                </span>
              </span>
              <span className="text-xs text-muted-foreground hidden md:inline">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
              className="gap-1.5"
              title="Sign in to save your words and translations to your account"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign in to sync</span>
            </Button>
          )}

        </header>

        <GameSettings
          columns={columns}
          shuffleMode={shuffleMode}
          onShuffleModeChange={setShuffleMode}
          dailyMode={dailyMode}
          onDailyModeChange={setDailyMode}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onColumnMuteChange={handleColumnMuteChange}
          onColumnRomanizationChange={handleColumnRomanizationChange}
          onColumnColorChange={handleColumnColorChange}
          onColumnFontSizeChange={handleColumnFontSizeChange}
          onOpenLanguages={() => setLanguagesOpen(true)}
          onOpenWordEditor={() => setWordEditorOpen(true)}
          muteSfx={muteSfx}
          voiceType={voiceType}
          premiumUsed={premiumUsage.used}
          premiumLimit={premiumUsage.limit}
          premiumSignedIn={premiumUsage.signedIn}

          fontSize={fontSize}
          onMuteSfxChange={setMuteSfx}
          onVoiceTypeChange={setVoiceType}
          onFontSizeChange={setFontSize}
          disabled={isLoading}
          settingsOpen={settingsOpen}
          onSettingsOpenChange={setSettingsOpen}
          showToggle={false}
          onTranslateWholeFile={handleTranslateWholeFile}
          translating={isTranslating}
          themeId={themeId}
          onThemeChange={setThemeId}
          extraControls={
            <FileSelector
              selectedFile={selectedFile}
              availableFiles={library}
              onSelectFile={setSelectedFile}
              onUploadFiles={handleUploadFiles}
              onDeleteFile={handleDeleteFile}
            />
          }
        />
            </div>
          </div>
        </div>

        {/* Gentle fold handle */}
        <div className="flex justify-center">
          <button
            onClick={() => setHeaderOpen(open => !open)}
            aria-expanded={headerOpen}
            aria-label={headerOpen ? 'Hide the menu and focus on the cards' : 'Show the menu'}
            title={headerOpen ? 'Fold the menu away' : 'Unfold the menu'}
            className={cn(
              'group flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1',
              'text-[11px] font-medium text-muted-foreground backdrop-blur-sm shadow-sm',
              'transition-all duration-300 hover:text-foreground hover:border-primary/50 hover:shadow-md',
            )}
          >
            <span className="h-1 w-6 rounded-full bg-border transition-colors duration-300 group-hover:bg-primary/60" />
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
                headerOpen && 'rotate-180',
              )}
            />
            <span className={cn('transition-all duration-300', headerOpen && 'sr-only')}>Menu</span>
            <span className="h-1 w-6 rounded-full bg-border transition-colors duration-300 group-hover:bg-primary/60" />
          </button>
        </div>

        {isTranslating && (
          <div className="max-w-xl mx-auto rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                {translateProgress
                  ? `Translating to ${getLanguage(translateProgress.lang).native}…`
                  : 'Generating translations…'}
              </span>
              <span className="flex items-center gap-2">
                {translateProgress && translateProgress.total > 0 && (
                  <span className="text-muted-foreground tabular-nums">
                    {translateProgress.done}/{translateProgress.total} words
                  </span>
                )}
                <Button size="sm" variant="outline" onClick={haltTranslation}>
                  Stop
                </Button>

              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width:
                    translateProgress && translateProgress.total > 0
                      ? `${Math.round((translateProgress.done / translateProgress.total) * 100)}%`
                      : '10%',
                }}
              />
            </div>

            {translateProgress?.words.length ? (
              <p className="text-xs text-muted-foreground truncate">
                Now updating: {translateProgress.words.join(' · ')}
              </p>
            ) : null}
          </div>
        )}

        {!isTranslating && translationHalted && haltNoticeOpen && (
          <div className="max-w-xl mx-auto flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm animate-in fade-in duration-300">
            <span className="text-muted-foreground">Auto-translation stopped for all files.</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={resumeTranslation}>
                Resume
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                aria-label="Dismiss"
                onClick={() => setHaltNoticeOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}


        {batches.length > 0 && (
          <>
            <div
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
                headerOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none',
              )}
            >
              <div className="overflow-hidden">
                <ProgressBar
                  currentBatch={currentBatch}
                  totalBatches={batches.length}
                  completedBatches={completedBatches}
                  onSelectBatch={handleSelectBatch}
                  matched={matchedPairs}
                  total={batches[currentBatch]?.length || 0}
                  className="max-w-xl mx-auto"
                />
              </div>
            </div>

            <GameBoard
              columns={columns}
              cards={cards}
              loadingLangs={isTranslating ? columns.map(c => c.lang) : []}
              readyLangs={readyLangs}

              fontSize={fontSize}
              onCardClick={handleCardClick}
              onSpeak={handleSpeak}
              onHint={handleHint}
              onRegenerateCard={handleRegenerateCard}
              onEditCard={handleCardEdit}
              onColumnLangChange={handleColumnLangChange}
              regeneratingIds={regeneratingCards}
              hintedIds={hintedIds}

            />
          </>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        )}

        <LanguageColumnsDialog
          open={languagesOpen}
          columns={columns}
          onOpenChange={setLanguagesOpen}
          onChange={handleColumnsChange}
        />

        <WordEditorDialog
          open={wordEditorOpen}
          onOpenChange={setWordEditorOpen}
          items={currentItems}
          columns={columns}
          mainLang={mainLang}
          onEditValue={handleEditValue}
          onRegenerate={handleRegenerateOne}
          onRegenerateAll={handleRegenerateAll}
          onRegenerateWord={handleRegenerateWord}
          onRegenerateColumn={handleRegenerateColumn}
          onExportExcel={handleExportExcel}

        />

        <AlertDialog open={scopePrompt !== null} onOpenChange={open => !open && setScopePrompt(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Translate the whole file?</AlertDialogTitle>
              <AlertDialogDescription>
                {scopePrompt ? getLanguage(scopePrompt.lang).name : ''} is missing for {scopePrompt?.count ?? 0} words in
                this file. Translate everything now, or only the round you are playing? You can switch this any time in
                Options.
              </AlertDialogDescription>

            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel onClick={() => setScopePrompt(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                onClick={() => { setTranslateScope('batch'); setAutoTranslateOn(true); setScopePrompt(null); }}
              >
                Batch by batch
              </AlertDialogAction>
              <AlertDialogAction onClick={() => { setTranslateScope('all'); setAutoTranslateOn(true); setScopePrompt(null); }}>
                Translate whole file
              </AlertDialogAction>
            </AlertDialogFooter>

          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmWholeFile} onOpenChange={setConfirmWholeFile}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Translate the rest of this file?</AlertDialogTitle>
              <AlertDialogDescription>
                {missingCount} word{missingCount === 1 ? '' : 's'} in “{selectedFile || 'this file'}” still miss a
                translation. Running this will generate them with AI now.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={runTranslateWholeFile}>Translate now</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        <ImportMappingDialog
          open={pendingSheet !== null}
          sheet={pendingSheet}
          onOpenChange={open => !open && advanceQueue()}
          onConfirm={handleConfirmMapping}
        />

        <CelebrationModal
          isOpen={showCelebration}
          batchNumber={currentBatch + 1}
          score={batchScore}
          time={time}
          accuracy={calculateAccuracy(correctMatches, attempts)}
          isLastBatch={currentBatch === batches.length - 1}
          onNextBatch={handleNextBatch}
          onReplayBatch={() => {
            setShowCelebration(false);
            initializeBatch(currentBatch);
          }}
          onClose={() => setShowCelebration(false)}
        />
      </div>
    </div>
  );
};

export default VocabularyGame;
