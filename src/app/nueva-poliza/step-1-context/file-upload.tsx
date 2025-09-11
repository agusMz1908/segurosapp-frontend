import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface FileUploadProps {
  disabled?: boolean;
  onFileUpload: (file: File) => Promise<boolean>;
  onFileRemove?: () => void;
  uploadProgress?: number;
  uploadStatus?: 'idle' | 'uploading' | 'completed' | 'error';
  scanStatus?: 'idle' | 'scanning' | 'completed' | 'error';
  scanResult?: {
    completionPercentage: number;
    extractedData: any;
    requiresAttention: any[];
    errorMessage?: string;
  };
  acceptedFile?: File | null;
  className?: string;
}

export function FileUpload({
  disabled = false,
  onFileUpload,
  onFileRemove,
  uploadProgress = 0,
  uploadStatus = 'idle',
  scanStatus = 'idle',
  scanResult,
  acceptedFile,
  className = ''
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      return 'Solo se permiten archivos PDF';
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return 'El archivo es muy grande. Máximo 10MB permitido';
    }

    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled) return;

    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    await onFileUpload(file);
  }, [onFileUpload, disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileSelect(file);
    };
    input.click();
  }, [disabled, handleFileSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Estado de éxito - Compacto
  if (scanStatus === 'completed' && scanResult && acceptedFile) {
    const confidence = scanResult.completionPercentage;
    
    return (
      <div className={className}>
        <div className="border border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-200">Documento procesado</span>
            </div>
            <Badge className="bg-green-600 dark:bg-green-700 text-white">
              {confidence}% confianza
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate" title={acceptedFile.name}>
                  {acceptedFile.name}
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">{formatFileSize(acceptedFile.size)}</p>
              </div>
            </div>
            
            <div className="flex gap-1 ml-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => acceptedFile && handleFileSelect(acceptedFile)}
                className="h-8 w-8 p-0 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onFileRemove}
                className="h-8 w-8 p-0 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {scanResult.requiresAttention.length > 0 && (
            <div className="mt-2 text-xs text-green-700 dark:text-green-300">
              {scanResult.requiresAttention.length} campo(s) requieren atención
            </div>
          )}
        </div>
      </div>
    );
  }

  // Estado de error - Compacto
  if (scanStatus === 'error' || uploadStatus === 'error') {
    return (
      <div className={className}>
        <div className="border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-800 dark:text-red-200">Error procesando archivo</span>
            </div>
          </div>
          
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            {scanResult?.errorMessage || 'Hubo un problema procesando el documento'}
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onFileRemove}
              className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-800"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remover
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => acceptedFile && handleFileSelect(acceptedFile)}
              className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-800"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Estado de carga - Compacto
  if (uploadStatus === 'uploading' || scanStatus === 'scanning') {
    return (
      <div className={className}>
        <div className="border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                {uploadStatus === 'uploading' ? 'Subiendo archivo...' : 'Procesando documento...'}
              </p>
              {acceptedFile && (
                <p className="text-sm text-blue-600 dark:text-blue-300 truncate" title={acceptedFile.name}>
                  {acceptedFile.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${uploadStatus === 'uploading' ? uploadProgress : 60}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              {uploadStatus === 'uploading' 
                ? `${uploadProgress}% completado` 
                : 'Extrayendo información con IA...'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado inicial - Compacto
  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
          ${disabled 
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed' 
            : dragActive 
              ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
        `}
      >
        <div className="text-center">
          <Upload className={`mx-auto h-8 w-8 mb-3 ${
            disabled 
              ? 'text-gray-400 dark:text-gray-600' 
              : dragActive 
                ? 'text-blue-500 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
          }`} />
          
          {disabled ? (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Configuración incompleta
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Completa cliente, compañía y sección
              </p>
            </div>
          ) : (
            <div>
              <p className={`text-sm font-medium mb-1 ${
                dragActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {dragActive ? 'Suelta el archivo aquí' : 'Arrastra tu PDF aquí'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                o haz clic para seleccionar
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
                className="text-xs"
              >
                <Upload className="h-3 w-3 mr-1" />
                Seleccionar PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error de validación */}
      {validationError && (
        <Alert variant="destructive" className="mt-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Información adicional */}
      <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>PDF • Máximo 10MB • Procesamiento automático con IA</p>
      </div>
    </div>
  );
}