import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VocabularyItem } from '@/utils/excelParser';
import { ColumnConfig, valueFor, romanizationFor } from '@/utils/gameLogic';
import { getLanguage } from '@/utils/languages';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VocabularyListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: VocabularyItem[];
  columns: ColumnConfig[];
}

export const VocabularyListDialog: React.FC<VocabularyListDialogProps> = ({
  open,
  onOpenChange,
  items,
  columns,
}) => {
  const visibleColumns = columns.filter(c => c.visible);
  const mainColumn = visibleColumns[0] || columns[0];
  const otherColumns = visibleColumns.filter(c => c.lang !== mainColumn?.lang);
  const listColumns = mainColumn ? [mainColumn, ...otherColumns] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vocabulary list</DialogTitle>
          <DialogDescription>
            {items.length} word{items.length === 1 ? '' : 's'} — main language and selected translations.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-1 px-1">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  {listColumns.map(column => {
                    const lang = getLanguage(column.lang);
                    return (
                      <th key={column.lang} className="px-3 py-2 text-left font-medium">
                        {lang.name}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{index + 1}</td>
                    {listColumns.map(column => {
                      const value = valueFor(item, column.lang);
                      const romanization = column.showRomanization
                        ? romanizationFor(item, column.lang)
                        : undefined;
                      return (
                        <td key={column.lang} className="px-3 py-2">
                          <div className="font-medium text-foreground">{value || '—'}</div>
                          {romanization && (
                            <div className="text-xs text-muted-foreground">{romanization}</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VocabularyListDialog;
