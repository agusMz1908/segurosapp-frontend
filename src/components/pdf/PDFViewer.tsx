'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  X,
  FileText,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface PDFViewerProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function PDFViewer({ file, isOpen, onClose, className = '' }: PDFViewerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Crear y limpiar URL del archivo
  useEffect(() => {
    if (file && isOpen) {
      try {
        const url = URL.createObjectURL(file);
        console.log('PDF URL creada:', url);
        setFileUrl(url);
        setLoading(true);
        setError(null);
        
        const timer = setTimeout(() => {
          setLoading(false);
        }, 500);
        
        return () => {
          URL.revokeObjectURL(url);
          clearTimeout(timer);
        };
      } catch (err) {
        console.error('Error creando URL:', err);
        setError('Error procesando el archivo PDF');
        setLoading(false);
      }
    } else {
      setFileUrl(null);
      setLoading(false);
      setError(null);
    }
  }, [file, isOpen]);

  const handleIframeError = () => {
    setError('No se pudo cargar el PDF. Tu navegador podría no soportar la visualización de PDFs.');
    setLoading(false);
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  const retry = () => {
    if (file) {
      setError(null);
      setLoading(true);
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg flex flex-col rounded-lg overflow-hidden ${className}`}>
      
      {/* Header del visor */}
      <Card className="flex-shrink-0 rounded-none border-0 border-b border-gray-200 dark:border-gray-700">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              <FileText className="h-4 w-4" />
              Visor PDF
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {file && (
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={file.name}>
              {file.name}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Área de visualización del PDF */}
      <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">Cargando PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3">
            <Alert variant="destructive">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                <div className="space-y-2">
                  <span>{error}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retry}
                    className="w-full h-6 text-xs"
                  >
                    <RefreshCw className="h-2 w-2 mr-1" />
                    Reintentar
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {fileUrl && !error && (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title="Visor PDF"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ minHeight: '100%' }}
          />
        )}

        {!fileUrl && !loading && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No hay documento para mostrar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}