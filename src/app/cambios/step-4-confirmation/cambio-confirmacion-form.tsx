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
  Loader2,
  Edit
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders, getAuthToken, handle401Error } from '../../../utils/auth-utils';
import { SuccessState } from '../step-4-confirmation/success-state';

interface CambioConfirmationFormProps {
  hookInstance: any;
}

interface ModifyPolizaResponse {
  success: boolean;
  message: string;
  velneoPolizaId?: number;
  polizaNumber?: string;
  errorMessage?: string;
  scanId?: number;
  polizaModificada?: boolean;
  mensajeModificacion?: string;
  cambiosAplicados?: string[];
  validationError?: string;
  warnings?: string[];
  createdAt?: string;
}

export function CambioConfirmationForm({ hookInstance }: CambioConfirmationFormProps) {
  const { state, reset, markProcessCompleted } = hookInstance;
  const [isProcessing, setIsProcessing] = useState(false);
  const [processCompleted, setProcessCompleted] = useState(false);
  const [processResult, setProcessResult] = useState<ModifyPolizaResponse | null>(null);

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
    return isNaN(num) ? 'No especificado' : `$${num.toLocaleString('es-UY', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return 'No especificado';
    try {
      if (typeof dateStr === 'string') {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-UY');
        }
      }
      return dateStr.toString();
    } catch {
      return 'Formato inválido';
    }
  };

  const handleProcessCambio = async () => {
    if (!state.scan?.scanId) {
      toast.error('No hay documento escaneado para procesar');
      return;
    }

    if (!context.polizaOriginal?.id) {
      toast.error('No se encontró la póliza original para modificar');
      return;
    }

    setIsProcessing(true);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const requestBody = {
        PolizaAnteriorId: context.polizaOriginal.id,
        TipoCambio: "MODIFICACION_GENERAL", // Tipo genérico de cambio
        ValidarVigencia: true,
        Observaciones: masterData.observaciones || null,
        ComentariosUsuario: masterData.comentarios || null,
        
        // Master data del frontend
        CombustibleId: masterData.combustibleId || null,
        CategoriaId: masterData.categoriaId || null, 
        DestinoId: masterData.destinoId || null,
        DepartamentoId: masterData.departamentoId || null,
        CalidadId: masterData.calidadId || null,
        TarifaId: masterData.tarifaId || null,
        CorredorId: masterData.corredorId || null,
        MonedaId: masterData.monedaId || null,

        // Extracted data del frontend
        NumeroPoliza: extractedData.numeroPoliza || extractedData.polizaNumber || null,
        FechaDesde: extractedData.fechaDesde || extractedData.vigenciaDesde || null,
        FechaHasta: extractedData.fechaHasta || extractedData.vigenciaHasta || null,
        Premio: extractedData.premio || extractedData.prima || null,
        MontoTotal: extractedData.montoTotal || extractedData.premioTotal || null,
        CantidadCuotas: extractedData.cantidadCuotas || null,
        ValorPorCuota: extractedData.valorPorCuota || extractedData.valorCuota || null,

        // Datos del vehículo (si se modificaron)
        VehiculoMarca: extractedData.vehiculoMarca || extractedData.VehiculoMarca || null,
        VehiculoModelo: extractedData.vehiculoModelo || extractedData.VehiculoModelo || null,
        VehiculoAno: extractedData.vehiculoAno || extractedData.vehiculoAño || extractedData.VehiculoAño || null,
        VehiculoPatente: extractedData.vehiculoPatente || extractedData.Patente || null,
        VehiculoChasis: extractedData.vehiculoChasis || extractedData.VehiculoChasis || null,
        VehiculoMotor: extractedData.vehiculoMotor || extractedData.VehiculoMotor || null,

        CamposCorregidos: [],
        ForzarCambio: false
      };

      console.log('📝 CAMBIOS - Request a enviar:', requestBody);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const response = await fetch(`${API_URL}/api/Document/${state.scan.scanId}/modify-in-velneo`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        handle401Error();
        return;
      }

      const result: ModifyPolizaResponse = await response.json();
      console.log('📋 CAMBIOS - Response del backend:', result);

      if (response.ok && result.success) {
        setProcessResult(result);
        setProcessCompleted(true);

        hookInstance.markProcessCompleted(result);
        
        toast.success(`Cambio completado exitosamente. Póliza modificada: ${result.polizaNumber || result.velneoPolizaId}`);
      } else {
        throw new Error(result.message || result.errorMessage || 'El cambio no se pudo procesar');
      }

    } catch (error: any) {
      console.error('❌ CAMBIOS - Error procesando:', error);
      
      const errorMessage = error.message || 'Error desconocido al procesar el cambio';
      toast.error(errorMessage);
      
      if (error.response) {
        console.error('❌ CAMBIOS - Response error details:', error.response);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartNewCambio = () => {
    reset();
    toast.success('¡Lista para nuevo cambio!');
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  // Estado de procesamiento
  if (isProcessing) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Procesando Cambio
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Este proceso puede tomar unos momentos...
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Loader2 className="h-16 w-16 text-purple-500 mx-auto mb-6 animate-spin" />
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Enviando cambio a Velneo
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Validando datos, aplicando modificaciones a la póliza existente...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado completado
  if (processCompleted && processResult) {
    return (
      <SuccessState 
        processResult={processResult}
        context={context}
        onStartNewCambio={handleStartNewCambio}
        onGoToDashboard={handleGoToDashboard}
      />
    );
  }

  // Estado de revisión - Vista por defecto
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Confirmar Cambio
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Revisa toda la información antes de procesar el cambio en Velneo
        </p>
      </div>

      {/* Información de la Póliza Original vs Modificada */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Póliza Original */}
        <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900/10 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              Póliza Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Número:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {context.polizaOriginal?.numero || context.polizaOriginal?.conpol || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Vencimiento:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {formatDate(context.polizaOriginal?.vencimiento)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Estado:</span>
                <span className="text-green-600 dark:text-green-400">
                  Vigente
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos Modificados */}
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Modificaciones a Aplicar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Número:</span>
                <span className="text-purple-700 dark:text-purple-300">
                  {extractedData.numeroPoliza || extractedData.polizaNumber || 'Sin cambios'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Nueva Vigencia:</span>
                <span>
                  {formatDate(extractedData.fechaDesde || extractedData.vigenciaDesde)} - {formatDate(extractedData.fechaHasta || extractedData.vigenciaHasta)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Premio Total:</span>
                <span className="text-purple-700 dark:text-purple-300 font-semibold">
                  {formatCurrency(extractedData.montoTotal || extractedData.premioTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información de la Compañía */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Compañía de Seguros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-center">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {context.companiaInfo?.nombre || 'COMPAÑÍA NO IDENTIFICADA'}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de confirmación */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">¿Procesar Cambio?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Una vez procesado, el cambio será definitivo y no podrá modificarse desde aquí.
              </p>
            </div>

            <Button 
              onClick={handleProcessCambio}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={!state.scan?.scanId || !context.polizaOriginal?.id}
            >
              <Send className="mr-2 h-5 w-5" />
              Procesar Cambio en Velneo
            </Button>

            {/* Mensajes de validación */}
            {!state.scan?.scanId && (
              <p className="text-sm text-red-600">
                No hay documento escaneado para procesar
              </p>
            )}

            {!context.polizaOriginal?.id && (
              <p className="text-sm text-red-600">
                No se encontró la póliza original para modificar
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}