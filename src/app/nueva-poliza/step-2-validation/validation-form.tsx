import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Edit3,
  AlertTriangle
} from 'lucide-react';
import { useNuevaPoliza } from '../../../hooks/use-nueva-poliza';
import { ExtractedDataForm } from './extracted-data-form';
import { MasterDataForm } from './master-data-form';
import { ValidationSummary } from './validation-summary';

export function ValidationForm() {
  const { state } = useNuevaPoliza();

  const completionPercentage = state.scan.completionPercentage || 85;
  const requiresAttention = state.scan.requiresAttention || [];

  const getConfidenceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header del paso */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Validar Información</h2>
        <p className="text-gray-600">
          Revisa los datos extraídos automáticamente y completa la información con datos maestros
        </p>
      </div>

      {/* Indicador de confianza */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Resultado del Escaneo</h3>
                <p className="text-sm text-gray-600">Procesado con Azure Document Intelligence</p>
              </div>
            </div>
            
            <div className={`px-3 py-1 rounded-lg border ${getConfidenceColor(completionPercentage)}`}>
              <span className="font-medium">{completionPercentage}% de confianza</span>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Completitud del mapeo</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {requiresAttention.length > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {requiresAttention.length} campo(s) requieren tu atención. 
                Están marcados con íconos de advertencia.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Contenido principal en dos columnas */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Datos extraídos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Datos del Documento
              </CardTitle>
              <CardDescription>
                Información extraída automáticamente. Puedes editarla si es necesario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExtractedDataForm />
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Datos maestros */}
        <div className="space-y-4">
          <MasterDataForm />
          
          {/* Información del contexto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contexto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Cliente:</span>
                <p className="text-gray-900">{state.context.clienteInfo?.nombre}</p>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">Compañía:</span>
                <p className="text-gray-900">{state.context.companiaInfo?.nombre}</p>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">Sección:</span>
                <p className="text-gray-900">{state.context.seccionInfo?.nombre}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resumen de validación */}
      <ValidationSummary />
    </div>
  );
}