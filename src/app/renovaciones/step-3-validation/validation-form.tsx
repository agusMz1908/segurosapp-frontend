// src/app/renovaciones/step-3-validation/validation-form.tsx
// ✅ CORREGIDO: Formulario de validación específico para renovaciones

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Edit3,
  AlertTriangle,
  CheckCircle,
  Info,
  Database
} from 'lucide-react';
import { ExtractedDataForm } from './extracted-data-form';
import { MasterDataForm } from './master-data-form';

interface ValidationFormProps {
  hookInstance: any;
}

export function ValidationForm({ hookInstance }: ValidationFormProps) {
  const { state, updateExtractedData, updateMasterData } = hookInstance;

  // ✅ CORREGIDO: Usar múltiples fuentes de datos
  const displayData = state.scan.normalizedData && Object.keys(state.scan.normalizedData).length > 0 
    ? state.scan.normalizedData 
    : state.scan.extractedData || {};

  const completionPercentage = state.scan.confidence || state.scan.completionPercentage || 0;
  const requiresAttention = state.scan.requiresAttention || [];
  const scanStatus = state.scan.status;

  const getConfidenceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
    return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
  };

  // ✅ NUEVO: Si hay datos extraídos, mostrar el formulario completo de validación
  if (scanStatus === 'completed' && displayData && Object.keys(displayData).length > 0) {
    return (
      <div className="space-y-6 p-6">
        {/* Header del paso */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Validar Información de la Renovación
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Revisa los datos extraídos automáticamente y completa la información con datos maestros
          </p>
        </div>

        {/* ✅ NUEVO: Estado del escaneo */}
        <Card className={`border-2 ${getConfidenceColor(completionPercentage)}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Documento Procesado
              </span>
              <span className="text-sm font-normal">
                {completionPercentage}% confianza
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={completionPercentage} className="mb-3" />
            
            {state.scan.fileName && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Archivo:</strong> {state.scan.fileName}
              </p>
            )}

            {requiresAttention.length > 0 && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {requiresAttention.length} campo(s) requieren atención manual
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* ✅ NUEVO: Comparación con póliza anterior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Contexto de Renovación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-2">Información de la Renovación:</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Cliente:</strong> {state.context?.clienteInfo?.nombre || 'N/A'}
                </div>
                <div>
                  <strong>Compañía:</strong> {state.context?.companiaInfo?.nombre || 'Detectando...'}
                </div>
                <div>
                  <strong>Póliza Original:</strong> {state.context?.polizaOriginal?.numero || 'N/A'}
                </div>
                <div>
                  <strong>Vencimiento:</strong> {state.context?.polizaOriginal?.vencimiento || 'N/A'}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>
                La póliza anterior será marcada como "Antecedente" y mantendrá la referencia al mismo contexto (cliente, compañía, sección).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Campos que requieren atención */}
        {requiresAttention && requiresAttention.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Campos que Requieren Atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {requiresAttention.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      <strong>{item.fieldName || 'Campo desconocido'}:</strong> {item.reason || 'Requiere verificación'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario de datos extraídos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Datos Extraídos de la Póliza
            </CardTitle>
            <CardDescription>
              Revisa y edita los datos extraídos automáticamente del documento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExtractedDataForm 
              hookInstance={{
                ...hookInstance,
                state: {
                  ...state,
                  scan: {
                    ...state.scan,
                    extractedData: displayData // ✅ USAR datos normalizados si están disponibles
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Formulario de datos maestros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datos Maestros
            </CardTitle>
            <CardDescription>
              Completa la información con datos maestros del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MasterDataForm 
              hookInstance={{
                ...hookInstance,
                state: {
                  ...state,
                  scan: {
                    ...state.scan,
                    extractedData: displayData // ✅ USAR datos normalizados para mapeo
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ FALLBACK: Estado cuando no hay datos o está en progreso
  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Validar Información de la Renovación
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Esperando documento escaneado...
        </p>
      </div>

      {scanStatus === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {state.scan.errorMessage || 'Error procesando el documento. Intenta nuevamente.'}
          </AlertDescription>
        </Alert>
      )}

      {(scanStatus === 'uploading' || scanStatus === 'scanning') && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-lg font-medium">
                  {scanStatus === 'uploading' ? 'Subiendo archivo...' : 'Procesando documento...'}
                </span>
              </div>
              
              {state.scan.fileName && (
                <p className="text-sm text-gray-600">
                  Archivo: {state.scan.fileName}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {scanStatus === 'idle' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Regresa al paso anterior y sube un documento para continuar con la validación.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}