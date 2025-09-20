import React, { useState, useRef, ChangeEvent } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils';

interface ImageUploadProps {
  onChange: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  defaultImages?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onChange,
  maxFiles = 1,
  accept = 'image/*',
  defaultImages = [],
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(defaultImages || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const selectedFiles = Array.from(e.target.files);
    const newFiles = [...files];
    const newPreviews = [...previews.filter(p => typeof p === 'string' && (p.startsWith('http') || p.startsWith('blob')))];
    
    selectedFiles.forEach((file) => {
      if (newFiles.length + newPreviews.length < maxFiles) {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    });
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange(newFiles);
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    
    // If it's a new file, revoke the object URL to prevent memory leaks
    if (index >= defaultImages.length && newPreviews[index].startsWith('blob')) {
      URL.revokeObjectURL(newPreviews[index]);
    }
    
    if (index >= defaultImages.length) {
      newFiles.splice(index - defaultImages.length, 1);
    }
    newPreviews.splice(index, 1);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div 
        onClick={handleClick}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          'border-border hover:bg-muted/50'
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">
            Click to select files
          </p>
          <p className="text-sm text-muted-foreground">
            {maxFiles > 1
              ? `Upload up to ${maxFiles} images`
              : 'Upload an image'}
          </p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-md overflow-hidden border"
            >
              <img
                src={preview}
                alt={`Preview ${index}`}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {Array.from({ length: maxFiles - previews.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="aspect-square rounded-md border border-dashed flex items-center justify-center bg-muted/50"
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;