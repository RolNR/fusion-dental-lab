'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { FileCategory, FILE_CATEGORY_LABELS } from '@/types/file';
import Image from 'next/image';

interface FileData {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  thumbnailUrl?: string;
  category: string;
  isProcessed: boolean;
  createdAt: string;
  uploadedBy: {
    name: string;
    role: string;
  };
}

interface FileListProps {
  orderId: string;
  canDelete?: boolean;
  onFileDeleted?: () => void;
}

export function FileList({ orderId, canDelete = false, onFileDeleted }: FileListProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [orderId]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/orders/${orderId}/files`);

      if (!response.ok) {
        throw new Error('Error al cargar archivos');
      }

      const data = await response.json();
      setFiles(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar archivos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      setDeletingFileId(fileId);
      const response = await fetch(`/api/orders/${orderId}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar archivo');
      }

      // Remove file from local state
      setFiles(files.filter((f) => f.id !== fileId));
      setShowDeleteConfirm(null);
      onFileDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar archivo');
    } finally {
      setDeletingFileId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryLabel = (category: string): string => {
    return FILE_CATEGORY_LABELS[category as FileCategory] || category;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-danger/10 p-4">
        <div className="flex items-center">
          <Icons.alertCircle className="h-5 w-5 text-danger mr-2" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
        <Icons.file className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No hay archivos adjuntos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="rounded-lg border border-border bg-background p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            {/* Thumbnail or Icon */}
            <div className="flex-shrink-0">
              {file.thumbnailUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                  <Image
                    src={file.thumbnailUrl}
                    alt={file.originalName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted">
                  <Icons.file className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {file.originalName}
              </h4>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  {getCategoryLabel(file.category)}
                </span>
                <span>{formatFileSize(file.fileSize)}</span>
                <span>•</span>
                <span>{formatDate(file.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Subido por: {file.uploadedBy.name}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Download Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(file.storageUrl, '_blank')}
                className="whitespace-nowrap"
              >
                <Icons.download className="h-4 w-4 mr-1" />
                Descargar
              </Button>

              {/* Delete Button */}
              {canDelete && (
                <>
                  {showDeleteConfirm === file.id ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        isLoading={deletingFileId === file.id}
                        disabled={deletingFileId === file.id}
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(null)}
                        disabled={deletingFileId === file.id}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(file.id)}
                      className="text-danger hover:text-danger"
                    >
                      <Icons.trash className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
