import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  FileText, 
  CheckCircle, 
  RefreshCw,
  AlertTriangle,
  Info,
  Building2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders, getAuthToken, handle401Error } from '../../../utils/auth-utils';

interface RenovacionConfirmationFormProps {
  hookInstance: any;
}

interface RenewPolizaResponse {
  success: boolean;  // ✅ CORREGIDO: minúscula como viene del backend
  message: string;   // ✅ CORREGIDO: minúscula como viene del backend
  velneoPolizaId?: number;     // ✅ CORREGIDO: camelCase
  polizaNumber?: string;       // ✅ CORREGIDO: camelCase
  errorMessage?: string;       // ✅ CORREGIDO: camelCase
  scanId?: number;            // ✅ CORREGIDO: camelCase
  polizaAnteriorId?: number;  // ✅ CORREGIDO: camelCase
  // Campos adicionales que vienen del backend
  polizaAnteriorActualizada?: boolean;
  mensajePolizaAnterior?: string;
  vencimientoValidado?: boolean;
  fechaVencimientoAnterior?: string;
  validationError?: string;
  warnings?: string[];
  createdAt?: string;
}

export function RenovacionConfirmationForm({ hookInstance }: RenovacionConfirmationFormProps) {
  const { state } = hookInstance;
  const [isProcessing, setIsProcessing] = useState(false);
  const [processCompleted, setProcessCompleted] = useState(false);
  const [processResult, setProcessResult] = useState<RenewPolizaResponse | null>(null);

  const extractedData = state.scan?.mappedData && Object.keys(state.scan.mappedData).length > 0
    ? state.scan.mappedData
    : state.scan?.normalizedData && Object.keys(state.scan.normalizedData).length > 0
    ? state.scan.normalizedData
    : state.scan?.extractedData || {};

  const masterData = state.masterData || {};
  const context = state.context || {};

  const formatCurrency = (value: any) => {
    if (!value) return 'No especificado';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
    return isNaN(num) ? value : new Intl.NumberFormat('es-UY', { 
      style: 'currency', 
      currency: 'UYU' 
    }).format(num);
  };

  const formatDate = (value: any) => {
    if (!value) return 'No especificado';
    try {
      let date;
      if (value.includes('/')) {
        const parts = value.split('/');
        date = new Date(parts[2], parts[1] - 1, parts[0]); // DD/MM/YYYY
      } else if (value.includes('-')) {
        date = new Date(value); // YYYY-MM-DD
      } else {
        return value;
      }
      
      return date.toLocaleDateString('es-UY');
    } catch {
      return value;
    }
  };

  const handleProcessRenovacion = async () => {
    setIsProcessing(true);
    
    try {
      console.log('🔄 RENOVACIONES - Iniciando procesamiento final...');
      console.log('📋 RENOVACIONES - Estado completo:', {
        context: state.context,
        extractedData,
        masterData,
        scanId: state.scan?.scanId
      });

      // ✅ VALIDACIONES PREVIAS mejoradas
      if (!state.scan?.scanId) {
        throw new Error('No hay documento escaneado para procesar');
      }

      if (!context.polizaOriginal?.id) {
        throw new Error('No se encontró la póliza anterior para renovar');
      }

      if (!context.clienteId) {
        throw new Error('Falta información del cliente');
      }

      // ✅ PREPARAR REQUEST COMPLETO con todos los campos del nuevo backend
      const renovacionRequest = {
        // Campos básicos
        PolizaAnteriorId: context.polizaOriginal.id,
        Observaciones: masterData.observaciones || `Renovación automática de póliza ${context.polizaOriginal.numero || context.polizaOriginal.conpol}`,
        ValidarVencimiento: true,
        DiasAntesVencimiento: 30,
        
        // ✅ MASTER DATA DEL FRONTEND (datos maestros seleccionados por el usuario)
        CombustibleId: masterData.combustibleId || null,
        CategoriaId: masterData.categoriaId || null, 
        DestinoId: masterData.destinoId || null,
        DepartamentoId: masterData.departamentoId || null,
        CalidadId: masterData.calidadId || null,
        TarifaId: masterData.tarifaId || null,
        CorredorId: masterData.corredorId || null,
        MonedaId: masterData.monedaId || null,

        // ✅ EXTRACTED DATA DEL FRONTEND (datos extraídos validados por el usuario)
        NumeroPoliza: extractedData.numeroPoliza || extractedData.polizaNumber || null,
        FechaDesde: extractedData.fechaDesde || extractedData.vigenciaDesde || null,
        FechaHasta: extractedData.fechaHasta || extractedData.vigenciaHasta || null,
        Premio: extractedData.premio || extractedData.prima || null,
        MontoTotal: extractedData.montoTotal || extractedData.premioTotal || null,
        CantidadCuotas: extractedData.cantidadCuotas || null,
        ValorPorCuota: extractedData.valorPorCuota || extractedData.valorCuota || null,

        // ✅ DATOS DEL VEHÍCULO validados por el usuario
        VehiculoMarca: extractedData.vehiculoMarca || extractedData.VehiculoMarca || null,
        VehiculoModelo: extractedData.vehiculoModelo || extractedData.VehiculoModelo || null,
        VehiculoAno: extractedData.vehiculoAno || extractedData.vehiculoAño || extractedData.VehiculoAño || null,
        VehiculoPatente: extractedData.vehiculoPatente || extractedData.Patente || null,
        VehiculoChasis: extractedData.vehiculoChasis || extractedData.VehiculoChasis || null,
        VehiculoMotor: extractedData.vehiculoMotor || extractedData.VehiculoMotor || null,

        // ✅ CAMPOS DE CONTROL
        CamposCorregidos: [], // TODO: Implementar tracking de campos editados
        ComentariosUsuario: masterData.observaciones || null,
        ForzarRenovacion: false
      };

      console.log('📝 RENOVACIONES - Request completo a enviar:', {
        polizaAnteriorId: renovacionRequest.PolizaAnteriorId,
        masterData: {
          combustibleId: renovacionRequest.CombustibleId,
          categoriaId: renovacionRequest.CategoriaId,
          calidadId: renovacionRequest.CalidadId,
          destinoId: renovacionRequest.DestinoId,
          departamentoId: renovacionRequest.DepartamentoId,
          tarifaId: renovacionRequest.TarifaId
        },
        extractedData: {
          numeroPoliza: renovacionRequest.NumeroPoliza,
          fechaDesde: renovacionRequest.FechaDesde,
          fechaHasta: renovacionRequest.FechaHasta,
          premio: renovacionRequest.Premio,
          montoTotal: renovacionRequest.MontoTotal
        },
        vehicleData: {
          marca: renovacionRequest.VehiculoMarca,
          modelo: renovacionRequest.VehiculoModelo,
          ano: renovacionRequest.VehiculoAno,
          patente: renovacionRequest.VehiculoPatente
        }
      });

      // ✅ VERIFICAR AUTENTICACIÓN
      const token = getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // ✅ LLAMADA REAL AL ENDPOINT DEL BACKEND
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const endpoint = `${API_URL}/api/Document/${state.scan.scanId}/renew-in-velneo`;
      
      console.log('🌐 RENOVACIONES - Llamando endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(renovacionRequest)
      });

      console.log('📡 RENOVACIONES - Response status:', response.status);

      // ✅ MANEJAR ERRORES DE AUTENTICACIÓN
      if (response.status === 401) {
        handle401Error();
        throw new Error('Token de autenticación expirado. Por favor, inicia sesión nuevamente.');
      }

      // ✅ MANEJAR OTROS ERRORES HTTP
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.Message || errorMessage;
          console.error('❌ RENOVACIONES - Error del servidor:', errorData);
        } catch (e) {
          console.error('❌ RENOVACIONES - Error parsing response:', e);
        }
        
        throw new Error(errorMessage);
      }

      // ✅ PROCESAR RESPUESTA EXITOSA
      const result: RenewPolizaResponse = await response.json();
      console.log('✅ RENOVACIONES - Respuesta del servidor:', result);

      setProcessResult(result);

      if (result.success) {  // ✅ CORREGIDO: minúscula
        console.log('🎉 RENOVACIONES - Procesamiento completado exitosamente');
        setProcessCompleted(true);
        toast.success(`Renovación procesada exitosamente. Nueva póliza: ${result.polizaNumber || result.velneoPolizaId}`);
      } else {
        // El backend devolvió success: false
        throw new Error(result.message || result.errorMessage || 'La renovación no se pudo procesar');
      }

    } catch (error: any) {
      console.error('❌ RENOVACIONES - Error procesando:', error);
      
      // Mostrar mensaje de error específico
      const errorMessage = error.message || 'Error desconocido al procesar la renovación';
      toast.error(errorMessage);
      
      // Si hay más detalles del error, mostrarlos en consola
      if (error.response) {
        console.error('❌ RENOVACIONES - Response error details:', error.response);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ ESTADO DE PROCESAMIENTO
  if (isProcessing) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Procesando Renovación
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Este proceso puede tomar unos momentos.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="text-lg font-medium">Procesando en Velneo...</span>
              </div>
              
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
              
              {/* Información de la póliza que se está renovando */}
              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <p><strong>Renovando:</strong> Póliza {context.polizaOriginal?.numero || context.polizaOriginal?.conpol}</p>
                <p><strong>Cliente:</strong> {context.clienteInfo?.nombre}</p>
                <p><strong>Compañía:</strong> {context.companiaInfo?.nombre}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ ESTADO COMPLETADO
  if (processCompleted && processResult) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            ✅ Renovación Completada
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            La renovación ha sido procesada exitosamente en Velneo
          </p>
        </div>

        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  Renovación Procesada Exitosamente
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  La nueva póliza ha sido creada y la anterior marcada como antecedente
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm space-y-2">
                  <div><strong>Cliente:</strong> {context.clienteInfo?.nombre}</div>
                  <div><strong>Póliza Anterior:</strong> {context.polizaOriginal?.numero || context.polizaOriginal?.conpol}</div>
                  <div><strong>Nueva Póliza:</strong> {processResult.polizaNumber || `ID: ${processResult.velneoPolizaId}`}</div>
                  <div><strong>Compañía:</strong> {context.companiaInfo?.nombre}</div>
                  <div><strong>Procesado:</strong> {new Date().toLocaleString('es-UY')}</div>
                  {processResult.message && (
                    <div><strong>Mensaje:</strong> {processResult.message}</div>
                  )}
                  {processResult.mensajePolizaAnterior && (
                    <div><strong>Estado Anterior:</strong> {processResult.mensajePolizaAnterior}</div>
                  )}
                </div>
              </div>

              {/* Botón para ver la nueva póliza (si es posible) */}
              {processResult.velneoPolizaId && (
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // TODO: Navegar a la vista de la nueva póliza o abrir en Velneo
                      toast('Funcionalidad de visualización en desarrollo', {
                        icon: 'ℹ️',
                        duration: 3000
                      });
                    }}
                  >
                    Ver Nueva Póliza
                  </Button>
                  
                  {/* Mostrar información adicional del resultado */}
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    <p><strong>ID Velneo Nueva:</strong> {processResult.velneoPolizaId}</p>
                    {processResult.vencimientoValidado && (
                      <p className="text-green-600">✓ Vencimiento validado correctamente</p>
                    )}
                    {processResult.polizaAnteriorActualizada && (
                      <p className="text-green-600">✓ Póliza anterior actualizada como antecedente</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ ESTADO DE REVISIÓN - Vista por defecto
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
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-sm text-gray-500">Cliente:</span>
                <p className="font-medium">{context.clienteInfo?.nombre || 'No especificado'}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Póliza Anterior:</span>
                <p className="font-medium">{context.polizaOriginal?.numero || context.polizaOriginal?.conpol || 'No especificada'}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">ID Velneo:</span>
                <p className="font-medium">{context.polizaOriginal?.id || 'No disponible'}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Vencimiento:</span>
                <p className="font-medium">{formatDate(context.polizaOriginal?.vencimiento || context.polizaOriginal?.confchhas)}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Sección:</span>
                <p className="font-medium">{context.seccionInfo?.nombre || 'No especificada'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nueva Póliza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Nueva Póliza (Renovación)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-sm text-gray-500">Número de Póliza:</span>
                <p className="font-medium">{extractedData.polizaNumber || extractedData.numeroPoliza || 'Se generará automáticamente'}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Vigencia Desde:</span>
                <p className="font-medium">{formatDate(extractedData.vigenciaDesde || extractedData.fechaDesde)}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Vigencia Hasta:</span>
                <p className="font-medium">{formatDate(extractedData.vigenciaHasta || extractedData.fechaHasta)}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Prima Total:</span>
                <p className="font-medium text-green-600">{formatCurrency(extractedData.prima || extractedData.premio)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información de la Compañía */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Compañía de Seguros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {context.companiaInfo && context.companiaId ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {context.companiaInfo.nombre}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Código: {context.companiaInfo.codigo} | ID: {context.companiaInfo.id}
                </p>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No se pudo detectar la compañía de seguros. Verifica que el documento sea válido.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Información de Procesamiento */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Una vez procesada, la renovación será definitiva. La póliza anterior será marcada como "Antecedente" y la nueva póliza será creada en Velneo con todos los datos validados.
        </AlertDescription>
      </Alert>

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
              disabled={!state.scan?.scanId || !context.polizaOriginal?.id}
            >
              <Send className="mr-2 h-5 w-5" />
              Procesar Renovación en Velneo
            </Button>

            {/* Mensajes de validación */}
            {!state.scan?.scanId && (
              <p className="text-sm text-red-600">
                No hay documento escaneado para procesar
              </p>
            )}

            {!context.polizaOriginal?.id && (
              <p className="text-sm text-red-600">
                No se encontró la póliza anterior para renovar
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer font-medium">Debug Renovaciones</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
            {JSON.stringify({
              scanId: state.scan?.scanId,
              polizaOriginalId: context.polizaOriginal?.id,
              polizaNumero: context.polizaOriginal?.numero || context.polizaOriginal?.conpol,
              clienteId: context.clienteId,
              companiaId: context.companiaId,
              extractedDataKeys: Object.keys(extractedData),
              masterDataKeys: Object.keys(masterData),
              contextKeys: Object.keys(context)
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}