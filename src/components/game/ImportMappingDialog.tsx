import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ColumnMapping, SheetData } from '@/utils/excelParser';
import { PICKABLE_LANGUAGES } from '@/utils/languages';

interface ImportMappingDialogProps {
  open: boolean;
  sheet: SheetData | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mapping: ColumnMapping) => void;
}

export const ImportMappingDialog: React.FC<ImportMappingDialogProps> = ({ open, sheet, onOpenChange, onConfirm }) => {
  const [mapping, setMapping] = useState<ColumnMapping>({});

  useEffect(() => {
    if (!sheet) return;
    const initial: ColumnMapping = {};
    sheet.headers.forEach(header => {
      initial[header] = sheet.detected[header] || 'ignore';
    });
    setMapping(initial);
  }, [sheet]);

  if (!sheet) return null;

  const assigned = Object.values(mapping).filter(v => v !== 'ignore');
  const duplicate = assigned.length !== new Set(assigned).size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Which language is each column?</DialogTitle>
          <DialogDescription>
            The first assigned column becomes the main language. Any configured column missing from the file is
            generated with AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {sheet.headers.map(header => (
            <div key={header} className="flex items-center gap-3">
              <span className="w-1/3 truncate text-sm text-foreground" title={header}>
                {header}
              </span>
              <select
                value={mapping[header] || 'ignore'}
                onChange={e => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ignore">Ignore this column</option>
                {PICKABLE_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.native} — {lang.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {duplicate && (
          <p className="text-sm text-destructive">Two columns are mapped to the same language — pick different ones.</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={assigned.length === 0 || duplicate} onClick={() => onConfirm(mapping)}>
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportMappingDialog;
