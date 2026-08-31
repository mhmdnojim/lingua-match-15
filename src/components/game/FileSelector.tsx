import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, FileSpreadsheet, ChevronDown, Trash2, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FileSelectorProps {
  selectedFile: string | null;
  availableFiles: string[];
  onSelectFile: (fileName: string) => void;
  onUploadFiles: (files: File[]) => void;
  onDeleteFile?: (fileName: string) => void;
  onExportFile?: () => void;
  className?: string;
}


export const FileSelector: React.FC<FileSelectorProps> = ({
  selectedFile,
  availableFiles,
  onSelectFile,
  onUploadFiles,
  onDeleteFile,
  onExportFile,

  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const strip = (name: string) => name.replace(/\.(xlsx|xls)$/i, '');
  const familyOf = (name: string) => strip(name).split(' · ')[0];
  const levelOf = (name: string) => strip(name).split(' · ')[1] || '';

  // Level sheets of one workbook (HSK1…HSK6) collapse into a single entry in the
  // picker; the level itself is chosen from the chips below it.
  const families: { name: string; files: string[] }[] = [];
  availableFiles.forEach(file => {
    const key = familyOf(file);
    const found = families.find(f => f.name === key);
    if (found) found.files.push(file);
    else families.push({ name: key, files: [file] });
  });

  const currentFamily = selectedFile ? families.find(f => f.files.includes(selectedFile)) : undefined;
  const levels = currentFamily && currentFamily.files.length > 1 && levelOf(currentFamily.files[0])
    ? currentFamily.files
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUploadFiles(files);
    }
    e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFamilyChange = (name: string) => {
    const family = families.find(f => f.name === name);
    if (!family) return;
    const level = selectedFile ? levelOf(selectedFile) : '';
    onSelectFile(family.files.find(f => levelOf(f) === level) || family.files[0]);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="relative">
        <FileSpreadsheet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <select
          value={currentFamily?.name || ''}
          onChange={(e) => handleFamilyChange(e.target.value)}
          className={cn(
            'appearance-none bg-secondary border border-border rounded-lg pl-9 pr-8 py-2',
            'text-foreground focus:outline-none focus:ring-2 focus:ring-warning',
            'cursor-pointer text-sm min-w-[180px]'
          )}
        >
          <option value="" disabled>Select vocabulary...</option>
          {families.map((family) => (
            <option key={family.name} value={family.name}>
              {family.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {levels.length > 0 && (
        <div className="flex items-center gap-1" role="group" aria-label="Level">
          {levels.map((file) => (
            <button
              key={file}
              onClick={() => onSelectFile(file)}
              aria-pressed={file === selectedFile}
              className={cn(
                'px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors duration-200',
                file === selectedFile
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-secondary',
              )}
            >
              {levelOf(file)}
            </button>
          ))}
        </div>
      )}


      <button
        onClick={handleUploadClick}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
          'border border-warning text-warning',
          'hover:bg-warning/10 transition-colors duration-200',
          'text-sm font-medium'
        )}
      >
        <Upload className="w-4 h-4" />
        <span>Upload</span>
      </button>

      {onExportFile && selectedFile && (
        <button
          onClick={onExportFile}
          title={`Export "${selectedFile.replace('.xlsx', '')}" to Excel`}
          aria-label={`Export ${selectedFile} to Excel`}
          className={cn(
            'flex items-center justify-center p-2 rounded-lg',
            'border border-primary text-primary',
            'hover:bg-primary/10 transition-colors duration-200',
          )}
        >
          <Download className="w-4 h-4" />
        </button>
      )}

      {onDeleteFile && selectedFile && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <button
              title={`Delete ${selectedFile}`}
              aria-label={`Delete ${selectedFile}`}
              className={cn(
                'flex items-center justify-center p-2 rounded-lg',
                'border border-destructive text-destructive',
                'hover:bg-destructive/10 transition-colors duration-200',
              )}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{selectedFile.replace('.xlsx', '')}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the file, its words and all generated translations.
                This action cannot be undone — you can't restore it afterwards.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDeleteFile(selectedFile)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default FileSelector;
