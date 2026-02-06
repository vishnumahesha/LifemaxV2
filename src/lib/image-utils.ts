// Image processing utilities for client-side

import imageCompression from 'browser-image-compression';

export const MAX_FILE_SIZE_MB = 4; // Max file size in MB
export const MAX_WIDTH_PX = 1920; // Max image width
export const MAX_HEIGHT_PX = 1920; // Max image height
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

// Validate image file
export function validateImageFile(file: File): ImageValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a JPEG, PNG, or WebP image.',
    };
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB * 2) {
    return {
      valid: false,
      error: `Image is too large (${sizeMB.toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB * 2}MB.`,
    };
  }

  return { valid: true };
}

// Compress image if needed
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: MAX_FILE_SIZE_MB,
    maxWidthOrHeight: Math.max(MAX_WIDTH_PX, MAX_HEIGHT_PX),
    useWebWorker: true,
    fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original if compression fails
  }
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Process image: validate, compress, convert to base64
export async function processImage(file: File): Promise<{ base64: string; error?: string }> {
  // Validate
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { base64: '', error: validation.error };
  }

  try {
    // Compress
    const compressed = await compressImage(file);
    
    // Convert to base64
    const base64 = await fileToBase64(compressed);
    
    return { base64 };
  } catch (error) {
    console.error('Image processing failed:', error);
    return { base64: '', error: 'Failed to process image. Please try again.' };
  }
}

// Get image dimensions from base64
export function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = base64;
  });
}

// Create thumbnail from base64
export async function createThumbnail(base64: string, maxSize: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = base64;
  });
}
