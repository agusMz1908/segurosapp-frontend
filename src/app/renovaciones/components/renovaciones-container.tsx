import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Circle, 
  Search, 
  Info, 
  FileText, 
  Send,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { useRenovaciones } from '../../../hooks/use-renovaciones';

// Importar componentes de pasos
import { PolizaSearchForm } from '../step-1-search/poliza-search-form';
import { PolizaInfoView } from '../step-2-info/poliza-info-view';
// import { ValidationForm } from '../step-3-validation/validation-form';
// import { RenovacionConfirmationForm } from '../step-4-confirmation/renovacion-confirmation-form';

const ValidationForm = ({ hookInstance }: { hookInstance: any }) => (
  <div className="p-8 text-center">
    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold mb-2">Paso 3: Validación</h3>
    <p className="text-gray-600">Reutilizar de nueva póliza...</p>
  </div>
);

const RenovacionConfirmationForm = ({ hookInstance }: { hookInstance: any }) => (
  <div className="p-8 text-center">
    <Send className="h-16 w-16 mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold mb-2">Paso 4: Confirmación</h3>
    <p className="text-gray-600">Componente en desarrollo...</p>
  </div>
);

export function RenovacionesContainer() {
  const hookInstance = useRenovaciones();
  const {
    state,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    isPolizaRenovable,
    getDiasParaVencimiento,
    nextStep,
    prevStep,
    reset
  } = hookInstance;

  const steps = [
    { 
      number: 1, 
      title: "Buscar Póliza", 
      description: "Seleccionar póliza a renovar",
      icon: Search,
      isValid: canProceedToStep2
    },
    { 
      number: 2, 
      title: "Información", 
      description: "Revisar datos heredados",
      icon: Info,
      isValid: canProceedToStep3
    },
    { 
      number: 3, 
      title: "Validación", 
      description: "Escanear nueva póliza",
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
                      isActive ? 'text-blue-600 dark:text-blue-400' 
                      : isCompleted ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
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
        return <PolizaSearchForm hookInstance={hookInstance} />;       
      case 2:
        return <PolizaInfoView hookInstance={hookInstance} />;     
      case 3:
        return <ValidationForm hookInstance={hookInstance} />;   
      case 4:
        return <RenovacionConfirmationForm hookInstance={hookInstance} />;
      default:
        return null;
    }
  };

  const renderNavigation = () => {
    // No mostrar navegación si la renovación está completada
    if (state.renovacion.status === 'completed') {
      return (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold text-lg">¡Renovación Completada!</span>
              </div>
              
              {state.renovacion.result && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Nueva póliza:</strong> {state.renovacion.result.polizaNumber}
                  </p>
                  {state.renovacion.result.velneoPolizaId && (
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>ID Velneo:</strong> {state.renovacion.result.velneoPolizaId}
                    </p>
                  )}
                </div>
              )}
              
              <Button onClick={reset} className="mt-4">
                <RotateCcw className="h-4 w-4 mr-2" />
                Procesar Nueva Renovación
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

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
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              
              <Button 
                variant="outline" 
                onClick={reset}
                className="text-gray-600 dark:text-gray-400"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            </div>

            {/* Información del estado actual */}
            <div className="flex items-center space-x-4">
              {state.polizaAnterior && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Póliza: {state.polizaAnterior.numero}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {state.polizaAnterior.cliente.nombre}
                  </p>
                </div>
              )}

              {state.polizaAnterior && !isPolizaRenovable() && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Fuera del rango de renovación
                </Badge>
              )}

              {state.polizaAnterior && isPolizaRenovable() && (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {getDiasParaVencimiento() >= 0 
                    ? `${getDiasParaVencimiento()} días para vencer`
                    : `Vencida hace ${Math.abs(getDiasParaVencimiento())} días`
                  }
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={nextStep}
                disabled={!canProceedToNextStep()}
                className={canProceedToNextStep() ? '' : 'opacity-50'}
              >
                {state.currentStep === 4 ? 'Finalizar' : 'Siguiente'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const canProceedToNextStep = () => {
    switch (state.currentStep) {
      case 1:
        return canProceedToStep2();
      case 2:
        return canProceedToStep3();
      case 3:
        return canProceedToStep4();
      case 4:
        return false; // No hay paso siguiente
      default:
        return false;
    }
  };

  const renderAlerts = () => {
    const alerts = [];

    // Alerta si la póliza no es renovable
    if (state.polizaAnterior && !isPolizaRenovable()) {
      const diasVencimiento = getDiasParaVencimiento();
      alerts.push(
        <Alert key="no-renovable" variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta póliza no puede ser renovada. 
            {diasVencimiento > 60 
              ? ` Vence en ${diasVencimiento} días (máximo 60 días antes).`
              : ` Venció hace ${Math.abs(diasVencimiento)} días (máximo 30 días después).`
            }
          </AlertDescription>
        </Alert>
      );
    }

    // Alerta de estado de procesamiento
    if (state.renovacion.status === 'processing') {
      alerts.push(
        <Alert key="processing" className="mb-4">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Procesando renovación en Velneo... Esto puede tomar unos momentos.
          </AlertDescription>
        </Alert>
      );
    }

    // Alerta de errores
    if (state.renovacion.status === 'error') {
      alerts.push(
        <Alert key="error" variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error procesando la renovación. Por favor, revisa los datos e intenta nuevamente.
          </AlertDescription>
        </Alert>
      );
    }

    // Alerta de scan con errores
    if (state.scan.errors && state.scan.errors.length > 0) {
      alerts.push(
        <Alert key="scan-errors" variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Errores en el escaneo: {state.scan.errors.join(', ')}
          </AlertDescription>
        </Alert>
      );
    }

    return alerts;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Renovación de Pólizas
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Renueva pólizas existentes manteniendo el contexto original y actualizando la información necesaria
          </p>
        </div>

        {/* Alertas */}
        {renderAlerts()}

        {/* Indicador de pasos */}
        {renderStepIndicator()}

        {/* Contenido del paso actual */}
        <Card className="mb-6">
          <CardContent className="p-0">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navegación */}
        {renderNavigation()}

        {/* Información de debug (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-6 border-dashed border-gray-300">
            <CardContent className="pt-6">
              <details className="text-sm text-gray-500">
                <summary className="cursor-pointer font-medium mb-2">Debug Info</summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                  {JSON.stringify({
                    currentStep: state.currentStep,
                    polizaAnteriorId: state.polizaAnterior?.id,
                    scanStatus: state.scan.status,
                    renovacionStatus: state.renovacion.status,
                    canProceed: {
                      step2: canProceedToStep2(),
                      step3: canProceedToStep3(),
                      step4: canProceedToStep4()
                    },
                    isRenovable: isPolizaRenovable(),
                    diasVencimiento: getDiasParaVencimiento()
                  }, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}