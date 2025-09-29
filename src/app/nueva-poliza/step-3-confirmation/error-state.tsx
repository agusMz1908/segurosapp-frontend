import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Send, 
  RotateCcw,
  Home,
  MessageCircle
} from 'lucide-react';

interface ErrorStateProps {
  hookInstance: any;
  errorMessage?: string;
}

export function ErrorState({ hookInstance, errorMessage }: ErrorStateProps) {
  const { sendToVelneo, reset } = hookInstance;

  const handleRetry = () => {
    console.log('Retry button clicked');
    sendToVelneo();
  };

  const handleStartOver = () => {
    reset();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-24 w-24 text-red-500 dark:text-red-400 mb-6" />
        
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
          Error al Crear Póliza
        </h2>
        
        <p className="text-red-600 dark:text-red-400 mb-8 max-w-md mx-auto">
          Hubo un problema al enviar la información a Velneo. Por favor, intenta nuevamente.
        </p>

        {errorMessage && (
          <Card className="max-w-md mx-auto mb-8">
            <CardContent className="pt-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-left">
                  <strong>Detalles del error:</strong><br />
                  {errorMessage}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleRetry}
            size="lg"
            className="bg-red-600 hover:bg-red-700"
          >
            <Send className="mr-2 h-4 w-4" />
            Reintentar Envío
          </Button>
          
          <Button 
            onClick={handleStartOver}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Empezar de Nuevo
          </Button>
          
          <Button 
            onClick={handleGoHome}
            variant="outline"
            size="lg"
          >
            <Home className="mr-2 h-4 w-4" />
            Ir al Dashboard
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-w-md mx-auto">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">¿Necesitas ayuda?</span>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Si el problema persiste, verifica tu conexión a internet y que tu sistema Velneo esté disponible.
          </p>
        </div>
      </div>
    </div>
  );
}