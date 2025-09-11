import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  FileText,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useNuevaPoliza } from '../../../hooks/use-nueva-poliza';

export function SuccessState() {
  const { state } = useNuevaPoliza();

  const copyPolizaNumber = () => {
    if (state.velneo.polizaNumber) {
      navigator.clipboard.writeText(state.velneo.polizaNumber);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="relative mb-6">
          <CheckCircle className="mx-auto h-24 w-24 text-green-500" />
          <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-pulse" />
        </div>
        
        <h2 className="text-3xl font-bold text-green-700 mb-4">
          ¡Póliza Creada Exitosamente!
        </h2>
        
        <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
          La póliza ha sido procesada y enviada correctamente a Velneo
        </p>

        <Card className="max-w-md mx-auto mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Número de póliza generado:</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <code className="text-xl font-bold text-green-700 bg-green-50 px-4 py-2 rounded-lg border">
                  {state.velneo.polizaNumber}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPolizaNumber}
                  title="Copiar número de póliza"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Integrada en sistema Velneo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => window.location.reload()}
            size="lg"
          >
            <FileText className="mr-2 h-5 w-5" />
            Crear Nueva Póliza
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.open('/polizas', '_blank')}
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Ver en Listado
          </Button>
        </div>
      </div>
    </div>
  );
}