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

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        <FileSpreadsheet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <select
          value={selectedFile || ''}
          onChange={(e) => onSelectFile(e.target.value)}
          className={cn(
            'appearance-none bg-secondary border border-border rounded-lg pl-9 pr-8 py-2',
            'text-foreground focus:outline-none focus:ring-2 focus:ring-warning',
            'cursor-pointer text-sm min-w-[180px]'
          )}
        >
          <option value="" disabled>Select vocabulary...</option>
          {availableFiles.map((file) => (
            <option key={file} value={file}>
              {file.replace('.xlsx', '')}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

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
