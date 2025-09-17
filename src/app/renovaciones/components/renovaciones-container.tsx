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
  RotateCcw
} from 'lucide-react';
import { useRenovaciones } from '../../../hooks/use-renovaciones';
import { useNuevaPoliza } from '../../../hooks/use-nueva-poliza';
import { ClientePolizasSearchForm } from '../step-1-search/cliente-polizas-search-form';
import { RenovacionConfirmationForm } from '../step-4-confirmation/renovacion-confirmation-form';
import { FileUpload } from '../../nueva-poliza/step-1-context/file-upload';
import { ExtractedDataForm } from '../../nueva-poliza/step-2-validation/extracted-data-form';
import { MasterDataForm } from '../../nueva-poliza/step-2-validation/master-data-form';

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
  } = renovacionesHook;

  const nuevaPolizaHook = useNuevaPoliza();

  const handleFileUpload = async (file: File): Promise<boolean> => {
    if (!state.context.clienteId || !state.context.seccionId) {
      console.error('Contexto incompleto para renovación:', state.context);
      return false;
    }
    
    const tempContext = {
      clienteId: state.context.clienteId,
      companiaId: 1, 
      seccionId: state.context.seccionId,
      clienteInfo: state.context.clienteInfo,
      companiaInfo: { id: 1, nombre: 'Detectando...', codigo: 'TEMP' },
      seccionInfo: state.context.seccionInfo,
    };
    
    nuevaPolizaHook.updateContext(tempContext);

    const result = await nuevaPolizaHook.uploadWithContext(file);
    return result;
  };

  React.useEffect(() => {
    if (nuevaPolizaHook.state.scan.status === 'completed' && 
        nuevaPolizaHook.state.context.companiaId &&
        nuevaPolizaHook.state.context.companiaId !== 1) { 
      
      console.log('🔄 Sincronizando compañía detectada:', {
        companiaDetectada: nuevaPolizaHook.state.context.companiaInfo,
        contextoAnterior: state.context.companiaInfo
      });
      
      renovacionesHook.updateState({
        context: {
          ...state.context,
          companiaId: nuevaPolizaHook.state.context.companiaId,
          companiaInfo: nuevaPolizaHook.state.context.companiaInfo,
        }
      });
    }
  }, [
    nuevaPolizaHook.state.scan.status,
    nuevaPolizaHook.state.context.companiaId,
    nuevaPolizaHook.state.context.companiaInfo,
    state.context,
    renovacionesHook
  ]);

  const steps = [
    { 
      number: 1, 
      title: "Buscar Póliza", 
      description: "Cliente y póliza a renovar",
      icon: Circle,
      isValid: canProceedToStep2
    },
    { 
      number: 2, 
      title: "Documento", 
      description: "Escanear nueva póliza",
      icon: Upload,
      isValid: canProceedToStep3
    },
    { 
      number: 3, 
      title: "Validación", 
      description: "Datos y maestros",
      icon: FileText,
      isValid: canProceedToStep4
    },
    { 
      number: 4, 
      title: "Confirmación", 
      description: "Procesar renovación",
      icon: Send,
      isValid: state.renovacion.status === 'completed'
    }
  ];

  const renderStepIndicator = () => (
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
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 mb-3
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white shadow-lg scale-110'
                        : 'border-gray-300 text-gray-400 bg-white dark:bg-gray-800 dark:border-gray-600'
                    }
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className={`font-semibold text-sm mb-1 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
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
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}
                  `} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <ClientePolizasSearchForm hookInstance={renovacionesHook} />;
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Escanear Nueva Póliza
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Sube el documento de la nueva póliza renovada
              </p>
            </div>

            <Alert>
              <Search className="h-4 w-4" />
              <AlertDescription>
                <strong>Renovando póliza:</strong> {state.cliente.selectedPoliza?.conpol} - 
                Cliente: {state.context.clienteInfo?.nombre} - 
                Sección: {state.context.seccionInfo?.nombre} - 
                La compañía se detectará automáticamente del documento escaneado
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6">
                <FileUpload
                  disabled={false}
                  onFileUpload={handleFileUpload} 
                  uploadProgress={nuevaPolizaHook.state.file.uploadProgress}
                  uploadStatus={
                    nuevaPolizaHook.state.file.uploaded ? 'completed' : 
                    nuevaPolizaHook.state.scan.status === 'scanning' ? 'uploading' : 
                    'idle'
                  }
                  scanStatus={
                    nuevaPolizaHook.state.scan.status === 'uploading' ? 'scanning' : 
                    nuevaPolizaHook.state.scan.status
                  }
                  scanResult={{
                    completionPercentage: nuevaPolizaHook.state.scan.completionPercentage,
                    extractedData: nuevaPolizaHook.state.scan.extractedData,
                    requiresAttention: nuevaPolizaHook.state.scan.requiresAttention,
                    errorMessage: nuevaPolizaHook.state.scan.errorMessage,
                  }}
                  acceptedFile={nuevaPolizaHook.state.file.selected}
                />
              </CardContent>
            </Card>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Validar Información de Renovación
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Revisa los datos extraídos y completa la información maestra
              </p>
            </div>

            <Alert>
              <Search className="h-4 w-4" />
              <AlertDescription>
                <strong>Renovando:</strong> {state.cliente.selectedPoliza?.conpol} → Nueva póliza escaneada
              </AlertDescription>
            </Alert>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="pt-6">
                    <ExtractedDataForm hookInstance={nuevaPolizaHook} />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <MasterDataForm hookInstance={nuevaPolizaHook} />
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Póliza Original</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Número:</strong> {state.cliente.selectedPoliza?.conpol}</p>
                        <p><strong>Vencimiento:</strong> {new Date(state.cliente.selectedPoliza?.confchhas).toLocaleDateString()}</p>
                        <p><strong>Premio:</strong> ${state.cliente.selectedPoliza?.conpremio?.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <RenovacionConfirmationForm 
            renovacionesHook={renovacionesHook}
            nuevaPolizaHook={nuevaPolizaHook}
          />
        );
      
      default:
        return null;
    }
  };

  const renderNavigation = () => {
    if (state.renovacion.status === 'completed') {
      return null;
    }

    const canProceed = () => {
      switch (state.currentStep) {
        case 1: return canProceedToStep2;
        case 2: return nuevaPolizaHook.state.scan.status === 'completed';
        case 3: return nuevaPolizaHook.canProceedToStep3;
        case 4: return false; 
        default: return false;
      }
    };

    const getNextButtonText = () => {
      switch (state.currentStep) {
        case 4: return 'Procesar Renovación';
        default: return 'Siguiente';
      }
    };

    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={state.currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              
              <Button 
                variant="outline" 
                onClick={reset}
                className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reiniciar
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                onClick={nextStep}
                disabled={!canProceed()}
                className="min-w-[120px]"
              >
                {getNextButtonText()}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Renovación de Pólizas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Proceso guiado para renovar pólizas existentes con nuevo documento PDF
        </p>
      </div>

      {renderStepIndicator()}
      
      <div className="min-h-[600px]">
        {renderCurrentStep()}
      </div>

      {renderNavigation()}
    </div>
  );
}