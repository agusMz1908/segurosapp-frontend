// step-3-confirmation/success-state.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  FileText,
  Plus,
  Home
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SuccessStateProps {
  polizaNumber: string | null;
  velneoUrl?: string | null;
}

export function SuccessState({ polizaNumber, velneoUrl }: SuccessStateProps) {
  const handleCopyPolizaNumber = () => {
    if (polizaNumber) {
      navigator.clipboard.writeText(polizaNumber);
      toast.success('Número de póliza copiado al portapapeles');
    }
  };

  const handleOpenVelneo = () => {
    if (velneoUrl) {
      window.open(velneoUrl, '_blank');
    } else {
      toast.error('URL de Velneo no disponible');
    }
  };

  const handleNewPoliza = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <CheckCircle className="mx-auto h-24 w-24 text-green-500 dark:text-green-400 mb-6" />
        
        <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-4">
          ¡Póliza Creada Exitosamente!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          La póliza ha sido enviada y creada correctamente en tu sistema Velneo.
        </p>

        {/* Card con información de la póliza */}
        <Card className="max-w-md mx-auto mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Número de Póliza:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20">
                    {polizaNumber || "No disponible"}
                  </Badge>
                  {polizaNumber && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPolizaNumber}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-700 dark:text-green-400 font-medium">Creada</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Fecha:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date().toLocaleDateString('es-UY')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {velneoUrl && (
            <Button 
              onClick={handleOpenVelneo}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Abrir en Velneo
            </Button>
          )}
          
          <Button 
            onClick={handleNewPoliza}
            variant="outline"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nueva Póliza
          </Button>
          
          <Button 
            onClick={handleGoHome}
            variant="outline"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Ir al Dashboard
          </Button>
        </div>

        {/* Información adicional */}
        <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 max-w-md mx-auto">
          <p className="text-sm text-green-700 dark:text-green-300">
            La póliza ya está disponible en tu sistema Velneo y puede ser consultada desde allí.
          </p>
        </div>
      </div>
    </div>
  );
}