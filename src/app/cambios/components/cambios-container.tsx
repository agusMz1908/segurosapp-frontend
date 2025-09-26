import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClientePolizasCambiosForm } from '../step-1-search/cliente-polizas-cambios-form';
import { DocumentUploadContainer } from '../step-2-info/document-upload-container';
import { ValidationForm } from '../step-3-validation/validation-form';
import { 
  CheckCircle, 
  Search, 
  Upload, 
  FileText, 
  Send,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Edit
} from 'lucide-react';
import { useCambios } from '../../../hooks/use-cambios';
import { CambioConfirmationForm } from '../step-4-confirmation/cambio-confirmacion-form';

export function CambiosContainer() {
  const cambiosHook = useCambios();
  const {
    state,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    nextStep,
    prevStep,
    reset,
  } = cambiosHook;

  const steps = [
    { 
      number: 1, 
      title: "Búsqueda", 
      description: "Cliente y Póliza a Cambiar",
      icon: Search,
    },
    { 
      number: 2, 
      title: "Documento", 
      description: "Nueva Póliza PDF",
      icon: Upload,
    },
    { 
      number: 3, 
      title: "Validación", 
      description: "Datos Extraídos",
      icon: FileText,
    },
    { 
      number: 4, 
      title: "Confirmación", 
      description: "Envío a Velneo",
      icon: Send,
    }
  ];

  const renderStepIndicator = () => {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = state.currentStep === step.number;
              const isCompleted = state.currentStep > step.number;
              const Icon = isCompleted ? CheckCircle : step.icon;
              
              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center min-w-0 flex-1">
                    {/* 🔥 CAMBIO: Usar azul en lugar de violeta para consistencia */}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 mb-3
                      ${isCompleted 
                        ? 'bg-blue-500 border-blue-500 text-white shadow-lg' 
                        : isActive 
                          ? 'bg-blue-500 border-blue-500 text-white shadow-lg scale-110'
                          : 'border-gray-300 text-gray-400 bg-white dark:bg-gray-800 dark:border-gray-600'
                      }
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="text-center">
                      <h3 className={`font-semibold text-sm mb-1 ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-4 transition-colors duration-300
                      ${isCompleted ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}
                    `} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <ClientePolizasCambiosForm hookInstance={cambiosHook} />
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="max-w-4xl mx-auto">
            <DocumentUploadContainer hookInstance={cambiosHook} />
          </div>
        );

      case 3:
        return (
          <div className="w-full h-full">
            <ValidationForm hookInstance={cambiosHook} />
          </div>
        );

      case 4:
        return (
          <div className="max-w-4xl mx-auto">
            <CambioConfirmationForm hookInstance={cambiosHook} />
          </div>
        );

      default:
        return null;
    }
  };

  const renderNavigation = () => {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={state.currentStep === 1 || state.isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {state.isLoading && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">
                    {state.scan.status === 'scanning' && 'Escaneando...'}
                    {state.scan.status === 'uploading' && 'Subiendo archivo...'}
                  </span>
                </div>
              )}
              
              <Button 
                onClick={nextStep}
                disabled={
                  state.isLoading ||
                  (state.currentStep === 1 && !canProceedToStep2) ||
                  (state.currentStep === 2 && !canProceedToStep3) ||
                  (state.currentStep === 3 && !canProceedToStep4)
                }
                className="min-w-[100px] bg-blue-600 hover:bg-blue-700"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {state.currentStep === 1 && !canProceedToStep2 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Selecciona un cliente y una póliza para modificar.
              </AlertDescription>
            </Alert>
          )}

          {state.currentStep === 2 && !canProceedToStep3 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sube y procesa un documento para continuar al siguiente paso.
              </AlertDescription>
            </Alert>
          )}

          {state.currentStep === 3 && !canProceedToStep4 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Completa la información requerida para proceder con el cambio.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderErrorState = () => {
    if (state.scan.status === 'error') {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex justify-between items-center">
              <span>
                Error procesando documento: {state.scan.errorMessage || 'Error desconocido'}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reiniciar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <div className="px-4 lg:px-6 xl:px-8 py-6 space-y-6 w-full">
      {/* Header - Solo mostrar si no es paso 3 para no duplicar */}
      {state.currentStep !== 3 && (
        <div className="text-center mb-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Cambios de Póliza
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona cambios en pólizas vigentes con procesamiento automático
          </p>
        </div>
      )}

      {/* Step Indicator - Mostrar siempre excepto que tengamos error */}
      {state.scan.status !== 'error' && (
        <div className="max-w-4xl mx-auto">
          {renderStepIndicator()}
        </div>
      )}
      
      {/* Error State - Solo mostrar si no es paso 3 */}
      {state.currentStep !== 3 && (
        <div className="max-w-4xl mx-auto">
          {renderErrorState()}
        </div>
      )}
      
      {/* Content Area - Usar ancho completo solo en paso 3 */}
      <div className={state.currentStep === 3 ? "min-h-[600px] w-full" : "max-w-4xl mx-auto min-h-[600px]"}>
        {renderCurrentStep()}
      </div>

      {/* Navigation - Mostrar siempre excepto cuando el cambio esté completado */}
      {!(state.currentStep === 4 && state.processCompleted) && (
        <div className="max-w-4xl mx-auto">
          {renderNavigation()}
        </div>
      )}

      {/* Debug Info - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs max-w-4xl mx-auto">
          <details>
            <summary className="cursor-pointer font-medium mb-2">Debug State Cambios</summary>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify({
                currentStep: state.currentStep,
                contexto: state.context,
                scanStatus: state.scan.status,
                scanFileName: state.scan.fileName,
                hasExtractedData: !!(state.scan.extractedData && Object.keys(state.scan.extractedData).length > 0),
                hasMasterData: !!(state.masterData && Object.keys(state.masterData).length > 0),
                canProceedToStep2: canProceedToStep2(),
                canProceedToStep3: canProceedToStep3(),
                canProceedToStep4: canProceedToStep4(),
                processCompleted: state.processCompleted
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}