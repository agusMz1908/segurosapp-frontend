// app/renovaciones/step-4-confirmation/renovacion-confirmation-form.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  User, 
  Car, 
  Send,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Home,
  ExternalLink,
  Copy,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RenovacionConfirmationFormProps {
  renovacionesHook: any;
  nuevaPolizaHook: any;
}

export function RenovacionConfirmationForm({ renovacionesHook, nuevaPolizaHook }: RenovacionConfirmationFormProps) {
  const { state: renovacionState, processRenovacion, updateObservaciones, reset } = renovacionesHook;
  const { state: nuevaPolizaState } = nuevaPolizaHook;

  const handleProcessRenovacion = async () => {
    if (!nuevaPolizaState.file.scanId) {
      toast.error('No hay documento escaneado para procesar');
      return;
    }

    // ✅ PASAR EL CONTEXTO DE NUEVA POLIZA que tiene la compañía detectada correctamente
    await processRenovacion(nuevaPolizaState.file.scanId, nuevaPolizaState.context);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Estado de éxito
  if (renovacionState.renovacion.status === 'completed') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-24 w-24 text-green-500 dark:text-green-400 mb-6" />
          
          <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-4">
            ¡Renovación Completada!
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            La póliza ha sido renovada exitosamente en tu sistema Velneo.
          </p>

          <Card className="max-w-md mx-auto mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Póliza Original:</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/20">
                    {renovacionState.cliente.selectedPoliza?.conpol}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Nueva Póliza:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20">
                      {renovacionState.renovacion.result?.polizaNumber || "Ver en Velneo"}
                    </Badge>
                    {renovacionState.renovacion.result?.polizaNumber && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(renovacionState.renovacion.result.polizaNumber);
                          toast.success('Número copiado');
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-700 dark:text-green-400 font-medium">Renovada</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Fecha:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {new Date().toLocaleDateString('es-UY')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {renovacionState.renovacion.result?.velneoUrl && (
              <Button 
                onClick={() => window.open(renovacionState.renovacion.result.velneoUrl, '_blank')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Abrir en Velneo
              </Button>
            )}
            
            <Button 
              onClick={reset}
              variant="outline"
              size="lg"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Nueva Renovación
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              size="lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Ir al Dashboard
            </Button>
          </div>

          <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 max-w-md mx-auto">
            <p className="text-sm text-green-700 dark:text-green-300">
              La póliza original ha sido marcada como "Antecedente" y la nueva póliza está activa en Velneo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (renovacionState.renovacion.status === 'error') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-24 w-24 text-red-500 dark:text-red-400 mb-6" />
          
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
            Error en la Renovación
          </h2>
          
          <p className="text-red-600 dark:text-red-400 mb-8 max-w-md mx-auto">
            Hubo un problema al procesar la renovación en Velneo.
          </p>

          {renovacionState.renovacion.errorMessage && (
            <Card className="max-w-md mx-auto mb-8">
              <CardContent className="pt-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-left">
                    <strong>Detalles del error:</strong><br />
                    {renovacionState.renovacion.errorMessage}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleProcessRenovacion}
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Reintentar Renovación
            </Button>
            
            <Button 
              onClick={reset}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Empezar de Nuevo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Estado de procesamiento
  if (renovacionState.renovacion.status === 'processing') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="relative mb-6">
            <div className="mx-auto w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <RefreshCw className="absolute inset-0 h-12 w-12 m-auto text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-blue-700 mb-4">
            Procesando Renovación...
          </h2>
          
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Estamos procesando la renovación en tu sistema Velneo. 
            Este proceso puede tomar unos momentos.
          </p>

          <div className="max-w-md mx-auto">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Validando datos de renovación...</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span>Conectando con Velneo...</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                <span>Creando nueva póliza...</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                <span>Marcando póliza anterior como antecedente...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de revisión - Vista por defecto
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Confirmar Renovación
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Revisa toda la información antes de procesar la renovación en Velneo
        </p>
      </div>

      {/* Resumen de renovación */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Póliza Original */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Póliza Original
            </CardTitle>
            <CardDescription>Información de la póliza que se va a renovar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Número:</span>
                <span className="font-medium">{renovacionState.cliente.selectedPoliza?.conpol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">{renovacionState.context.clienteInfo?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compañía:</span>
                <span className="font-medium">{renovacionState.context.companiaInfo?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vencimiento:</span>
                <span className="font-medium text-red-600">
                  {formatDate(renovacionState.cliente.selectedPoliza?.confchhas)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Premio:</span>
                <span className="font-medium">
                  {formatCurrency(renovacionState.cliente.selectedPoliza?.conpremio || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nueva Póliza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Nueva Póliza Escaneada
            </CardTitle>
            <CardDescription>Datos extraídos del nuevo documento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Número:</span>
                <span className="font-medium">{nuevaPolizaState.scan.extractedData?.polizaNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">{renovacionState.context.clienteInfo?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compañía:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {/* ✅ MOSTRAR LA COMPAÑÍA DEL CONTEXTO DE NUEVA POLIZA */}
                    {nuevaPolizaState.context.companiaInfo?.nombre || 'Detectando...'}
                  </span>
                  {nuevaPolizaState.context.companiaInfo?.nombre && 
                   nuevaPolizaState.context.companiaInfo.nombre !== renovacionState.context.companiaInfo?.nombre && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-xs">
                      Cambio
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vigencia Desde:</span>
                <span className="font-medium">
                  {nuevaPolizaState.scan.extractedData?.vigenciaDesde 
                    ? formatDate(nuevaPolizaState.scan.extractedData.vigenciaDesde)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vigencia Hasta:</span>
                <span className="font-medium">
                  {nuevaPolizaState.scan.extractedData?.vigenciaHasta 
                    ? formatDate(nuevaPolizaState.scan.extractedData.vigenciaHasta)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prima:</span>
                <span className="font-medium">
                  {nuevaPolizaState.scan.extractedData?.prima 
                    ? formatCurrency(parseFloat(nuevaPolizaState.scan.extractedData.prima))
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confianza del Escaneo:</span>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  {nuevaPolizaState.scan.completionPercentage || 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información del proceso */}
      <Alert>
        <ArrowRight className="h-4 w-4" />
        <AlertDescription>
          <strong>Proceso de renovación:</strong> Al confirmar, la póliza original ({renovacionState.cliente.selectedPoliza?.conpol}) 
          será marcada como "Antecedente/Terminado" y se creará una nueva póliza con los datos escaneados. 
          La nueva póliza mantendrá el mismo cliente y puede cambiar de compañía aseguradora si corresponde.
        </AlertDescription>
      </Alert>

      {/* Observaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
          <CardDescription>
            Agrega observaciones adicionales para la renovación (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder={`Renovación automática de póliza ${renovacionState.cliente.selectedPoliza?.conpol}...`}
              value={renovacionState.renovacion.observaciones}
              onChange={(e) => updateObservaciones(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Warnings si los hay */}
      {nuevaPolizaState.scan.requiresAttention && nuevaPolizaState.scan.requiresAttention.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <strong>Atención:</strong> Algunos campos del documento escaneado requieren revisión. 
            Asegúrate de haber validado todos los datos en el paso anterior.
          </AlertDescription>
        </Alert>
      )}

      {/* Botón de confirmación */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">¿Procesar Renovación?</h3>
              <p className="text-gray-600">
                Una vez procesada, la renovación será definitiva y no podrá modificarse desde aquí.
              </p>
            </div>

            <Button 
              onClick={handleProcessRenovacion}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              disabled={!nuevaPolizaState.file.scanId}
            >
              <Send className="mr-2 h-5 w-5" />
              Procesar Renovación en Velneo
            </Button>

            {!nuevaPolizaState.file.scanId && (
              <p className="text-sm text-red-600">
                No hay documento escaneado para procesar
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}