'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { File as FileIcon, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadInputProps {
  value?: File[];
  onValueChange?: (files: File[]) => void;
}

export default function FileUploadInput({ value = [], onValueChange }: FileUploadInputProps) {
  const [files, setFiles] = useState<File[]>(value);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      onValueChange?.(newFiles);
    },
    [files, onValueChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
  });

  const removeFile = (fileToRemove: File) => {
    const newFiles = files.filter(file => file !== fileToRemove);
    setFiles(newFiles);
    onValueChange?.(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
            Arrastra y suelta archivos aquí, o <span className="font-semibold text-primary">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG (máx. 5MB por archivo)</p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
            <h4 className="text-sm font-medium">Archivos seleccionados:</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-2 border rounded-md bg-secondary/50">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file)}>
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
