import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VocabularyItem } from '@/utils/excelParser';
import { ColumnConfig } from '@/utils/gameLogic';
import { getLanguage } from '@/utils/languages';
import { cn } from '@/lib/utils';
import { Download, RefreshCw, Sparkles } from 'lucide-react';

interface WordEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: VocabularyItem[];
  columns: ColumnConfig[];
  mainLang: string;
  onEditValue: (vocabId: string, lang: string, value: string) => void;
  onRegenerate: (vocabId: string, lang: string, instruction?: string) => Promise<void>;
  onRegenerateAll: (instruction?: string) => Promise<void>;
  /** Regenerate every column of one word */
  onRegenerateWord: (vocabId: string, instruction?: string) => Promise<void>;
  /** Regenerate one column for every word in this round */
  onRegenerateColumn: (lang: string, instruction?: string) => Promise<void>;
  /** Download the whole word list (all batches) as .xlsx */
  onExportExcel: () => void;
}


export const WordEditorDialog: React.FC<WordEditorDialogProps> = ({
  open,
  onOpenChange,
  items,
  columns,
  mainLang,
  onEditValue,
  onRegenerate,
  onRegenerateAll,
  onRegenerateWord,
  onRegenerateColumn,
  onExportExcel,

}) => {
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const handleRegenerate = async (vocabId: string, lang: string) => {
    setBusy(`${vocabId}-${lang}`);
    try {
      await onRegenerate(vocabId, lang, instruction.trim() || undefined);
    } finally {
      setBusy(null);
    }
  };

  const handleRegenerateWord = async (vocabId: string) => {
    setBusy(`word-${vocabId}`);
    try {
      await onRegenerateWord(vocabId, instruction.trim() || undefined);
    } finally {
      setBusy(null);
    }
  };

  const handleRegenerateColumn = async (lang: string) => {
    setBusy(`col-${lang}`);
    try {
      await onRegenerateColumn(lang, instruction.trim() || undefined);
    } finally {
      setBusy(null);
    }
  };

  const handleRegenerateAll = async () => {
    setBusy('all');
    try {
      await onRegenerateAll(instruction.trim() || undefined);
    } finally {
      setBusy(null);
    }
  };

  const targetColumns = columns.filter(c => c.lang !== mainLang);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Words in this round</DialogTitle>
          <DialogDescription>
            Fix a translation by typing over it, or regenerate it with AI. Optional guidance below is applied to
            regenerations. "Regenerate all batches" rebuilds translations for your entire word list, not just this
            round.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="Optional guidance, e.g. 'single word', 'more formal', 'everyday spoken form'"
            className="flex-1 min-w-[240px]"
          />
          <Button onClick={handleRegenerateAll} disabled={busy !== null} className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            {busy === 'all' ? 'Regenerating all…' : 'Regenerate all batches'}
          </Button>
          <Button variant="outline" onClick={onExportExcel} disabled={busy !== null} className="gap-1.5">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </div>


        {targetColumns.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Regenerate a whole column in this round:</span>
            {targetColumns.map(column => (
              <Button
                key={`col-${column.lang}`}
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={busy !== null}
                onClick={() => handleRegenerateColumn(column.lang)}
              >
                <RefreshCw className={cn('w-3.5 h-3.5', busy === `col-${column.lang}` && 'animate-spin')} />
                {getLanguage(column.lang).name}
              </Button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
              <div className="flex items-baseline gap-2">
                <span
                  dir={getLanguage(mainLang).rtl ? 'rtl' : 'ltr'}
                  className={cn('text-xl font-semibold text-foreground', getLanguage(mainLang).fontClass)}
                >
                  {item.values[mainLang]}
                </span>
                <span className="text-xs text-muted-foreground uppercase">{getLanguage(mainLang).name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto gap-1.5"
                  title="Regenerate every language for this word"
                  disabled={busy !== null}
                  onClick={() => handleRegenerateWord(item.id)}
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', busy === `word-${item.id}` && 'animate-spin')} />
                  All languages
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {targetColumns.map(column => {
                  const language = getLanguage(column.lang);
                  const key = `${item.id}-${column.lang}`;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{language.name}</span>
                        {item.edited?.[column.lang] && <span className="text-warning">edited</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          value={item.values[column.lang] || ''}
                          dir={language.rtl ? 'rtl' : 'ltr'}
                          onChange={e => onEditValue(item.id, column.lang, e.target.value)}
                          placeholder="No translation yet"
                          className={cn('text-sm', language.fontClass)}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          title="Regenerate this translation"
                          disabled={busy !== null}
                          onClick={() => handleRegenerate(item.id, column.lang)}
                        >
                          <RefreshCw className={cn('w-4 h-4', busy === key && 'animate-spin')} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordEditorDialog;
