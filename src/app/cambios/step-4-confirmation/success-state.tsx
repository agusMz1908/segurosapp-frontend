import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Home,
  RefreshCw,
  FileText,
  ArrowRight,
  Calendar,
  Building2,
  Edit
} from 'lucide-react';

interface SuccessStateProps {
  processResult: any;
  context: any;
  onStartNewCambio: () => void;
  onGoToDashboard: () => void;
}

export function SuccessState({ 
  processResult, 
  context, 
  onStartNewCambio, 
  onGoToDashboard 
}: SuccessStateProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('es-UY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header de éxito */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-6 w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-purple-600 dark:text-purple-400" />
        </div>
        
        <h2 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-3">
          Cambio Completado Exitosamente
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          La póliza ha sido modificada correctamente en Velneo. Los cambios han sido aplicados
          y están activos con todos los datos validados.
        </p>
      </div>

      {/* Información del cambio */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Póliza Original */}
        <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900/10 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/20 rounded-lg flex items-center justify-center mx-auto">
                <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300">
                Póliza Original
              </h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Número:</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">
                    {context.polizaOriginal?.numero || context.polizaOriginal?.conpol || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                    <Edit className="h-3 w-3" />
                    Modificada Exitosamente
                  </span>
                </div>
                <div>
                  <span className="font-medium">Vencimiento:</span>{' '}
                  <span className="text-gray-600 dark:text-gray-400">
                    {context.polizaOriginal?.vencimiento || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cambio Aplicado */}
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                Cambio Aplicado
              </h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Resultado:</span>{' '}
                  <span className="text-purple-700 dark:text-purple-300 font-mono">
                    {processResult.polizaNumber || `ID: ${processResult.velneoPolizaId}` || 'Procesado'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Activo en Velneo
                  </span>
                </div>
                <div>
                  <span className="font-medium">ID Velneo:</span>{' '}
                  <span className="text-gray-600 dark:text-gray-400">
                    {processResult.velneoPolizaId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información del contexto */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Cliente</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {context.clienteInfo?.nombre || 'N/A'}
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Compañía</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {context.companiaInfo?.nombre || 'N/A'}
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Procesado</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(processResult.createdAt || new Date().toISOString())}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensaje del sistema */}
      {processResult.message && (
        <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-purple-800 dark:text-purple-300 font-medium">
                {processResult.message}
              </p>
              
              {processResult.mensajeModificacion && (
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                  {processResult.mensajeModificacion}
                </p>
              )}

              {processResult.cambiosAplicados && processResult.cambiosAplicados.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">
                    Cambios aplicados:
                  </p>
                  <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                    {processResult.cambiosAplicados.map((cambio: string, index: number) => (
                      <li key={index}>• {cambio}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de acción */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              ¿Qué deseas hacer ahora?
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              {/* Botón Dashboard Principal */}
              <Button
                onClick={onGoToDashboard}
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <Home className="mr-2 h-5 w-5" />
                Ir al Dashboard
              </Button>

              {/* Botón Nuevo Cambio */}
              <Button
                onClick={onStartNewCambio}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20 shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Nuevo Cambio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug info en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500">Debug Info</summary>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
            {JSON.stringify({
              velneoPolizaId: processResult.velneoPolizaId,
              polizaNumber: processResult.polizaNumber,
              polizaOriginalId: context.polizaOriginal?.id,
              success: processResult.success,
              message: processResult.message,
              cambiosAplicados: processResult.cambiosAplicados
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}