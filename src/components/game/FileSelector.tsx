import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileSelectorProps {
  selectedFile: string | null;
  availableFiles: string[];
  onSelectFile: (fileName: string) => void;
  onUploadFile: (file: File) => void;
  className?: string;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  selectedFile,
  availableFiles,
  onSelectFile,
  onUploadFile,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('flex flex-col sm:flex-row items-stretch sm:items-center gap-3', className)}>
      <div className="flex items-center gap-2 flex-1">
        <FileSpreadsheet className="w-5 h-5 text-muted-foreground shrink-0" />
        <select
          value={selectedFile || ''}
          onChange={(e) => onSelectFile(e.target.value)}
          className={cn(
            'flex-1 bg-secondary border border-border rounded-lg px-3 py-2',
            'text-foreground focus:outline-none focus:ring-2 focus:ring-primary',
            'cursor-pointer'
          )}
        >
          <option value="" disabled>Select vocabulary file...</option>
          {availableFiles.map((file) => (
            <option key={file} value={file}>
              {file.replace('.xlsx', '')}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleUploadClick}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
          'bg-secondary hover:bg-secondary/80 border border-border',
          'transition-colors duration-200'
        )}
      >
        <Upload className="w-4 h-4" />
        <span>Upload Excel</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default FileSelector;
