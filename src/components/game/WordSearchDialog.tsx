import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { HSK_LEVELS, HskLevel, HskSearchHit, searchHskLibrary } from '@/data/hskLibrary';
import { getLanguage, romanizationCodeFor } from '@/utils/languages';
import { cn } from '@/lib/utils';

interface WordSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** picker file name — selects the dataset family (v7/v8) */
  source?: string | null;
  /** visible column language codes, MAIN first */
  langs: string[];
  /** jump to a word: switch level + focus the batch containing this Sense ID */
  onJumpToWord: (level: HskLevel, senseId: string) => void;
}

/** Search a word across every HSK level of the current dataset */
export const WordSearchDialog: React.FC<WordSearchDialogProps> = ({
  open,
  onOpenChange,
  source,
  langs,
  onJumpToWord,
}) => {
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<HskLevel | 'all'>('all');
  const [hits, setHits] = useState<HskSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const requestRef = useRef(0);
  const mainLang = langs[0] || 'zh';

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const request = ++requestRef.current;
    const timer = setTimeout(() => {
      searchHskLibrary(q, source ?? undefined, 100)
        .then(results => {
          if (requestRef.current === request) setHits(results);
        })
        .catch(() => {
          if (requestRef.current === request) setHits([]);
        })
        .finally(() => {
          if (requestRef.current === request) setSearching(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open, source]);

  const filtered = useMemo(
    () => (levelFilter === 'all' ? hits : hits.filter(h => h.level === levelFilter)),
    [hits, levelFilter],
  );

  const displayLangs = useMemo(() => {
    const unique = [...new Set(langs)];
    return unique.slice(0, 3);
  }, [langs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Search all levels
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a word in any language…"
            className="pr-8"
          />
          {searching && (
            <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', ...HSK_LEVELS] as const).map(level => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                levelFilter === level
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {level === 'all' ? 'All levels' : level}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {query.trim() ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border">
          {!query.trim() ? (
            <p className="p-4 text-sm text-muted-foreground">
              Search every word in HSK1–HSK6 of this dataset, then tap a result to jump straight to it.
            </p>
          ) : !searching && filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No words match “{query.trim()}”.</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(hit => {
                const mainText = hit.values[mainLang] || Object.values(hit.values)[0] || '';
                const rom = romanizationCodeFor(mainLang);
                const main = getLanguage(mainLang);
                return (
                  <li key={`${hit.level}-${hit.id}`}>
                    <button
                      onClick={() => {
                        onJumpToWord(hit.level, hit.id);
                        onOpenChange(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                        {hit.level}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          dir={main.rtl ? 'rtl' : 'ltr'}
                          className={cn('block truncate text-sm font-medium', main.fontClass)}
                        >
                          {mainText}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {displayLangs
                            .filter(l => l !== mainLang)
                            .map(l => hit.values[l])
                            .filter(Boolean)
                            .join(' · ')}
                          {hit.definition ? ` — ${hit.definition}` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordSearchDialog;
