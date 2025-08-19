'use client';

import { useState, useRef, DragEvent, useEffect } from 'react';
import styles from './FileDropZone.module.css';

interface FileDropZoneProps {
  onFilesAdded: (files: File[]) => void;
  children: React.ReactNode;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

export default function FileDropZone({
  onFilesAdded,
  children,
  accept = "image/*,.pdf,.doc,.docx,.txt",
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const validateFiles = (files: FileList | File[]): File[] => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxSize) {
        console.warn(`Arquivo ${file.name} muito grande. Máximo: ${maxSize / 1024 / 1024}MB`);
        continue;
      }

      // Check file type if accept is specified
      if (accept && accept !== '*') {
        const acceptTypes = accept.split(',').map(type => type.trim());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const mimeType = file.type;

        const isValidType = acceptTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExtension === type;
          } else if (type.includes('*')) {
            return mimeType.startsWith(type.replace('*', ''));
          } else {
            return mimeType === type;
          }
        });

        if (!isValidType) {
          console.warn(`Tipo de arquivo ${file.name} não aceito`);
          continue;
        }
      }

      validFiles.push(file);

      // Stop if we've reached max files
      if (validFiles.length >= maxFiles) {
        break;
      }
    }

    return validFiles;
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setIsDragging(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    }
  };

  const handleDragOver = (e: DragEvent) => {
    // Don't interfere with form elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent) => {
    // Don't interfere with form elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setDragCounter(prev => prev + 1);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    // Don't interfere with form elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  };

  // Handle paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        const validFiles = validateFiles(files);
        if (validFiles.length > 0) {
          onFilesAdded(validFiles);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [disabled, onFilesAdded]);

  return (
    <div
      ref={dropZoneRef}
      className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {children}
      
      {isDragging && !disabled && (
        <div className={styles.dropOverlay}>
          <div className={styles.dropContent}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>Solte os arquivos aqui</p>
            <span>Máximo {maxFiles} arquivo{maxFiles !== 1 ? 's' : ''} • {Math.round(maxSize / 1024 / 1024)}MB cada</span>
          </div>
        </div>
      )}
    </div>
  );
}