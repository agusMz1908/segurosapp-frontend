"use client";

import React from 'react';
import { CreatePolizaHandler } from '@/components/poliza/create-poliza-handler';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Circle, 
  Upload, 
  FileText, 
  Send,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useNuevaPoliza } from '../../../hooks/use-nueva-poliza';
import { ContextForm } from '../step-1-context/context-form';
import { ValidationForm } from '../step-2-validation/validation-form';
import { ConfirmationForm } from '../step-3-confirmation/confirmation-form';

export function NuevaPolizaContainer() {
  const hookInstance = useNuevaPoliza(); // Una sola instancia
  const {
    state,
    isContextValid,
    canProceedToStep2,
    canProceedToStep3,
    nextStep,
    prevStep,
    reset,
    cancelOperation
  } = hookInstance;

  const steps = [
    { 
      number: 1, 
      title: "Contexto", 
      description: "Cliente, Compañía y Sección",
      icon: Circle,
      isValid: isContextValid
    },
    { 
      number: 2, 
      title: "Validación", 
      description: "Escaneo y Datos Maestros",
      icon: FileText,
      isValid: canProceedToStep2
    },
    { 
      number: 3, 
      title: "Confirmación", 
      description: "Envío a Velneo",
      icon: Send,
      isValid: canProceedToStep3
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

  // Pasar hookInstance a todos los componentes
  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <ContextForm hookInstance={hookInstance} />;       
      case 2:
        return <ValidationForm hookInstance={hookInstance} />;     
      case 3:
        return <ConfirmationForm hookInstance={hookInstance} />;   
      default:
        return null;
    }
  };

  const renderNavigation = () => {
    // No mostrar navegación si estamos en estado de éxito
    if (state.step3.status === 'completed') {
      return null;
    }

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
              
              {(state.scan.status === 'scanning' || state.step3.status === 'creating') && (
                <Button 
                  variant="outline" 
                  onClick={cancelOperation}
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Cancelar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {state.isLoading && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">
                    {state.scan.status === 'scanning' && 'Escaneando...'}
                    {state.scan.status === 'uploading' && 'Subiendo archivo...'}
                    {state.step3.status === 'creating' && 'Enviando a Velneo...'}
                  </span>
                </div>
              )}
              
              <Button 
                onClick={() => {
                  if (state.currentStep === 3) {
                    console.log('Finalizando y redirigiendo al dashboard...');
                    window.location.href = '/dashboard';
                  } else {
                    nextStep();
                  }
                }}
                disabled={
                  state.isLoading ||
                  (state.currentStep === 1 && !isContextValid) ||
                  (state.currentStep === 2 && state.scan.status !== 'completed') ||
                  (state.currentStep === 3 && !canProceedToStep3)
                }
                className="min-w-[100px]"
              >
                {state.currentStep === 3 ? 'Finalizar' : 'Siguiente'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {state.currentStep === 1 && !isContextValid && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Selecciona el cliente, compañía y sección para continuar.
              </AlertDescription>
            </Alert>
          )}

          {state.currentStep === 2 && state.scan.status !== 'completed' && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sube y procesa un documento para continuar al siguiente paso.
              </AlertDescription>
            </Alert>
          )}

          {state.currentStep === 3 && !canProceedToStep3 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Completa todos los datos requeridos para poder crear la póliza.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderErrorState = () => {
    if (state.scan.status === 'error' || state.step3.status === 'error') {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex justify-between items-center">
              <span>
                {state.scan.status === 'error' 
                  ? `Error escaneando: ${state.scan.errorMessage || 'Error desconocido'}`
                  : `Error enviando a Velneo: ${state.step3.errorMessage || 'Error desconocido'}`
                }
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
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Nueva Póliza</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Proceso guiado para crear una nueva póliza desde documento PDF.
        </p>
      </div>

      {renderStepIndicator()}
      {renderErrorState()}
      
      <div className="min-h-[600px]">
        {renderCurrentStep()}
      </div>

      {renderNavigation()}
    </div>
  );
}