// src/app/renovaciones/components/renovaciones-container.tsx
// ✅ CORREGIDO: Usar los componentes específicos de renovaciones

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Circle, 
  Search, 
  Upload, 
  FileText, 
  Send,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { useRenovaciones } from '../../../hooks/use-renovaciones';
import { ClientePolizasSearchForm } from '../step-1-search/cliente-polizas-search-form';
import { RenovacionConfirmationForm } from '../step-4-confirmation/renovacion-confirmation-form';
import { ValidationForm } from '../step-3-validation/validation-form'; // ✅ USAR VALIDATION-FORM ESPECÍFICO DE RENOVACIONES

export function RenovacionesContainer() {
  const renovacionesHook = useRenovaciones();
  const {
    state,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    nextStep,
    prevStep,
    reset,
    uploadDocumentForRenovacion,
  } = renovacionesHook;

  const mapUploadStatus = (renovacionStatus: string): 'idle' | 'uploading' | 'completed' | 'error' => {
    switch (renovacionStatus) {
      case 'uploading':
        return 'uploading';
      case 'scanning':
        return 'uploading';
      case 'completed':
        return 'completed';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  };

  const handleFileUpload = async (file: File): Promise<boolean> => {
    if (!state.context.clienteId || !state.context.seccionId) {
      console.error('❌ RENOVACIONES - Contexto incompleto:', state.context);
      return false;
    }
    
    console.log('🔄 RENOVACIONES - Iniciando upload con contexto:', {
      clienteId: state.context.clienteId,
      seccionId: state.context.seccionId,
      archivo: file.name
    });
    
    const result = await uploadDocumentForRenovacion(file);
    console.log('✅ RENOVACIONES - Resultado upload:', result);
    return result;
  };

  const getStepIcon = (stepNumber: number, isCompleted: boolean, isCurrent: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (isCurrent) {
      return <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">{stepNumber}</div>;
    }
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <Card>
            <CardContent className="pt-6">
              <ClientePolizasSearchForm hookInstance={renovacionesHook} />
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Subir Documento de Renovación</h3>
                  <p className="text-gray-600">
                    Sube la nueva póliza para procesarla y extraer los datos automáticamente
                  </p>
                </div>
                
                {/* Información de contexto */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Contexto de Renovación:</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div><strong>Cliente:</strong> {state.context?.clienteInfo?.nombre || 'No seleccionado'}</div>
                    <div><strong>Póliza Original:</strong> {state.context?.polizaOriginal?.numero || 'No seleccionada'}</div>
                    <div><strong>Compañía:</strong> {state.context?.companiaInfo?.nombre || 'Se detectará automáticamente'}</div>
                  </div>
                </div>

                {/* Upload de archivo */}
                <div className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${state.scan.status === 'uploading' || state.scan.status === 'scanning'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : state.scan.status === 'error'
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                  }
                  ${state.scan.status === 'uploading' || state.scan.status === 'scanning' ? 'pointer-events-none' : 'cursor-pointer'}
                `}
                  onClick={() => !state.isLoading && document.getElementById('file-input-renovacion')?.click()}
                >
                  <input
                    id="file-input-renovacion"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    disabled={state.isLoading}
                  />

                  {state.scan.status === 'uploading' || state.scan.status === 'scanning' ? (
                    <div className="space-y-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        {state.scan.status === 'uploading' ? 'Subiendo archivo...' : 'Procesando documento...'}
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
                          Formatos soportados: PDF, JPG, PNG (máximo 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Estado de error */}
                {state.scan.status === 'error' && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {state.scan.errorMessage || 'Error procesando el documento. Intenta nuevamente.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Estado completado */}
                {state.scan.status === 'completed' && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Documento procesado exitosamente. Los datos han sido extraídos automáticamente.
                      {state.scan.fileName && ` Archivo: ${state.scan.fileName}`}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        // ✅ USAR EL VALIDATION-FORM ESPECÍFICO DE RENOVACIONES
        return <ValidationForm hookInstance={renovacionesHook} />;

      case 4:
        return <RenovacionConfirmationForm hookInstance={renovacionesHook} />;

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Renovaciones
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona la renovación de pólizas de seguros con procesamiento automático
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          {[
            { number: 1, label: 'Buscar Cliente', icon: Search },
            { number: 2, label: 'Subir Documento', icon: Upload },
            { number: 3, label: 'Validar Datos', icon: FileText },
            { number: 4, label: 'Confirmar', icon: Send },
          ].map(({ number, label, icon: Icon }) => {
            const isCompleted = state.currentStep > number;
            const isCurrent = state.currentStep === number;
            
            return (
              <div key={number} className="flex items-center">
                <div className="flex flex-col items-center">
                  {getStepIcon(number, isCompleted, isCurrent)}
                  <span className={`mt-2 text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : 
                    isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </div>
                
                {number < 4 && (
                  <div className={`w-16 h-px mx-4 ${
                    state.currentStep > number ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mb-8">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {state.currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={prevStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reiniciar
          </Button>

          {state.currentStep < 4 && (
            <Button
              onClick={nextStep}
              disabled={
                (state.currentStep === 1 && !canProceedToStep2) ||
                (state.currentStep === 2 && !canProceedToStep3) ||
                (state.currentStep === 3 && !canProceedToStep4)
              }
              className="flex items-center gap-2"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Debug Info - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
          <details>
            <summary className="cursor-pointer font-medium mb-2">Debug State Renovaciones</summary>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify({
                currentStep: state.currentStep,
                contexto: state.context,
                scanStatus: state.scan.status,
                scanFileName: state.scan.fileName,
                hasExtractedData: !!(state.scan.extractedData && Object.keys(state.scan.extractedData).length > 0),
                hasMasterData: !!(state.masterData && Object.keys(state.masterData).length > 0),
                canProceedToStep2,
                canProceedToStep3,
                canProceedToStep4
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}