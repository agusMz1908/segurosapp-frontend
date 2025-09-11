import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Send } from 'lucide-react';
import { useNuevaPoliza } from '../../../hooks/use-nueva-poliza';

export function ErrorState() {
  const { state, sendToVelneo } = useNuevaPoliza();

  const handleRetry = () => {
    sendToVelneo();
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-24 w-24 text-red-500 mb-6" />
        
        <h2 className="text-2xl font-bold text-red-700 mb-4">
          Error al Enviar a Velneo
        </h2>
        
        <p className="text-red-600 mb-8 max-w-md mx-auto">
          {state.velneo.errorMessage || 'Hubo un problema al enviar la información a Velneo'}
        </p>

        <div className="flex gap-4 justify-center">
          <Button 
            onClick={handleRetry}
            variant="outline"
          >
            <Send className="mr-2 h-4 w-4" />
            Reintentar Envío
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Empezar de Nuevo
          </Button>
        </div>
      </div>
    </div>
  );
}