import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ValidationSummaryProps {
  hookInstance: any;
}

export function ValidationSummary({ hookInstance }: ValidationSummaryProps) {
  const { state } = hookInstance;
  
  const completionPercentage = state.scan.completionPercentage || 0;
  const requiresAttention = state.scan.requiresAttention || [];
  
  // Verificar si los datos maestros requeridos están completos
  const requiredMasterDataFields = ['combustibleId', 'categoriaId', 'destinoId', 'departamentoId'];
  const completedMasterDataFields = requiredMasterDataFields.filter(field => 
    state.masterData?.[field] && state.masterData[field] !== ''
  );
  const masterDataCompletion = (completedMasterDataFields.length / requiredMasterDataFields.length) * 100;

  // Calcular completitud general
  const overallCompletion = (completionPercentage + masterDataCompletion) / 2;

  const getStatusInfo = () => {
    if (overallCompletion >= 80) {
      return {
        color: 'bg-green-500',
        text: 'Listo para enviar',
        description: 'Todos los datos están completos y validados'
      };
    } else if (overallCompletion >= 70) {
      return {
        color: 'bg-yellow-500',
        text: 'Requiere revisión',
        description: 'Completa los campos faltantes para continuar'
      };
    } else {
      return {
        color: 'bg-red-500',
        text: 'Completar datos requeridos',
        description: 'Faltan datos importantes para crear la póliza'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const missingFields = requiredMasterDataFields.filter(field => 
    !state.masterData?.[field] || state.masterData[field] === ''
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Estado general */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
              <span className="font-medium">{statusInfo.text}</span>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(overallCompletion)}% completado
            </div>
          </div>

          {/* Desglose de completitud */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Datos del documento:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{completionPercentage}%</span>
                {completionPercentage >= 70 && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Datos maestros:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{Math.round(masterDataCompletion)}%</span>
                {masterDataCompletion >= 100 && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
            </div>
          </div>

          {/* Alertas y campos faltantes */}
          {requiresAttention.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {requiresAttention.length} campo(s) requieren atención en los datos extraídos.
              </AlertDescription>
            </Alert>
          )}

          {missingFields.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div>
                  <p className="font-medium mb-1">Campos maestros requeridos faltantes:</p>
                  <ul className="list-disc list-inside text-sm">
                    {missingFields.map(field => (
                      <li key={field}>
                        {field === 'combustibleId' && 'Tipo de Combustible'}
                        {field === 'categoriaId' && 'Categoría'}
                        {field === 'destinoId' && 'Destino del Vehículo'}
                        {field === 'departamentoId' && 'Departamento'}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {overallCompletion < 70 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Para continuar al siguiente paso, completa los campos requeridos y asegúrate de que 
                el nivel de confianza sea al menos del 70%.
              </AlertDescription>
            </Alert>
          )}

          {overallCompletion >= 80 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Todo listo para crear la póliza</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}