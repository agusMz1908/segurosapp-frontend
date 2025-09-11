import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useNuevaPoliza } from '../../../hooks/use-nueva-poliza';

export function ValidationSummary() {
  const { state } = useNuevaPoliza();
  
  const completionPercentage = state.scan.completionPercentage || 85;
  const requiresAttention = state.scan.requiresAttention || [];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              completionPercentage >= 80 ? 'bg-green-500' : 
              completionPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium">
              {completionPercentage >= 80 ? 'Listo para enviar' : 
               completionPercentage >= 70 ? 'Requiere revisión' : 'Completar datos requeridos'}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            {requiresAttention.length === 0 
              ? 'Todos los campos están validados'
              : `${requiresAttention.length} campo(s) pendiente(s)`
            }
          </div>
        </div>

        {completionPercentage < 70 && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Para continuar al siguiente paso, el nivel de confianza debe ser al menos del 70%. 
              Completa los campos marcados y verifica la información.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}