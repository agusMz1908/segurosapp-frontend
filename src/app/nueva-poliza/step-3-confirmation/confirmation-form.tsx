// step-3-confirmation/confirmation-form.tsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { SuccessState } from './success-state';
import { SendingState } from './sending-state';
import { ErrorState } from './error-state';
import { ReviewState } from './review-state';

interface ConfirmationFormProps {
  hookInstance: any;
}

export function ConfirmationForm({ hookInstance }: ConfirmationFormProps) {
  const { state } = hookInstance;

  console.log('CONFIRMATION STATUS:', state.step3.status);

  // Estado de éxito
  if (state.step3.status === 'completed') {
    console.log('Rendering SuccessState');
    return (
      <SuccessState 
        polizaNumber={state.step3.polizaNumber} 
        velneoUrl={state.step3.velneoUrl} 
      />
    );
  }

  // Estado de envío en progreso
  if (state.step3.status === 'creating') {
    console.log('Rendering SendingState');
    return <SendingState />;
  }

  // Estado de error
  if (state.step3.status === 'error') {
    console.log('Rendering ErrorState');
    return (
      <ErrorState 
        hookInstance={hookInstance} 
        errorMessage={state.step3.errorMessage} 
      />
    );
  }

  // Estado inicial - Revisión final
  console.log('Rendering ReviewState (default)');
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Revisar y Confirmar</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Verifica toda la información antes del envío final a Velneo
        </p>
      </div>

      <ReviewState hookInstance={hookInstance} />

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Al hacer clic en "Enviar a Velneo", se creará la póliza definitivamente 
          en tu sistema. Asegúrate de que toda la información sea correcta antes de continuar.
        </AlertDescription>
      </Alert>
    </div>
  );
}