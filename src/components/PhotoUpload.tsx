'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Camera, X, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { processImage, ACCEPTED_IMAGE_TYPES } from '@/lib/image-utils';
import { Button } from '@/components/ui/Button';

interface PhotoUploadProps {
  label: string;
  description?: string;
  required?: boolean;
  guidelines?: string[];
  onPhotoChange: (base64: string | null) => void;
  className?: string;
}

export function PhotoUpload({
  label,
  description,
  required = false,
  guidelines,
  onPhotoChange,
  className,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    const result = await processImage(file);

    if (result.error) {
      setError(result.error);
      setIsProcessing(false);
      return;
    }

    setPreview(result.base64);
    onPhotoChange(result.base64);
    setIsProcessing(false);
  }, [onPhotoChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const clearPhoto = useCallback(() => {
    setPreview(null);
    setError(null);
    onPhotoChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onPhotoChange]);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-accent ml-1">*</span>}
        </label>
      </div>

      {description && (
        <p className="text-sm text-foreground-muted mb-3">{description}</p>
      )}

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative aspect-[3/4] max-w-xs rounded-2xl overflow-hidden border border-border-accent bg-background-tertiary"
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={clearPhoto}
                className="p-2 bg-background/80 backdrop-blur rounded-full hover:bg-background transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 bg-success/20 backdrop-blur rounded-full">
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-medium text-success">Ready</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'relative aspect-[3/4] max-w-xs rounded-2xl border-2 border-dashed transition-all duration-200',
              isDragging
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-border-accent bg-background-secondary',
              error && 'border-error'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              capture="user"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-foreground-muted">Processing...</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-background-tertiary flex items-center justify-center mb-4">
                    {isDragging ? (
                      <Upload className="w-6 h-6 text-accent" />
                    ) : (
                      <Camera className="w-6 h-6 text-foreground-muted" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {isDragging ? 'Drop your photo' : 'Upload photo'}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    Tap to take or choose a photo
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-3 p-3 bg-error/10 border border-error/20 rounded-xl"
        >
          <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
          <span className="text-sm text-error">{error}</span>
        </motion.div>
      )}

      {guidelines && guidelines.length > 0 && (
        <div className="mt-4 p-4 bg-background-tertiary rounded-xl">
          <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2">
            Photo Guidelines
          </p>
          <ul className="space-y-1.5">
            {guidelines.map((guideline, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                <span className="text-accent mt-0.5">•</span>
                {guideline}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
