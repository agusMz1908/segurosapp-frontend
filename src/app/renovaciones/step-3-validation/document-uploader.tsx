// src/app/renovaciones/step-3-validation/document-uploader.tsx
import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';

interface DocumentUploaderProps {
  onUpload: (file: File) => Promise<boolean>;
  isUploading: boolean;
  uploadStatus: 'idle' | 'uploading' | 'completed' | 'error';
  fileName?: string;
  accept?: string;
  maxSize?: number; // en MB
}

export function DocumentUploader({ 
  onUpload, 
  isUploading,
  uploadStatus,
  fileName,
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSize = 10 
}: DocumentUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo no puede ser mayor a ${maxSize}MB`;
    }

    // Validar tipo
    const allowedTypes = accept.split(',').map(type => type.trim());
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
      console.log('🔄 Iniciando upload para renovación:', selectedFile.name);
      
      const success = await onUpload(selectedFile);
      
      if (success) {
        console.log('✅ Upload exitoso');
        setSelectedFile(null);
      } else {
        console.log('❌ Upload falló');
        setError('Error al procesar el documento. Intenta nuevamente.');
      }
    } catch (error: any) {
      console.error('❌ Error uploading file:', error);
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

  // Si el upload está completado, mostrar estado de éxito
  if (uploadStatus === 'completed') {
    return (
      <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-8 w-8" />
              <span className="font-semibold text-lg">Documento Procesado Exitosamente</span>
            </div>
            
            {fileName && (
              <p className="text-sm text-green-800 dark:text-green-200">
                Archivo: {fileName}
              </p>
            )}
            
            <Alert className="border-green-500 bg-green-100 dark:bg-green-900/40">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Los datos han sido extraídos automáticamente. Revisa la información extraída abajo y procede al siguiente paso.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : error 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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

          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {uploadStatus === 'uploading' ? 'Subiendo archivo...' : 'Procesando documento...'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Por favor espera mientras extraemos la información del documento
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Formatos soportados: PDF, JPG, PNG (máximo {maxSize}MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Archivo seleccionado */}
        {selectedFile && !isUploading && (
          <Card>
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
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Subir y Procesar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información adicional */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            El sistema extraerá automáticamente la información de la nueva póliza y la comparará 
            con los datos de la póliza anterior para facilitar el proceso de renovación.
          </AlertDescription>
        </Alert>

        {/* Tips */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Tips para mejores resultados:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Usa documentos con buena calidad de imagen</li>
            <li>Asegúrate de que el texto sea legible</li>
            <li>Los PDFs nativos dan mejores resultados que escaneos</li>
            <li>Evita documentos con marcas de agua excesivas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}