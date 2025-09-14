'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { SUPPORTED_MEDIA_TYPES, MAX_FILE_SIZES, formatFileSize } from '@our-line-in-time/shared';

interface MediaUploadProps {
  memoryId: string;
  onUploadComplete?: (mediaItems: any[]) => void;
  onUploadError?: (error: string) => void;
  multiple?: boolean;
  className?: string;
}

interface UploadFile extends File {
  id: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function MediaUpload({
  memoryId,
  onUploadComplete,
  onUploadError,
  multiple = true,
  className = '',
}: MediaUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      ...file,
      id: crypto.randomUUID(),
      status: 'pending' as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFiles((prev) => (multiple ? [...prev, ...newFiles] : newFiles));
  }, [multiple]);

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      // Revoke URL for removed files
      const removed = prev.find((f) => f.id === fileId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const pendingFiles = files.filter((f) => f.status === 'pending');
    const uploadedItems: any[] = [];

    try {
      for (const file of pendingFiles) {
        // Update file status
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' } : f))
        );

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('memoryId', memoryId);

          const response = await fetch('/api/media/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          uploadedItems.push(result.mediaItem);

          // Update file status to complete
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, status: 'complete' } : f))
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';

          // Update file status to error
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, status: 'error', error: errorMessage } : f
            )
          );
        }
      }

      if (uploadedItems.length > 0) {
        onUploadComplete?.(uploadedItems);
      }

      // Check for any errors
      const hasErrors = files.some((f) => f.status === 'error');
      if (hasErrors) {
        onUploadError?.('Some files failed to upload');
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const clearCompleted = () => {
    setFiles((prev) => {
      const completed = prev.filter((f) => f.status === 'complete');
      completed.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      return prev.filter((f) => f.status !== 'complete');
    });
  };

  const allSupportedTypes = [
    ...SUPPORTED_MEDIA_TYPES.IMAGES,
    ...SUPPORTED_MEDIA_TYPES.VIDEOS,
    ...SUPPORTED_MEDIA_TYPES.AUDIO,
  ];

  const maxSize = Math.max(MAX_FILE_SIZES.IMAGE, MAX_FILE_SIZES.VIDEO, MAX_FILE_SIZES.AUDIO);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allSupportedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple,
  });

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />

        {isDragActive ? (
          <p className="text-blue-600">Drop files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop media files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports images, videos, and audio files up to {formatFileSize(maxSize)}
            </p>
          </div>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Files ({files.length})</h3>
            <div className="space-x-2">
              {files.some((f) => f.status === 'complete') && (
                <button
                  onClick={clearCompleted}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear completed
                </button>
              )}
              {files.some((f) => f.status === 'pending') && (
                <button
                  onClick={uploadFiles}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-3 p-3 border rounded-lg"
              >
                {file.preview && (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-500">{file.error}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusIcon(file.status)}

                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}