import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  X,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle
} from 'lucide-react';

interface DocumentUploader {
  onUpload: (file: File) => Promise<boolean>;
  onFileRemove?: () => void;
  isUploading: boolean;
  uploadStatus: 'idle' | 'uploading' | 'scanning' | 'completed' | 'error';
  fileName?: string;
  accept?: string;
  maxSize?: number; 
  errorMessage?: string;
  progress?: number;
  scanResult?: {
    completionPercentage: number;
    extractedData: any;
    requiresAttention: any[];
    errorMessage?: string;
  };
  acceptedFile?: File | null;
}

export function DocumentUploader({ 
  onUpload, 
  onFileRemove,
  isUploading,
  uploadStatus,
  fileName,
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSize = 10,
  errorMessage,
  progress = 0,
  scanResult,
  acceptedFile
}: DocumentUploader) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo no puede ser mayor a ${maxSize}MB`;
    }

    // Validar tipo
    const allowedTypes = accept.split(',').map((type: string) => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `Tipo de archivo no permitido. Formatos aceptados: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  }, [maxSize, accept]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setError(null);
      console.log('📄 Iniciando upload para renovación:', selectedFile.name);
      
      const success = await onUpload(selectedFile);
      
      if (success) {
        console.log('✅ Upload exitoso para renovación');
        setSelectedFile(null);
      } else {
        console.log('❌ Upload falló para renovación');
        setError('Error al procesar el documento. Intenta nuevamente.');
      }
    } catch (error: any) {
      console.error('❌ Error uploading file for renovacion:', error);
      setError(error.message || 'Error al subir el archivo. Intenta nuevamente.');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 🔥 NUEVO: Estado de éxito - Igual que Nueva Póliza
  if (uploadStatus === 'completed' && scanResult && acceptedFile) {
    const confidence = scanResult.completionPercentage;
    
    return (
      <Card className="border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="h-5 w-5" />
            Documento Procesado Exitosamente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-green-800 dark:text-green-200 truncate" title={acceptedFile.name}>
                  {acceptedFile.name}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 ml-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => acceptedFile && onUpload(acceptedFile)}
                className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-800"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reescanear
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onFileRemove}
                className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-800"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remover
              </Button>
            </div>
          </div>

          {scanResult.requiresAttention && scanResult.requiresAttention.length > 0 && (
            <Alert className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                {scanResult.requiresAttention.length} campo(s) requieren atención manual
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-green-500 bg-green-100 dark:bg-green-900/40">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Los datos han sido extraídos automáticamente del documento de renovación. 
              Revisa la información extraída en el siguiente paso.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // 🔥 NUEVO: Estado de error - Igual que Nueva Póliza
  if (uploadStatus === 'error' || error) {
    return (
      <Card className="border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <XCircle className="h-5 w-5" />
            Error Procesando Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="border-red-300 bg-red-100 dark:bg-red-900/40">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || errorMessage || scanResult?.errorMessage || 'Hubo un problema procesando el documento'}
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onFileRemove || clearSelection}
              className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-800"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remover
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (acceptedFile) {
                  onUpload(acceptedFile);
                } else if (selectedFile) {
                  handleUpload();
                } else {
                  document.getElementById('file-input-renovacion')?.click();
                }
              }}
              className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-800"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado de carga - Mejorado
  if (isUploading || uploadStatus === 'uploading' || uploadStatus === 'scanning') {
    return (
      <Card className="border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            {uploadStatus === 'uploading' ? 'Subiendo Documento...' : 'Procesando con IA...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(selectedFile || acceptedFile) && (
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-200 truncate">
                  {(selectedFile || acceptedFile)?.name}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  {formatFileSize((selectedFile || acceptedFile)?.size || 0)}
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Progress 
              value={uploadStatus === 'uploading' ? progress : 75} 
              className="h-2"
            />
            <p className="text-sm text-blue-600 dark:text-blue-300 text-center">
              {uploadStatus === 'uploading' 
                ? `${progress}% - Subiendo archivo al servidor...`
                : 'Extrayendo información del documento con IA...'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado inicial - Sin cambios importantes
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Documento de la Nueva Póliza
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Área de drop */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
            ${dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
              : error 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }
            ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && document.getElementById('file-input-renovacion')?.click()}
        >
          <input
            id="file-input-renovacion"
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />

          <div className="space-y-4">
            <Upload className={`h-12 w-12 mx-auto transition-colors ${
              dragActive ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {dragActive 
                  ? '¡Suelta el archivo aquí!' 
                  : 'Arrastra tu archivo aquí o haz clic para seleccionar'
                }
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Formatos soportados: PDF, JPG, PNG (máximo {maxSize}MB)
              </p>
            </div>
          </div>
        </div>

        {/* Error de validación */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Archivo seleccionado */}
        {selectedFile && !isUploading && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Quitar
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Subir y Procesar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}