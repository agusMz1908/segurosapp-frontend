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
  Building2
} from 'lucide-react';

interface SuccessStateProps {
  processResult: any;
  context: any;
  onStartNewRenovation: () => void;
  onGoToDashboard: () => void;
}

export function SuccessState({ 
  processResult, 
  context, 
  onStartNewRenovation, 
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
        <div className="mx-auto mb-6 w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        
        <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-3">
          ¡Renovación Completada Exitosamente!
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          La póliza ha sido renovada correctamente en Velneo. La póliza anterior fue marcada como antecedente 
          y la nueva póliza está activa con todos los datos validados.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto">
                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                Póliza Anterior
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
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full text-xs">
                    <Calendar className="h-3 w-3" />
                    Marcada como Antecedente
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

        <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                Nueva Póliza Activa
              </h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Número:</span>{' '}
                  <span className="text-green-700 dark:text-green-300 font-mono">
                    {processResult.polizaNumber || `ID: ${processResult.velneoPolizaId}` || 'Generado'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Activa en Velneo
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

      {processResult.message && (
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-blue-800 dark:text-blue-300 font-medium">
                {processResult.message}
              </p>
              
              {processResult.mensajePolizaAnterior && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  {processResult.mensajePolizaAnterior}
                </p>
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
                onClick={onStartNewRenovation}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20 shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Nueva Renovación
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}