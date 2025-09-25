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
  RefreshCw,
  Download,
  ExternalLink
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
        }, 800);
        
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
      }, 800);
    }
  };

  const handleDownload = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const openInNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg flex flex-col rounded-lg overflow-hidden ${className}`}>
      
      {/* Header del visor mejorado */}
      <Card className="flex-shrink-0 rounded-none border-0 border-b border-gray-200 dark:border-gray-700">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              <FileText className="h-4 w-4" />
              Visor PDF
            </CardTitle>
            
            {/* Botones de acción */}
            <div className="flex items-center gap-2">
              {fileUrl && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    title="Descargar PDF"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openInNewTab}
                    className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    title="Abrir en nueva pestaña"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {file && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={file.name}>
                {file.name}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Área de visualización del PDF mejorada */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando PDF...</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Inicializando visor del navegador
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <div className="space-y-3">
                  <span>{error}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retry}
                      className="h-8 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reintentar
                    </Button>
                    
                    {file && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="h-8 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Descargar
                      </Button>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {fileUrl && !error && (
          <>
            {/* Embed PDF como alternativa más compatible */}
            <embed
              src={fileUrl}
              type="application/pdf"
              className="w-full h-full"
              style={{ minHeight: '100%' }}
            />
            
            {/* Fallback iframe si embed no funciona */}
            <noscript>
              <iframe
                src={fileUrl}
                className="w-full h-full border-0 bg-white"
                title="Visor PDF"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{ 
                  minHeight: '100%',
                  backgroundColor: '#ffffff'
                }}
                allowFullScreen
              />
            </noscript>
            
            {/* Fallback para navegadores que no soportan PDF */}
            <div className="hidden" id="pdf-fallback">
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Vista previa no disponible
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Tu navegador no puede mostrar este PDF directamente
                  </p>
                  <div className="space-y-2">
                    <Button onClick={handleDownload} size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                    <Button onClick={openInNewTab} variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir en nueva pestaña
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!fileUrl && !loading && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No hay documento para mostrar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}