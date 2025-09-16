// src/app/renovaciones/step-3-validation/validation-form.tsx
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
import { DocumentUploader } from './document-uploader';
import { MasterDataForm } from './master-data-form'; // ← NUEVO: Importar master data form

interface ValidationFormProps {
  hookInstance: any;
}

export function ValidationForm({ hookInstance }: ValidationFormProps) {
  const { state, uploadDocument } = hookInstance;

  const completionPercentage = state.scan.confidence || 0; // ← CORREGIR: usar confidence
  const requiresAttention = state.scan.requiresAttention || [];
  const scanStatus = state.scan.status;

  const getConfidenceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
    return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
  };

  // ✅ NUEVO: Si hay datos extraídos, mostrar el formulario completo de validación
  if (scanStatus === 'completed' && state.scan.extractedData && Object.keys(state.scan.extractedData).length > 0) {
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
            <div className="grid md:grid-cols-2 gap-6">
              {/* Póliza anterior */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  Póliza Anterior (Heredada)
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Cliente:</span> {state.polizaAnterior?.cliente.nombre}
                  </div>
                  <div>
                    <span className="font-medium">Compañía:</span> {state.polizaAnterior?.compania.nombre}
                  </div>
                  <div>
                    <span className="font-medium">Sección:</span> {state.polizaAnterior?.seccion.nombre}
                  </div>
                  <div>
                    <span className="font-medium">Número:</span> {state.polizaAnterior?.numero}
                  </div>
                  <div>
                    <span className="font-medium">Premio:</span> {new Intl.NumberFormat('es-UY', {
                      style: 'currency',
                      currency: 'UYU'
                    }).format(state.polizaAnterior?.premio || 0)}
                  </div>
                </div>
              </div>

              {/* Nueva póliza */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  Nueva Póliza (Datos extraídos)
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Número:</span> {state.scan.extractedData?.polizaNumber || 'No detectado'}
                  </div>
                  <div>
                    <span className="font-medium">Premio:</span> {state.scan.extractedData?.prima 
                      ? new Intl.NumberFormat('es-UY', {
                          style: 'currency',
                          currency: 'UYU'
                        }).format(state.scan.extractedData.prima)
                      : 'No detectado'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Vigencia Desde:</span> {state.scan.extractedData?.vigenciaDesde || 'No detectado'}
                  </div>
                  <div>
                    <span className="font-medium">Vigencia Hasta:</span> {state.scan.extractedData?.vigenciaHasta || 'No detectado'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ NUEVO: Contenido principal en dos columnas como Nueva Póliza */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Datos extraídos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Datos del Documento de Renovación
                </CardTitle>
                <CardDescription>
                  Información extraída automáticamente del nuevo documento. Puedes editarla si es necesario.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExtractedDataForm hookInstance={hookInstance} />
              </CardContent>
            </Card>
          </div>

          {/* ✅ NUEVO: Columna derecha - Datos maestros */}
          <div className="space-y-4">
            <MasterDataForm hookInstance={hookInstance} />
            
            {/* Información del contexto heredado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Contexto Heredado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Cliente:</span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {state.context.clienteInfo?.nombre || "No heredado"}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Compañía:</span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {state.context.companiaInfo?.nombre || "No heredada"}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Sección:</span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {state.context.seccionInfo?.nombre || "No heredada"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ✅ NUEVO: Información importante sobre renovación */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Renovación:</strong> Esta información será utilizada para crear la nueva póliza. 
            La póliza anterior ({state.polizaAnterior?.numero}) será marcada como "Antecedente" y mantendrá 
            la referencia al mismo cliente, compañía y sección.
          </AlertDescription>
        </Alert>

        {/* ✅ NUEVO: Resumen de validaciones */}
        {requiresAttention && requiresAttention.length > 0 && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <AlertTriangle className="h-5 w-5" />
                Campos que Requieren Atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {requiresAttention.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span className="text-yellow-800 dark:text-yellow-200">
                      <strong>{item.fieldName}:</strong> {item.reason}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Mostrar el uploader si aún no hay datos extraídos
  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Escanear Nueva Póliza
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Sube el documento de la nueva póliza para procesar la renovación
        </p>
      </div>

      {/* Contexto heredado */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          La nueva póliza heredará automáticamente: <strong>Cliente</strong> ({state.polizaAnterior?.cliente.nombre}), 
          <strong> Compañía</strong> ({state.polizaAnterior?.compania.nombre}), y 
          <strong> Sección</strong> ({state.polizaAnterior?.seccion.nombre}) de la póliza anterior.
        </AlertDescription>
      </Alert>

      {/* Información de la póliza anterior */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Póliza Anterior (Referencia)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Número:</span>
              <p className="text-gray-900 dark:text-gray-100 font-mono">
                {state.polizaAnterior?.numero}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Premio:</span>
              <p className="text-gray-900 dark:text-gray-100">
                {new Intl.NumberFormat('es-UY', {
                  style: 'currency',
                  currency: 'UYU'
                }).format(state.polizaAnterior?.premio || 0)}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Vencimiento:</span>
              <p className="text-gray-900 dark:text-gray-100">
                {state.polizaAnterior?.fechaHasta ? new Date(state.polizaAnterior.fechaHasta).toLocaleDateString('es-UY') : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DocumentUploader */}
      <DocumentUploader
        onUpload={uploadDocument}
        isUploading={scanStatus === 'uploading' || scanStatus === 'processing'}
        uploadStatus={scanStatus}
        fileName={state.scan.fileName}
        accept=".pdf,.jpg,.jpeg,.png"
        maxSize={10}
      />
    </div>
  );
}