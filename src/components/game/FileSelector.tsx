import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { Upload, FileSpreadsheet, ChevronDown, Trash2 } from 'lucide-react';

interface FileSelectorProps {
  selectedFile: string | null;
  availableFiles: string[];
  onSelectFile: (fileName: string) => void;
  onUploadFiles: (files: File[]) => void;
  onDeleteFile?: (fileName: string) => void;
  className?: string;
}


export const FileSelector: React.FC<FileSelectorProps> = ({
  selectedFile,
  availableFiles,
  onSelectFile,
  onUploadFiles,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
