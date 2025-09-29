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
      <div className="text-center mb-8">
        <div className="mx-auto mb-6 w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
        
        <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-3">
          Cambio Completado Exitosamente
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          La póliza ha sido modificada correctamente en Velneo. Los cambios han sido aplicados
          y están activos con todos los datos validados.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Póliza Original */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto">
                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                Póliza Original
              </h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Número:</span>{' '}
                  <span className="text-orange-700 dark:text-orange-300">
                    {context.polizaOriginal?.numero || context.polizaOriginal?.conpol || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs">
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

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                Cambio Aplicado
              </h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Resultado:</span>{' '}
                  <span className="text-blue-700 dark:text-blue-300 font-mono">
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
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Compañía</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {context.companiaInfo?.nombre || 'N/A'}
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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

      {processResult.message && (
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-blue-800 dark:text-blue-300 font-medium">
                {processResult.message}
              </p>
              
              {processResult.mensajeModificacion && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  {processResult.mensajeModificacion}
                </p>
              )}

              {processResult.cambiosAplicados && processResult.cambiosAplicados.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                    Cambios aplicados:
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
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

      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              ¿Qué deseas hacer ahora?
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Button
                onClick={onGoToDashboard}
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <Home className="mr-2 h-5 w-5" />
                Ir al Dashboard
              </Button>

              <Button
                onClick={onStartNewCambio}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20 shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Nuevo Cambio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}