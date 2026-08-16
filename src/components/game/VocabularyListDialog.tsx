import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VocabularyItem } from '@/utils/excelParser';
import { ColumnConfig, valueFor, romanizationFor } from '@/utils/gameLogic';
import { getLanguage } from '@/utils/languages';
import { X, Search, Type, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VocabularyListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: VocabularyItem[];
  columns: ColumnConfig[];
}

type FontSize = 'small' | 'medium' | 'large';

const FONT_SIZE_CLASSES: Record<FontSize, { row: string; main: string; value: string; label: string; romanization: string }> = {
  small: {
    row: 'p-3 gap-3',
    main: 'w-10 h-10 text-lg',
    value: 'text-sm',
    label: 'text-[10px]',
    romanization: 'text-[10px]',
  },
  medium: {
    row: 'p-4 gap-4',
    main: 'w-12 h-12 text-xl',
    value: 'text-base',
    label: 'text-[11px]',
    romanization: 'text-xs',
  },
  large: {
    row: 'p-5 gap-5',
    main: 'w-14 h-14 text-2xl',
    value: 'text-lg',
    label: 'text-xs',
    romanization: 'text-sm',
  },
};

export const VocabularyListDialog: React.FC<VocabularyListDialogProps> = ({
  open,
  onOpenChange,
  items,
  columns,
}) => {
  const [query, setQuery] = useState('');
  const [fontSize, setFontSize] = useState<FontSize>('medium');

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);
  const mainColumn = visibleColumns[0] || columns[0];
  const otherColumns = useMemo(
    () => visibleColumns.filter(c => c.lang !== mainColumn?.lang),
    [visibleColumns, mainColumn],
  );
  const listColumns = mainColumn ? [mainColumn, ...otherColumns] : [];

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(item =>
      listColumns.some(column => {
        const value = valueFor(item, column.lang).toLowerCase();
        const romanization = (romanizationFor(item, column.lang) || '').toLowerCase();
        return value.includes(q) || romanization.includes(q);
      }),
    );
  }, [items, listColumns, query]);

  const sizes = FONT_SIZE_CLASSES[fontSize];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-[calc(100%-2rem)] p-0 gap-0 max-h-[85vh] flex flex-col overflow-hidden border-border bg-popover rounded-[1.75rem] shadow-2xl">
        {/* Header */}
        <DialogHeader className="shrink-0 p-6 pb-4 border-b border-border/60 bg-popover/90 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <List className="w-5 h-5 text-primary" />
                Vocabs
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} of {items.length} word{items.length === 1 ? '' : 's'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full shrink-0"
              aria-label="Close vocabs"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Find a word…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9 h-10 bg-secondary/50 border-border rounded-xl text-sm"
              />
            </div>

            <div className="h-8 w-px bg-border/80 hidden sm:block" />

            {/* Font size toggle */}
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-2 py-1.5 border border-border/60">
              <Type className="w-3.5 h-3.5 text-muted-foreground" />
              {(['small', 'medium', 'large'] as FontSize[]).map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                    fontSize === size
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                    size === 'small' && 'text-[10px]',
                    size === 'medium' && 'text-xs',
                    size === 'large' && 'text-sm',
                  )}
                  aria-label={`Set font size ${size}`}
                >
                  A
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable list */}
        <ScrollArea className="flex-1 px-6 py-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm">No words match your search.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map((item, index) => {
                const mainValue = valueFor(item, mainColumn?.lang || '');
                const mainRomanization = mainColumn?.showRomanization
                  ? romanizationFor(item, mainColumn.lang)
                  : undefined;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group relative flex items-start rounded-2xl border border-border/40 bg-secondary/30 hover:bg-secondary/60 hover:border-border/80 transition-all',
                      sizes.row,
                    )}
                  >
                    {/* Index + main word badge */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div
                        className={cn(
                          'flex items-center justify-center rounded-xl bg-primary/10 text-primary font-bold shrink-0',
                          sizes.main,
                        )}
                      >
                        {mainValue ? mainValue.charAt(0) : index + 1}
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {index + 1}
                      </span>
                    </div>

                    {/* Translations grid */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 min-w-0">
                      {listColumns.map((column, colIndex) => {
                        const value = valueFor(item, column.lang);
                        const romanization = column.showRomanization
                          ? romanizationFor(item, column.lang)
                          : undefined;
                        const lang = getLanguage(column.lang);
                        const isMain = colIndex === 0;

                        return (
                          <div
                            key={column.lang}
                            className={cn(
                              'flex flex-col min-w-0',
                              isMain && 'sm:col-span-2 lg:col-span-1',
                            )}
                          >
                            <span className={cn('uppercase tracking-wider text-muted-foreground font-semibold', sizes.label)}>
                              {lang.name}
                            </span>
                            <span
                              className={cn(
                                'font-medium text-foreground truncate',
                                sizes.value,
                                isMain && 'text-primary',
                              )}
                              dir={lang.rtl ? 'rtl' : 'ltr'}
                              title={value}
                            >
                              {value || '—'}
                            </span>
                            {romanization && (
                              <span className={cn('text-muted-foreground', sizes.romanization)}>
                                {romanization}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-border/60 bg-secondary/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filteredItems.length} word{filteredItems.length === 1 ? '' : 's'}
          </p>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VocabularyListDialog;
