// step-3-confirmation/success-state.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  FileText,
  Copy,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface SuccessStateProps {
  polizaNumber: string;
}

export function SuccessState({ polizaNumber }: SuccessStateProps) {
  const copyPolizaNumber = () => {
    if (polizaNumber) {
      navigator.clipboard.writeText(polizaNumber);
    }
  };

  const goToDashboard = () => {
    console.log('Redirecting to dashboard...');
    window.location.href = '/dashboard';
  };

  const createNewPoliza = () => {
    console.log('Reloading to create new poliza...');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="relative mb-6">
          <CheckCircle className="mx-auto h-24 w-24 text-green-500" />
        </div>
        
        <h2 className="text-3xl font-bold text-green-700 mb-4">
          Poliza Creada Exitosamente
        </h2>
        
        <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
          La poliza ha sido procesada y enviada correctamente a Velneo
        </p>

        <Card className="max-w-md mx-auto mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Numero de poliza generado:</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <code className="text-xl font-bold text-green-700 bg-green-50 px-4 py-2 rounded-lg border">
                  {polizaNumber}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPolizaNumber}
                  title="Copiar numero de poliza"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button 
            onClick={goToDashboard}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Ir al Dashboard
          </Button>
          
          <Button 
            variant="outline"
            onClick={createNewPoliza}
            size="lg"
          >
            <FileText className="mr-2 h-5 w-5" />
            Crear Nueva Poliza
          </Button>
        </div>
      </div>
    </div>
  );
}