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
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders, getAuthToken, handle401Error } from '../../../utils/auth-utils';
import { SuccessState } from './success-state';

interface RenovacionConfirmationFormProps {
  hookInstance: any;
}

interface RenewPolizaResponse {
  success: boolean;
  message: string;
  velneoPolizaId?: number;
  polizaNumber?: string;
  errorMessage?: string;
  scanId?: number;
  polizaAnteriorId?: number;
  polizaAnteriorActualizada?: boolean;
  mensajePolizaAnterior?: string;
  vencimientoValidado?: boolean;
  fechaVencimientoAnterior?: string;
  validationError?: string;
  warnings?: string[];
  createdAt?: string;
}

export function RenovacionConfirmationForm({ hookInstance }: RenovacionConfirmationFormProps) {
  const { state, reset, markProcessCompleted } = hookInstance;
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

  const handleProcessRenovacion = async () => {
    if (!state.scan?.scanId) {
      toast.error('No hay documento escaneado para procesar');
      return;
    }

    if (!context.polizaOriginal?.id) {
      toast.error('No se encontró la póliza anterior para renovar');
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
        ValidarVencimiento: true,
        Observaciones: masterData.observaciones || null,
        ComentariosUsuario: masterData.comentarios || null,

        CombustibleId: masterData.combustibleId || null,
        CategoriaId: masterData.categoriaId || null, 
        DestinoId: masterData.destinoId || null,
        DepartamentoId: masterData.departamentoId || null,
        CalidadId: masterData.calidadId || null,
        TarifaId: masterData.tarifaId || null,
        CorredorId: masterData.corredorId || null,
        MonedaId: masterData.monedaId || null,

        NumeroPoliza: extractedData.numeroPoliza || extractedData.polizaNumber || null,
        FechaDesde: extractedData.fechaDesde || extractedData.vigenciaDesde || null,
        FechaHasta: extractedData.fechaHasta || extractedData.vigenciaHasta || null,
        Premio: extractedData.premio || extractedData.prima || null,
        MontoTotal: extractedData.montoTotal || extractedData.premioTotal || null,
        CantidadCuotas: extractedData.cantidadCuotas || null,
        ValorPorCuota: extractedData.valorPorCuota || extractedData.valorCuota || null,

        VehiculoMarca: extractedData.vehiculoMarca || extractedData.VehiculoMarca || null,
        VehiculoModelo: extractedData.vehiculoModelo || extractedData.VehiculoModelo || null,
        VehiculoAno: extractedData.vehiculoAno || extractedData.vehiculoAño || extractedData.VehiculoAño || null,
        VehiculoPatente: extractedData.vehiculoPatente || extractedData.Patente || null,
        VehiculoChasis: extractedData.vehiculoChasis || extractedData.VehiculoChasis || null,
        VehiculoMotor: extractedData.vehiculoMotor || extractedData.VehiculoMotor || null,

        CamposCorregidos: [],
        ForzarRenovacion: false
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const response = await fetch(`${API_URL}/api/Document/${state.scan.scanId}/renew-in-velneo`, {
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

      const result: RenewPolizaResponse = await response.json();

      if (response.ok && result.success) {
        setProcessResult(result);
        setProcessCompleted(true);

        hookInstance.markProcessCompleted(result);
        
        toast.success(`Renovación completada exitosamente. Nueva póliza: ${result.polizaNumber || result.velneoPolizaId}`);
      } else {
        throw new Error(result.message || result.errorMessage || 'La renovación no se pudo procesar');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido al procesar la renovación';
      toast.error(errorMessage);
      
      if (error.response) {
        console.error('❌ RENOVACIONES - Response error details:', error.response);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartNewRenovation = () => {
    reset();
    toast.success('¡Lista para nueva renovación!');
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  if (isProcessing) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Procesando Renovación
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Este proceso puede tomar unos momentos...
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-6 animate-spin" />
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Enviando renovación a Velneo
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Validando datos, creando nueva póliza y marcando la anterior como antecedente...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (processCompleted && processResult) {
    return (
      <SuccessState 
        processResult={processResult}
        context={context}
        onStartNewRenovation={handleStartNewRenovation}
        onGoToDashboard={handleGoToDashboard}
      />
    );
  }

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

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Póliza Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Número:</span>
                <span className="text-blue-700 dark:text-blue-300">
                  {context.polizaOriginal?.numero || context.polizaOriginal?.conpol || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Vencimiento:</span>
                <span className="text-red-600 dark:text-red-400">
                  {formatDate(context.polizaOriginal?.vencimiento)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Cobertura:</span>
                <span>
                  {context.polizaOriginal?.cobertura || 'No especificada'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center font-medium">
                Será marcada como "Antecedente"
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              Nueva Póliza (Renovación)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Número:</span>
                <span className="text-green-700 dark:text-green-300">
                  {extractedData.numeroPoliza || extractedData.polizaNumber || 'Se generará automáticamente'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Vigencia:</span>
                <span>
                  {formatDate(extractedData.fechaDesde || extractedData.vigenciaDesde)} - {formatDate(extractedData.fechaHasta || extractedData.vigenciaHasta)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Premio Total:</span>
                <span className="text-green-700 dark:text-green-300 font-semibold">
                  {formatCurrency(extractedData.montoTotal || extractedData.premioTotal)}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs text-green-700 dark:text-green-300 text-center font-medium">
                Será creada como póliza activa
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Una vez procesada, la renovación será definitiva. La póliza anterior será marcada como "Antecedente" y la nueva póliza será creada en Velneo con todos los datos validados.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">¿Procesar Renovación?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Una vez procesada, la renovación será definitiva y no podrá modificarse desde aquí.
              </p>
            </div>

            <Button 
              onClick={handleProcessRenovacion}
              size="lg"
              className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={!state.scan?.scanId || !context.polizaOriginal?.id}
            >
              <Send className="mr-2 h-5 w-5" />
              Procesar Renovación en Velneo
            </Button>

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
    </div>
  );
}